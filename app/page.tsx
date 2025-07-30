'use client';

import { useState, useRef } from 'react';

interface AnalysisResult {
  summary: string;
  tasks: Array<{ action: string; assigned_to: string }>;
  transcript: string;
}

interface ResultsDisplayProps {
  result: AnalysisResult;
}

function ResultsDisplay({ result }: ResultsDisplayProps) {
  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Meeting Summary</h2>
        <p className="text-gray-700 leading-relaxed">{result.summary}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Action Items</h2>
        <div className="space-y-3">
          {result.tasks.map((task, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
              <input type="checkbox" className="mt-1 h-4 w-4 text-indigo-600" />
              <div className="flex-1">
                <p className="text-gray-900">{task.action}</p>
                <p className="text-sm text-gray-600">Assigned to: {task.assigned_to}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Full Transcript</h2>
        <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{result.transcript}</pre>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const analyzeMeeting = async () => {
    if (!audioBlob) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('/api/process-meeting', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze meeting: ${response.statusText}`);
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze meeting');
      console.error('Error analyzing meeting:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gemini Meeting Notes</h1>
          <p className="text-gray-600">Record your meeting and get AI-powered insights</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={startRecording}
                disabled={isRecording}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isRecording
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isRecording ? 'Recording...' : 'Start Recording'}
              </button>
              
              <button
                onClick={stopRecording}
                disabled={!isRecording}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  !isRecording
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                Stop Recording
              </button>
            </div>

            {audioBlob && (
              <div className="text-center">
                <p className="text-green-600 mb-4">✓ Recording ready for analysis</p>
                <button
                  onClick={analyzeMeeting}
                  disabled={isLoading}
                  className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                    isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Meeting'}
                </button>
              </div>
            )}

            {isRecording && (
              <div className="flex items-center space-x-2 text-red-600">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <span>Recording in progress...</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-blue-700">Analyzing your meeting with Gemini AI...</p>
            </div>
          </div>
        )}

        {analysisResult && <ResultsDisplay result={analysisResult} />}
      </div>
    </div>
  );
}