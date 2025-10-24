'use client';

import { formatFileSize } from '@/lib/audioCompression';
import type { CompressionResult } from '@/lib/types/meeting.types';

interface AudioSourceStatusProps {
  audioSource: 'recording' | 'upload' | null;
  uploadedFile?: File | null;
  audioBlob?: Blob | null;
  compressionResult?: CompressionResult | null;
}

export default function AudioSourceStatus({
  audioSource,
  uploadedFile,
  audioBlob,
  compressionResult,
}: AudioSourceStatusProps) {
  if (!audioSource) return null;

  return (
    <div className="mt-8">
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-green-400 font-medium">
            {audioSource === 'recording'
              ? 'Recording ready for analysis'
              : 'File uploaded successfully'}
          </p>
        </div>
        {uploadedFile && (
          <div className="text-center">
            <p className="text-sm text-green-300">{uploadedFile.name}</p>
            <p className="text-xs text-green-400/70">
              Size: {formatFileSize(uploadedFile.size)}
            </p>
          </div>
        )}
        {audioBlob && !uploadedFile && (
          <div className="text-center">
            <p className="text-xs text-green-400/70">
              Size: {formatFileSize(audioBlob.size)}
            </p>
          </div>
        )}
      </div>

      {compressionResult && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <p className="text-blue-400 font-medium">Audio Compressed Successfully</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-blue-300 font-medium">Original</p>
              <p className="text-blue-400/80">
                {formatFileSize(compressionResult.originalSize)}
              </p>
            </div>
            <div>
              <p className="text-blue-300 font-medium">Compressed</p>
              <p className="text-blue-400/80">
                {formatFileSize(compressionResult.compressedSize)}
              </p>
            </div>
            <div>
              <p className="text-blue-300 font-medium">Reduction</p>
              <p className="text-blue-400/80">
                {compressionResult.compressionRatio.toFixed(2)}x
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
