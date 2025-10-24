'use client';

import { useState, useCallback } from 'react';
import { clientLoggers } from '@/lib/client-logger';
import type { AnalysisResult } from '@/lib/types/meeting.types';

interface AnalyzeOptions {
  audio: Blob;
  fileName: string;
  duration?: number | null; // Duration in seconds
}

interface UseMeetingAnalysisReturn {
  isLoading: boolean;
  uploadProgress: number;
  processingStage: string;
  analysisResult: AnalysisResult | null;
  meetingId: string | null;
  error: string | null;
  analyzeMeeting: (options: AnalyzeOptions) => Promise<void>;
  clearResults: () => void;
}

export function useMeetingAnalysis(): UseMeetingAnalysisReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeMeeting = useCallback(async ({ audio, fileName, duration }: AnalyzeOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audio, fileName);
      if (duration !== null && duration !== undefined) {
        formData.append('duration', duration.toString());
      }

      // Reset progress
      setUploadProgress(0);
      setProcessingStage('Uploading audio file...');

      // Use XMLHttpRequest for progress tracking
      const result = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProcessingStage('Processing audio with AI...');
            setUploadProgress(0); // Reset for AI processing simulation

            // Simulate AI processing progress
            let aiProgress = 0;
            const aiProgressInterval = setInterval(() => {
              aiProgress += Math.random() * 15 + 5; // Random increment between 5-20%
              if (aiProgress > 95) aiProgress = 95; // Cap at 95% until complete
              setUploadProgress(Math.round(aiProgress));
            }, 1000);

            try {
              const response = JSON.parse(xhr.responseText);
              clearInterval(aiProgressInterval);
              setUploadProgress(100);
              resolve(response);
            } catch (error) {
              clearInterval(aiProgressInterval);
              reject(new Error('Failed to parse response'));
            }
          } else {
            let errorMessage = `Failed to analyze meeting: ${xhr.status} ${xhr.statusText}`;
            try {
              const errorData = JSON.parse(xhr.responseText);
              if (errorData.error) {
                errorMessage = errorData.error;
              }
            } catch {
              // Fall back to status text if JSON parsing fails
            }
            reject(new Error(errorMessage));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('Request timed out'));
        });

        xhr.open('POST', '/api/process-meeting');
        xhr.timeout = 900000; // 15 minutes timeout
        xhr.send(formData);
      });

      setProcessingStage('Finalizing results...');
      setAnalysisResult(result);
      setMeetingId(result.meetingId || null);

      // Brief delay to show completion state
      setTimeout(() => {
        setProcessingStage('');
        setUploadProgress(0);
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze meeting';
      setError(errorMessage);
      clientLoggers.api.error('/api/process-meeting', 'POST', {
        error: errorMessage,
        originalError: err,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      setProcessingStage('');
    }
  }, []);

  const clearResults = useCallback(() => {
    setAnalysisResult(null);
    setMeetingId(null);
    setError(null);
    setUploadProgress(0);
    setProcessingStage('');
  }, []);

  return {
    isLoading,
    uploadProgress,
    processingStage,
    analysisResult,
    meetingId,
    error,
    analyzeMeeting,
    clearResults,
  };
}
