'use client';

import { RefObject } from 'react';

interface UploadTabProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function UploadTab({ fileInputRef, onFileUpload }: UploadTabProps) {
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="w-full max-w-lg">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Choose Audio File
        </label>
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*"
            onChange={onFileUpload}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-gradient-to-r file:from-violet-600 file:to-indigo-600 file:text-white hover:file:from-violet-700 hover:file:to-indigo-700 file:transition-all file:duration-200 bg-gray-800 border border-gray-700 rounded-xl p-3"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Supported: AAC, FLAC, MP3, M4A, MPEG, MPGA, MP4, OPUS, PCM, WAV, WebM (max 200MB)
        </p>
      </div>
    </div>
  );
}
