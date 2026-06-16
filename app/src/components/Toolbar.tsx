import { useStore } from '../store';

export function Toolbar() {
  const backendConnected = useStore((s) => s.backendConnected);
  const toggleSettings = useStore((s) => s.toggleSettings);
  const addImages = useStore((s) => s.addImages);
  const clearImages = useStore((s) => s.clearImages);
  const images = useStore((s) => s.images);

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/png,image/jpeg,image/bmp,image/webp,image/tiff,image/gif';
    input.onchange = () => {
      if (input.files) addImages(Array.from(input.files));
    };
    input.click();
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
      {/* Left: App title */}
      <div className="flex items-center gap-3">
        <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-semibold text-gray-200">Game Asset Processor</span>
      </div>

      {/* Center: Actions */}
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
          onClick={handleImport}
        >
          Import
        </button>
        {images.length > 0 && (
          <button
            className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            onClick={clearImages}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Right: Status & Settings */}
      <div className="flex items-center gap-3">
        {/* Backend status */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${
              backendConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-gray-400">
            {backendConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Settings button */}
        <button
          className="p-1.5 text-gray-400 hover:text-gray-200 rounded hover:bg-gray-800 transition-colors"
          onClick={toggleSettings}
          title="Settings"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
