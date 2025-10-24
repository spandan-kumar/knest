'use client';

import { useState, useCallback } from 'react';
import { clientLoggers } from '@/lib/client-logger';

interface UseFileUploadReturn {
  uploadedFile: File | null;
  audioDuration: number | null; // Duration in seconds
  error: string | null;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  clearFile: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      clientLoggers.file.selected(file.name, file.size, file.type);

      if (file.size > 200 * 1024 * 1024) {
        setError('File size must be less than 200MB');
        return;
      }

      // Gemini 2.5 Flash supported audio formats (including browser variations)
      const validTypes = [
        'audio/x-aac',
        'audio/aac',
        'audio/flac',
        'audio/x-flac',
        'audio/mp3',
        'audio/mpeg3',
        'audio/x-mp3',
        'audio/m4a',
        'audio/x-m4a',
        'audio/mpeg',
        'audio/mpga',
        'audio/mp4',
        'audio/opus',
        'audio/x-opus',
        'audio/pcm',
        'audio/x-pcm',
        'audio/wav',
        'audio/x-wav',
        'audio/wave',
        'audio/x-wave',
        'audio/webm',
        'audio/x-webm',
        'audio/ogg',
        'audio/x-ogg',
        // Also support video formats that contain audio
        'video/mp4',
        'video/webm',
        'video/ogg',
      ];

      // Check base type as well (for codec specifications)
      const baseType = file.type.split(';')[0];
      if (!validTypes.includes(file.type) && !validTypes.includes(baseType)) {
        setError(
          'Please upload a valid audio file. Supported formats: AAC, FLAC, MP3, M4A, MPEG, MPGA, MP4, OPUS, PCM, WAV, WebM, OGG'
        );
        return;
      }

      // Extract audio duration using HTML5 Audio API
      const audio = new Audio();
      const url = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        const durationInSeconds = Math.round(audio.duration);
        setAudioDuration(durationInSeconds);
        URL.revokeObjectURL(url);
      });

      audio.addEventListener('error', () => {
        // If we can't read metadata, that's okay - duration will be null
        URL.revokeObjectURL(url);
      });

      audio.src = url;

      setUploadedFile(file);
      setError(null);
    }
  }, []);

  const clearFile = useCallback(() => {
    setUploadedFile(null);
    setAudioDuration(null);
    setError(null);
  }, []);

  return {
    uploadedFile,
    audioDuration,
    error,
    handleFileUpload,
    clearFile,
  };
}
