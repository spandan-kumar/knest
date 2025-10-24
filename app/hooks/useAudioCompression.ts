'use client';

import { useState, useCallback } from 'react';
import { compressAudio, shouldCompressAudio } from '@/lib/audioCompression';
import { clientLoggers } from '@/lib/client-logger';
import type { CompressionResult } from '@/lib/types/meeting.types';

interface UseAudioCompressionReturn {
  isCompressing: boolean;
  compressionResult: CompressionResult | null;
  compressIfNeeded: (audio: Blob, fileName: string) => Promise<{ audio: Blob; fileName: string }>;
  clearCompression: () => void;
}

export function useAudioCompression(): UseAudioCompressionReturn {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);

  const compressIfNeeded = useCallback(
    async (audio: Blob, fileName: string): Promise<{ audio: Blob; fileName: string }> => {
      // Check if audio should be compressed
      if (!shouldCompressAudio(audio)) {
        return { audio, fileName };
      }

      setIsCompressing(true);
      clientLoggers.file.compressionStart(audio.size);

      try {
        const compressionOptions = {
          bitRate: 128, // 128 kbps for good quality/size balance
          sampleRate: 44100,
          channels: 1, // Mono for smaller file size
          quality: 3, // Good quality
        };

        const result = await compressAudio(audio, compressionOptions);
        setCompressionResult(result);

        const newFileName = fileName.replace(/\.[^/.]+$/, '') + '.mp3';

        clientLoggers.file.compressionComplete({
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          compressionRatio: result.compressionRatio,
        });

        return { audio: result.compressedBlob, fileName: newFileName };
      } catch (compressionError) {
        clientLoggers.file.compressionFailed(compressionError);
        // Continue with original file if compression fails
        return { audio, fileName };
      } finally {
        setIsCompressing(false);
      }
    },
    []
  );

  const clearCompression = useCallback(() => {
    setCompressionResult(null);
  }, []);

  return {
    isCompressing,
    compressionResult,
    compressIfNeeded,
    clearCompression,
  };
}
