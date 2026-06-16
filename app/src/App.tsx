import { useEffect, useCallback } from 'react';
import { useStore } from './store';
import { Toolbar } from './components/Toolbar';
import { DropZone } from './components/DropZone';
import { PreviewCanvas } from './components/PreviewCanvas';
import { ControlPanel } from './components/ControlPanel';
import { QueuePanel } from './components/QueuePanel';
import { SettingsPanel } from './components/SettingsPanel';

function App() {
  const images = useStore((s) => s.images);
  const addImages = useStore((s) => s.addImages);
  const checkBackend = useStore((s) => s.checkBackend);
  const loadModels = useStore((s) => s.loadModels);
  const backendConnected = useStore((s) => s.backendConnected);
  const processSingle = useStore((s) => s.processSingle);
  const exportSingle = useStore((s) => s.exportSingle);
  const selectedId = useStore((s) => s.selectedId);

  // Check backend on mount
  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, [checkBackend]);

  // Load models when connected
  useEffect(() => {
    if (backendConnected) loadModels();
  }, [backendConnected, loadModels]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ctrl+O: Import
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/png,image/jpeg,image/bmp,image/webp,image/tiff,image/gif';
        input.onchange = () => {
          if (input.files) addImages(Array.from(input.files));
        };
        input.click();
      }
      // Ctrl+S: Export selected
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (selectedId) exportSingle(selectedId);
      }
      // Ctrl+Enter: Process all
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        useStore.getState().processAll();
      }
      // Delete: Remove selected
      if (e.key === 'Delete' && selectedId) {
        e.preventDefault();
        useStore.getState().removeImage(selectedId);
      }
    },
    [addImages, exportSingle, selectedId],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Global drag-and-drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files: File[] = [];
      for (const item of Array.from(e.dataTransfer.items)) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length) addImages(files);
    },
    [addImages],
  );

  const hasImages = images.length > 0;

  return (
    <div
      className="flex flex-col h-screen bg-[var(--color-bg)] text-[var(--color-text)]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Top toolbar */}
      <Toolbar />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Preview area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {hasImages ? (
            <PreviewCanvas />
          ) : (
            <DropZone />
          )}
        </div>

        {/* Right: Control panel */}
        <div className="w-64 bg-gray-900 border-l border-gray-700 flex-shrink-0 overflow-hidden flex flex-col">
          {hasImages ? (
            <ControlPanel />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Import images to get started
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Queue panel */}
      <QueuePanel />

      {/* Settings modal */}
      <SettingsPanel />
    </div>
  );
}

export default App;
