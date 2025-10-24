'use client';

import { useState, useRef, useCallback } from 'react';
import { clientLoggers } from '@/lib/client-logger';

interface UseAudioRecordingReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearAudio: () => void;
  error: string | null;
}

export function useAudioRecording(): UseAudioRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try different formats in order of preference for Gemini compatibility
      let mimeType = 'audio/wav';
      const supportedTypes = [
        'audio/wav', // Best compatibility
        'audio/mp4', // Good compatibility
        'audio/mpeg', // Good compatibility
        'audio/webm', // Acceptable but less ideal
        'audio/ogg', // Fallback
      ];

      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          console.log(`🎙️ Selected audio format: ${mimeType}`);
          break;
        }
      }

      console.log(
        `🎤 Available MediaRecorder types:`,
        supportedTypes.map((type) => ({
          type,
          supported: MediaRecorder.isTypeSupported(type),
        }))
      );

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        console.log(`🎵 Created audio blob:`, {
          type: blob.type,
          size: blob.size,
          mimeType: mimeType,
        });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      clientLoggers.recording.error(err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const clearAudio = useCallback(() => {
    setAudioBlob(null);
    setError(null);
  }, []);

  return {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    clearAudio,
    error,
  };
}
