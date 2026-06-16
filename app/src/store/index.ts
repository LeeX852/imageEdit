import { create } from 'zustand';
import type { ImageItem, RemovalParams, ExportConfig, ModelInfo, AppSettings } from '../types';
import { api } from '../api/client';

let nextId = 1;
function genId() {
  return `img_${nextId++}`;
}

function createThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const scale = Math.min(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface AppState {
  // Images
  images: ImageItem[];
  selectedId: string | null;

  // Processing params
  params: RemovalParams;

  // Export
  exportConfig: ExportConfig;

  // Models
  models: ModelInfo[];

  // Settings
  settings: AppSettings;

  // UI state
  isProcessing: boolean;
  currentBatchId: string | null;
  backendConnected: boolean;
  settingsOpen: boolean;

  // Actions
  addImages: (files: File[]) => Promise<void>;
  removeImage: (id: string) => void;
  clearImages: () => void;
  selectImage: (id: string | null) => void;
  updateParams: (params: Partial<RemovalParams>) => void;
  updateExportConfig: (config: Partial<ExportConfig>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleSettings: () => void;

  // Processing
  processSingle: (id: string) => Promise<void>;
  processAll: () => Promise<void>;
  cancelBatch: () => Promise<void>;
  retryFailed: () => Promise<void>;

  // Backend
  checkBackend: () => Promise<void>;
  loadModels: () => Promise<void>;

  // Export
  exportSingle: (id: string) => Promise<void>;
  exportAll: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  images: [],
  selectedId: null,
  params: { model: 'u2net', threshold: 128, smoothing: 0 },
  exportConfig: {
    format: 'png',
    quality: 95,
    width: null,
    height: null,
    namingTemplate: '{original}_nobg',
    outputDir: '',
  },
  models: [],
  settings: {
    defaultModel: 'u2net',
    concurrency: 2,
    defaultOutputDir: '',
    defaultFormat: 'png',
  },
  isProcessing: false,
  currentBatchId: null,
  backendConnected: false,
  settingsOpen: false,

  addImages: async (files) => {
    const validExts = ['png', 'jpg', 'jpeg', 'bmp', 'webp', 'tiff', 'gif'];
    const items: ImageItem[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!validExts.includes(ext)) continue;

      const id = genId();
      const thumbnail = await createThumbnail(file);
      items.push({
        id,
        file,
        name: file.name,
        originalUrl: URL.createObjectURL(file),
        processedUrl: null,
        status: 'pending',
        processingTime: 0,
        error: null,
        thumbnail,
      });
    }

    set((s) => ({
      images: [...s.images, ...items],
      selectedId: s.selectedId || items[0]?.id || null,
    }));
  },

  removeImage: (id) => {
    set((s) => {
      const img = s.images.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.originalUrl);
        if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
      }
      const images = s.images.filter((i) => i.id !== id);
      return {
        images,
        selectedId: s.selectedId === id ? (images[0]?.id || null) : s.selectedId,
      };
    });
  },

  clearImages: () => {
    const { images } = get();
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl);
      if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
    });
    set({ images: [], selectedId: null });
  },

  selectImage: (id) => set({ selectedId: id }),

  updateParams: (params) =>
    set((s) => ({ params: { ...s.params, ...params } })),

  updateExportConfig: (config) =>
    set((s) => ({ exportConfig: { ...s.exportConfig, ...config } })),

  updateSettings: (settings) =>
    set((s) => ({ settings: { ...s.settings, ...settings } })),

  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),

  processSingle: async (id) => {
    const { images, params } = get();
    const img = images.find((i) => i.id === id);
    if (!img) return;

    set((s) => ({
      images: s.images.map((i) =>
        i.id === id ? { ...i, status: 'processing' as const, error: null } : i
      ),
    }));

    try {
      const start = performance.now();
      const blob = await api.removeBackground(img.file, params);
      const elapsed = (performance.now() - start) / 1000;
      const url = URL.createObjectURL(blob);

      set((s) => ({
        images: s.images.map((i) =>
          i.id === id
            ? { ...i, processedUrl: url, status: 'done' as const, processingTime: elapsed }
            : i
        ),
      }));
    } catch (e) {
      set((s) => ({
        images: s.images.map((i) =>
          i.id === id
            ? { ...i, status: 'failed' as const, error: String(e) }
            : i
        ),
      }));
    }
  },

  processAll: async () => {
    const { images, params } = get();
    const pending = images.filter((i) => i.status === 'pending' || i.status === 'failed');
    if (pending.length === 0) return;

    set({ isProcessing: true });

    try {
      const result = await api.startBatch(
        pending.map((i) => i.file),
        params,
      );
      set({ currentBatchId: result.batch_id });

      // Poll for status
      const poll = async () => {
        const { currentBatchId } = get();
        if (!currentBatchId) return;

        const status = await api.getBatchStatus(currentBatchId);

        // Update individual task statuses
        for (const task of status.tasks) {
          const idx = pending.findIndex((p) => p.name === task.filename);
          if (idx === -1) continue;
          const imgId = pending[idx].id;

          if (task.status === 'done') {
            try {
              const blob = await api.getBatchResult(currentBatchId, task.task_id);
              const url = URL.createObjectURL(blob);
              set((s) => ({
                images: s.images.map((i) =>
                  i.id === imgId
                    ? { ...i, processedUrl: url, status: 'done', processingTime: task.processing_time }
                    : i
                ),
              }));
            } catch { /* skip */ }
          } else if (task.status === 'failed') {
            set((s) => ({
              images: s.images.map((i) =>
                i.id === imgId
                  ? { ...i, status: 'failed', error: task.error }
                  : i
              ),
            }));
          }
        }

        if (!status.is_done) {
          setTimeout(poll, 500);
        } else {
          set({ isProcessing: false, currentBatchId: null });
        }
      };

      poll();
    } catch (e) {
      console.error('Batch failed:', e);
      set({ isProcessing: false, currentBatchId: null });
    }
  },

  cancelBatch: async () => {
    const { currentBatchId } = get();
    if (!currentBatchId) return;
    try {
      await api.cancelBatch(currentBatchId);
    } catch { /* ignore */ }
    set({ isProcessing: false, currentBatchId: null });
  },

  retryFailed: async () => {
    const { images } = get();
    const failed = images.filter((i) => i.status === 'failed');
    if (failed.length === 0) return;

    set((s) => ({
      images: s.images.map((i) =>
        i.status === 'failed' ? { ...i, status: 'pending' as const, error: null } : i
      ),
    }));

    await get().processAll();
  },

  checkBackend: async () => {
    const connected = await api.checkHealth();
    set({ backendConnected: connected });
  },

  loadModels: async () => {
    try {
      const data = await api.getModels();
      set({
        models: data.models,
        params: { ...get().params, model: data.active_model },
      });
    } catch { /* ignore */ }
  },

  exportSingle: async (id) => {
    const { images, exportConfig } = get();
    const img = images.find((i) => i.id === id);
    if (!img || !img.processedUrl) return;

    // Download the processed image
    const a = document.createElement('a');
    a.href = img.processedUrl;
    const nameBase = img.name.replace(/\.[^.]+$/, '');
    a.download = `${nameBase}_nobg.${exportConfig.format}`;
    a.click();
  },

  exportAll: async () => {
    const { images } = get();
    const done = images.filter((i) => i.status === 'done' && i.processedUrl);
    for (const img of done) {
      await get().exportSingle(img.id);
    }
  },
}));
