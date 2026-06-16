import { useStore } from '../store';

export function SettingsPanel() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const settingsOpen = useStore((s) => s.settingsOpen);
  const toggleSettings = useStore((s) => s.toggleSettings);
  const models = useStore((s) => s.models);

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={toggleSettings}>
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-[400px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-200">Settings</h2>
          <button
            className="text-gray-400 hover:text-gray-200"
            onClick={toggleSettings}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-4 p-4">
          {/* Default model */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Default Model</label>
            <select
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              value={settings.defaultModel}
              onChange={(e) => updateSettings({ defaultModel: e.target.value })}
            >
              {models.length > 0
                ? models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))
                : ['u2net', 'u2net_human_seg', 'isnet-general-use', 'silueta'].map((id) => (
                    <option key={id} value={id}>{id}</option>
                  ))}
            </select>
          </div>

          {/* Concurrency */}
          <div>
            <label className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Batch Concurrency</span>
              <span>{settings.concurrency}</span>
            </label>
            <input
              type="range"
              min={1}
              max={8}
              value={settings.concurrency}
              onChange={(e) => updateSettings({ concurrency: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Default format */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Default Export Format</label>
            <select
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              value={settings.defaultFormat}
              onChange={(e) => updateSettings({ defaultFormat: e.target.value as any })}
            >
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
              <option value="tga">TGA</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end px-4 py-3 border-t border-gray-700">
          <button
            className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            onClick={toggleSettings}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
