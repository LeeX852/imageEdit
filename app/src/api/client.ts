import type { RemovalParams, ModelInfo, BatchStatus } from '../types';

const API_BASE = 'http://localhost:8000';

async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function removeBackground(
  file: File,
  params: RemovalParams,
): Promise<Blob> {
  const form = new FormData();
  form.append('file', file);
  form.append('model', params.model);
  form.append('threshold', String(params.threshold));
  form.append('smoothing', String(params.smoothing));

  const res = await fetch(`${API_BASE}/api/remove-background`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || 'Processing failed');
  }

  return res.blob();
}

async function getModels(): Promise<{ models: ModelInfo[]; active_model: string }> {
  const res = await fetch(`${API_BASE}/api/models`);
  if (!res.ok) throw new Error('Failed to fetch models');
  return res.json();
}

async function activateModel(modelId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/models/${modelId}/activate`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to activate model');
}

async function startBatch(
  files: File[],
  params: RemovalParams,
): Promise<{ batch_id: string; total: number }> {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  form.append('model', params.model);
  form.append('threshold', String(params.threshold));
  form.append('smoothing', String(params.smoothing));

  const res = await fetch(`${API_BASE}/api/batch/remove-background`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || 'Batch start failed');
  }

  return res.json();
}

async function getBatchStatus(batchId: string): Promise<BatchStatus> {
  const res = await fetch(`${API_BASE}/api/batch/${batchId}/status`);
  if (!res.ok) throw new Error('Failed to get batch status');
  return res.json();
}

async function cancelBatch(batchId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/batch/${batchId}/cancel`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to cancel batch');
}

function streamBatchStatus(
  batchId: string,
  onUpdate: (status: BatchStatus) => void,
  onDone: () => void,
): EventSource {
  const es = new EventSource(`${API_BASE}/api/batch/${batchId}/stream`);
  es.onmessage = (e) => {
    try {
      onUpdate(JSON.parse(e.data));
    } catch { /* ignore parse errors */ }
  };
  es.addEventListener('done', () => {
    es.close();
    onDone();
  });
  es.onerror = () => {
    es.close();
  };
  return es;
}

async function getBatchResult(batchId: string, taskId: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/batch/${batchId}/result/${taskId}`);
  if (!res.ok) throw new Error('Failed to get result');
  return res.blob();
}

export const api = {
  checkHealth,
  removeBackground,
  getModels,
  activateModel,
  startBatch,
  getBatchStatus,
  cancelBatch,
  streamBatchStatus,
  getBatchResult,
};
