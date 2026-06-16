import { useCallback, useState } from 'react';
import { useStore } from '../store';

export function DropZone() {
  const addImages = useStore((s) => s.addImages);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      addImages(Array.from(files));
    },
    [addImages],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files: File[] = [];
      for (const item of Array.from(e.dataTransfer.items)) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length) handleFiles(files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/png,image/jpeg,image/bmp,image/webp,image/tiff,image/gif';
    input.onchange = () => {
      if (input.files) handleFiles(input.files);
    };
    input.click();
  }, [handleFiles]);

  return (
    <div
      className={`flex flex-col items-center justify-center h-full cursor-pointer transition-all duration-200 ${
        isDragOver
          ? 'border-2 border-dashed border-blue-400 bg-blue-400/10'
          : 'border-2 border-dashed border-gray-600 hover:border-gray-400 hover:bg-white/5'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <svg
        className="w-16 h-16 mb-4 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 16V4m0 0L8 8m4-4l4 4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"
        />
      </svg>
      <p className="text-lg text-gray-300">
        {isDragOver ? 'Drop to import' : 'Drag images here or click to import'}
      </p>
      <p className="text-sm text-gray-500 mt-2">
        PNG, JPG, BMP, WebP, TIFF, GIF
      </p>
    </div>
  );
}
