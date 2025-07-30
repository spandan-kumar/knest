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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setUploadedFile(null);
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      
      const validTypes = ['audio/wav', 'audio/mp3', 'audio/m4a', 'audio/webm', 'audio/ogg'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid audio file (WAV, MP3, M4A, WebM, or OGG)');
        return;
      }
      
      setUploadedFile(file);
      setAudioBlob(null);
      setError(null);
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeMeeting = async () => {
    const audioToAnalyze = audioBlob || uploadedFile;
    if (!audioToAnalyze) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      const fileName = uploadedFile ? uploadedFile.name : 'recording.wav';
      formData.append('audio', audioToAnalyze, fileName);

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

  const getAudioSource = () => {
    if (audioBlob) return 'recording';
    if (uploadedFile) return 'upload';
    return null;
  };

  const audioSource = getAudioSource();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gemini Meeting Notes</h1>
          <p className="text-gray-600">Record your meeting or upload existing recordings for AI-powered insights</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('record')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'record'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Record Meeting
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload Recording
            </button>
          </div>

          {activeTab === 'record' && (
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

              {isRecording && (
                <div className="flex items-center space-x-2 text-red-600">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                  <span>Recording in progress...</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Audio File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Supported formats: WAV, MP3, M4A, WebM, OGG (max 50MB)
                </p>
              </div>
            </div>
          )}

          {audioSource && (
            <div className="mt-6 text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-green-700 font-medium">
                    {audioSource === 'recording' ? 'Recording ready for analysis' : 'File uploaded successfully'}
                  </p>
                </div>
                {uploadedFile && (
                  <p className="text-sm text-green-600 mt-1">{uploadedFile.name}</p>
                )}
              </div>
              
              <div className="flex items-center justify-center space-x-4">
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
                
                <button
                  onClick={clearAudio}
                  disabled={isLoading}
                  className="px-4 py-3 rounded-lg font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
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