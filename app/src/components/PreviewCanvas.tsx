import { useRef, useState, useCallback, useEffect, type WheelEvent, type MouseEvent } from 'react';
import { useStore } from '../store';

export function PreviewCanvas() {
  const selectedId = useStore((s) => s.selectedId);
  const images = useStore((s) => s.images);
  const selected = images.find((i) => i.id === selectedId);

  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // View mode: 'original' | 'processed' | 'compare'
  const [viewMode, setViewMode] = useState<'original' | 'processed' | 'compare'>('original');
  const [comparePos, setComparePos] = useState(50);
  const isDraggingCompare = useRef(false);

  // Reset view when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setViewMode(selected?.processedUrl ? 'processed' : 'original');
  }, [selectedId, selected?.processedUrl]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.1, Math.min(20, z * delta)));
  }, []);

  const handleMiddleDown = useCallback((e: MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    }
  }, [pan]);

  const handleMiddleMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setPan({
        x: panStart.current.panX + (e.clientX - panStart.current.x),
        y: panStart.current.panY + (e.clientY - panStart.current.y),
      });
    }
  }, [isPanning]);

  const handleMiddleUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleFit = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Compare slider drag
  const handleCompareDown = useCallback((e: MouseEvent) => {
    if (viewMode === 'compare') {
      isDraggingCompare.current = true;
      e.preventDefault();
    }
  }, [viewMode]);

  const handleCompareMove = useCallback((e: MouseEvent) => {
    if (!isDraggingCompare.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setComparePos(Math.max(5, Math.min(95, pct)));
  }, []);

  const handleCompareUp = useCallback(() => {
    isDraggingCompare.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleCompareMove as any);
    window.addEventListener('mouseup', handleCompareUp);
    return () => {
      window.removeEventListener('mousemove', handleCompareMove as any);
      window.removeEventListener('mouseup', handleCompareUp);
    };
  }, [handleCompareMove, handleCompareUp]);

  if (!selected) return null;

  const showOriginal = viewMode === 'original' || viewMode === 'compare';
  const showProcessed = viewMode === 'processed' || viewMode === 'compare';

  return (
    <div className="flex flex-col h-full">
      {/* View mode toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border-b border-gray-700">
        {['original', 'processed', 'compare'].map((mode) => (
          <button
            key={mode}
            className={`px-3 py-1 text-xs rounded ${
              viewMode === mode
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } ${mode === 'compare' && !selected.processedUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => setViewMode(mode as any)}
            disabled={mode === 'compare' && !selected.processedUrl}
          >
            {mode === 'original' ? 'Original' : mode === 'processed' ? 'Result' : 'Compare'}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-xs text-gray-400">{Math.round(zoom * 100)}%</span>
        <button
          className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
          onClick={handleFit}
        >
          Fit
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative cursor-grab"
        style={{
          backgroundImage:
            'linear-gradient(45deg, #1a1a2e 25%, transparent 25%), linear-gradient(-45deg, #1a1a2e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a2e 75%), linear-gradient(-45deg, transparent 75%, #1a1a2e 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          backgroundColor: '#16161e',
        }}
        onWheel={handleWheel}
        onMouseDown={(e) => {
          handleMiddleDown(e);
          handleCompareDown(e);
        }}
        onMouseMove={handleMiddleMove}
        onMouseUp={handleMiddleUp}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {viewMode === 'compare' && selected.processedUrl ? (
            <div className="relative">
              {/* Original (full width, clipped) */}
              <img
                src={selected.originalUrl}
                alt="Original"
                className="max-h-[70vh] max-w-full object-contain"
                style={{ clipPath: `inset(0 ${100 - comparePos}% 0 0)` }}
                draggable={false}
              />
              {/* Processed (full width, clipped) */}
              <img
                src={selected.processedUrl}
                alt="Processed"
                className="absolute inset-0 max-h-[70vh] max-w-full object-contain"
                style={{ clipPath: `inset(0 0 0 ${comparePos}%)` }}
                draggable={false}
              />
              {/* Divider */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/80 cursor-ew-resize"
                style={{ left: `${comparePos}%` }}
              />
            </div>
          ) : (
            <img
              src={
                viewMode === 'processed' && selected.processedUrl
                  ? selected.processedUrl
                  : selected.originalUrl
              }
              alt={selected.name}
              className="max-h-[70vh] max-w-full object-contain"
              draggable={false}
            />
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-gray-800/50 border-t border-gray-700 text-xs text-gray-400">
        <span>{selected.name}</span>
        {selected.status === 'done' && (
          <span className="text-green-400">Processed in {selected.processingTime.toFixed(1)}s</span>
        )}
        {selected.status === 'processing' && (
          <span className="text-yellow-400">Processing...</span>
        )}
        {selected.status === 'failed' && (
          <span className="text-red-400">Failed: {selected.error}</span>
        )}
      </div>
    </div>
  );
}
