import { useStore } from '../store';

export function QueuePanel() {
  const images = useStore((s) => s.images);
  const selectedId = useStore((s) => s.selectedId);
  const selectImage = useStore((s) => s.selectImage);
  const removeImage = useStore((s) => s.removeImage);
  const isProcessing = useStore((s) => s.isProcessing);
  const cancelBatch = useStore((s) => s.cancelBatch);
  const retryFailed = useStore((s) => s.retryFailed);

  const doneCount = images.filter((i) => i.status === 'done').length;
  const failedCount = images.filter((i) => i.status === 'failed').length;
  const total = images.length;
  const progressPct = total > 0 ? Math.round(((doneCount + failedCount) / total) * 100) : 0;

  if (images.length === 0) return null;

  return (
    <div className="flex flex-col bg-gray-900 border-t border-gray-700" style={{ height: '200px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-300 uppercase">
            Queue ({total})
          </span>
          {isProcessing && (
            <span className="text-xs text-yellow-400">
              {doneCount + failedCount}/{total} ({progressPct}%)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isProcessing && (
            <button
              className="px-2 py-1 text-xs bg-red-600/80 hover:bg-red-500 text-white rounded"
              onClick={cancelBatch}
            >
              Cancel
            </button>
          )}
          {failedCount > 0 && !isProcessing && (
            <button
              className="px-2 py-1 text-xs bg-yellow-600/80 hover:bg-yellow-500 text-white rounded"
              onClick={retryFailed}
            >
              Retry Failed ({failedCount})
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {isProcessing && (
        <div className="h-0.5 bg-gray-800">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Queue list */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-1 p-2 h-full">
          {images.map((img) => (
            <div
              key={img.id}
              className={`flex-shrink-0 flex flex-col items-center gap-1 p-1.5 rounded cursor-pointer transition-colors ${
                selectedId === img.id
                  ? 'bg-indigo-600/30 ring-1 ring-indigo-500'
                  : 'hover:bg-gray-800'
              }`}
              style={{ width: '80px' }}
              onClick={() => selectImage(img.id)}
            >
              {/* Thumbnail */}
              <div className="relative w-14 h-14 rounded overflow-hidden bg-gray-800">
                <img
                  src={img.thumbnail}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                {/* Status overlay */}
                {img.status === 'processing' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {img.status === 'done' && (
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {img.status === 'failed' && (
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>
              {/* Filename */}
              <span className="text-[10px] text-gray-400 text-center truncate w-full" title={img.name}>
                {img.name}
              </span>
              {/* Processing time */}
              {img.status === 'done' && img.processingTime > 0 && (
                <span className="text-[9px] text-gray-500">{img.processingTime.toFixed(1)}s</span>
              )}
              {/* Remove button */}
              <button
                className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gray-700 hover:bg-red-600 rounded-full text-[8px] text-gray-400 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(img.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
