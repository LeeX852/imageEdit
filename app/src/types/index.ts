/** Image item in the processing queue */
export interface ImageItem {
  id: string;
  file: File;
  name: string;
  originalUrl: string;    // Object URL for original image
  processedUrl: string | null;  // Object URL for processed image
  status: 'pending' | 'processing' | 'done' | 'failed' | 'cancelled';
  processingTime: number;
  error: string | null;
  thumbnail: string;      // Base64 thumbnail
}

/** Background removal parameters */
export interface RemovalParams {
  model: string;
  threshold: number;
  smoothing: number;
}

/** Export configuration */
export interface ExportConfig {
  format: 'png' | 'webp' | 'tga';
  quality: number;
  width: number | null;
  height: number | null;
  namingTemplate: string;
  outputDir: string;
}

/** Model info from backend */
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

/** Batch status from backend */
export interface BatchStatus {
  batch_id: string;
  total: number;
  completed: number;
  is_cancelled: boolean;
  is_done: boolean;
  tasks: {
    task_id: string;
    filename: string;
    status: string;
    processing_time: number;
    error: string | null;
  }[];
}

/** App settings */
export interface AppSettings {
  defaultModel: string;
  concurrency: number;
  defaultOutputDir: string;
  defaultFormat: 'png' | 'webp' | 'tga';
}
