import { useStore } from '../store';

export function ControlPanel() {
  const params = useStore((s) => s.params);
  const models = useStore((s) => s.models);
  const updateParams = useStore((s) => s.updateParams);
  const processSingle = useStore((s) => s.processSingle);
  const processAll = useStore((s) => s.processAll);
  const isProcessing = useStore((s) => s.isProcessing);
  const selectedId = useStore((s) => s.selectedId);
  const images = useStore((s) => s.images);

  const selected = images.find((i) => i.id === selectedId);
  const hasImages = images.length > 0;
  const canProcess = selected && (selected.status === 'pending' || selected.status === 'failed');

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
        Background Removal
      </h3>

      {/* Model selector */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Model</label>
        <select
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
          value={params.model}
          onChange={(e) => updateParams({ model: e.target.value })}
        >
          {models.length > 0
            ? models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))
            : ['u2net', 'u2net_human_seg', 'isnet-general-use', 'silueta'].map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
        </select>
      </div>

      {/* Threshold slider */}
      <div>
        <label className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Edge Threshold</span>
          <span>{params.threshold}</span>
        </label>
        <input
          type="range"
          min={0}
          max={255}
          value={params.threshold}
          onChange={(e) => updateParams({ threshold: Number(e.target.value) })}
          className="w-full accent-indigo-500"
        />
      </div>

      {/* Smoothing slider */}
      <div>
        <label className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Edge Smoothing</span>
          <span>{params.smoothing}</span>
        </label>
        <input
          type="range"
          min={0}
          max={10}
          value={params.smoothing}
          onChange={(e) => updateParams({ smoothing: Number(e.target.value) })}
          className="w-full accent-indigo-500"
        />
      </div>

      {/* Process buttons */}
      <div className="flex flex-col gap-2 mt-2">
        <button
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded transition-colors"
          disabled={!canProcess || isProcessing}
          onClick={() => selectedId && processSingle(selectedId)}
        >
          {selected?.status === 'processing' ? 'Processing...' : 'Remove Background'}
        </button>
        <button
          className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-gray-200 text-sm font-medium rounded transition-colors"
          disabled={!hasImages || isProcessing}
          onClick={processAll}
        >
          Process All ({images.filter((i) => i.status === 'pending' || i.status === 'failed').length})
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700 my-1" />

      {/* Export section */}
      <ExportSection />
    </div>
  );
}

function ExportSection() {
  const exportConfig = useStore((s) => s.exportConfig);
  const updateExportConfig = useStore((s) => s.updateExportConfig);
  const exportSingle = useStore((s) => s.exportSingle);
  const exportAll = useStore((s) => s.exportAll);
  const selectedId = useStore((s) => s.selectedId);
  const images = useStore((s) => s.images);

  const selected = images.find((i) => i.id === selectedId);
  const canExport = selected?.status === 'done';
  const doneCount = images.filter((i) => i.status === 'done').length;

  return (
    <>
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
        Export
      </h3>

      {/* Format */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Format</label>
        <select
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
          value={exportConfig.format}
          onChange={(e) => updateExportConfig({ format: e.target.value as any })}
        >
          <option value="png">PNG (Transparent)</option>
          <option value="webp">WebP</option>
          <option value="tga">TGA</option>
        </select>
      </div>

      {/* Quality (WebP) */}
      {exportConfig.format === 'webp' && (
        <div>
          <label className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Quality</span>
            <span>{exportConfig.quality}</span>
          </label>
          <input
            type="range"
            min={1}
            max={100}
            value={exportConfig.quality}
            onChange={(e) => updateExportConfig({ quality: Number(e.target.value) })}
            className="w-full accent-indigo-500"
          />
        </div>
      )}

      {/* Naming template */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Naming Template</label>
        <input
          type="text"
          value={exportConfig.namingTemplate}
          onChange={(e) => updateExportConfig({ namingTemplate: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
          placeholder="{original}_nobg"
        />
        <p className="text-xs text-gray-500 mt-1">
          {'{original}'} {'{seq:03d}'}
        </p>
      </div>

      {/* Export buttons */}
      <div className="flex flex-col gap-2 mt-2">
        <button
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded transition-colors"
          disabled={!canExport}
          onClick={() => selectedId && exportSingle(selectedId)}
        >
          Export Selected
        </button>
        <button
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-gray-200 text-sm font-medium rounded transition-colors"
          disabled={doneCount === 0}
          onClick={exportAll}
        >
          Export All ({doneCount})
        </button>
      </div>
    </>
  );
}
