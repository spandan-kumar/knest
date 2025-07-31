'use client';

import { useState, useRef } from 'react';
import { compressAudio, shouldCompressAudio, formatFileSize, type CompressionResult } from '@/lib/audioCompression';

interface AnalysisResult {
  summary: string;
  tasks: Array<{ 
    action: string; 
    assigned_to: string;
    deadline?: string;
    priority?: string;
    context?: string;
  }>;
  transcript: string;
  participants?: Array<{
    speaker_id: string;
    participation_level: string;
    key_contributions: string[];
    expertise_areas: string[];
  }>;
  topics?: Array<{
    topic: string;
    duration_emphasis: string;
    key_points: string[];
    decisions_made: string[];
    open_questions: string[];
  }>;
  meeting_metadata?: {
    overall_tone: string;
    productivity_level: string;
    total_speakers: string;
    main_outcomes: string[];
    follow_up_required: string[];
  };
}

interface ResultsDisplayProps {
  result: AnalysisResult;
}

function ResultsDisplay({ result }: ResultsDisplayProps) {
  const downloadMarkdown = async () => {
    try {
      const response = await fetch('/api/export-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        throw new Error('Failed to export meeting report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `meeting-report-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-6xl space-y-8">
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light text-white">Meeting Analysis</h2>
          <button
            onClick={downloadMarkdown}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-3 group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">Export Report</span>
          </button>
        </div>
      </div>

      <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
        <h2 className="text-xl font-light text-gray-100 mb-6">Executive Summary</h2>
        <p className="text-gray-300 leading-relaxed text-lg">{result.summary}</p>
      </div>

      {result.meeting_metadata && (
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
          <h2 className="text-xl font-light text-gray-100 mb-6">Meeting Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
              <p className="text-sm text-gray-400 mb-2">Tone</p>
              <p className="font-medium text-white text-lg">{result.meeting_metadata.overall_tone}</p>
            </div>
            <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
              <p className="text-sm text-gray-400 mb-2">Productivity</p>
              <p className="font-medium text-white text-lg">{result.meeting_metadata.productivity_level}</p>
            </div>
            <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
              <p className="text-sm text-gray-400 mb-2">Speakers</p>
              <p className="font-medium text-white text-lg">{result.meeting_metadata.total_speakers}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
        <h2 className="text-xl font-light text-gray-100 mb-6">Action Items</h2>
        <div className="space-y-4">
          {result.tasks.map((task, index) => (
            <div key={index} className="border border-gray-700/50 rounded-xl p-6 bg-gray-800/20">
              <div className="flex items-start space-x-4">
                <input type="checkbox" className="mt-1 h-5 w-5 text-violet-500 bg-gray-800 border-gray-600 rounded focus:ring-violet-500 focus:ring-2" />
                <div className="flex-1">
                  <p className="text-gray-100 font-medium text-lg">{task.action}</p>
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium text-gray-200">Assigned to:</span> {task.assigned_to}
                    </p>
                    {task.priority && (
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-gray-200">Priority:</span> 
                        <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${
                          task.priority === 'high' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                          'bg-green-500/20 text-green-300 border border-green-500/30'
                        }`}>
                          {task.priority}
                        </span>
                      </p>
                    )}
                    {task.deadline && (
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-gray-200">Deadline:</span> {task.deadline}
                      </p>
                    )}
                    {task.context && (
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-gray-200">Context:</span> {task.context}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {result.participants && result.participants.length > 0 && (
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
          <h2 className="text-xl font-light text-gray-100 mb-6">Participants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.participants.map((participant, index) => (
              <div key={index} className="border border-gray-700/50 rounded-xl p-6 bg-gray-800/20">
                <h3 className="font-medium text-gray-100 mb-3 text-lg">{participant.speaker_id}</h3>
                <p className="text-sm text-gray-300 mb-4">
                  <span className="font-medium text-gray-200">Participation:</span> {participant.participation_level}
                </p>
                {participant.key_contributions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-200 mb-2">Key Contributions:</p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {participant.key_contributions.map((contribution, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-violet-400 mr-2">•</span>
                          {contribution}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.topics && result.topics.length > 0 && (
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
          <h2 className="text-xl font-light text-gray-100 mb-6">Topics Discussed</h2>
          <div className="space-y-6">
            {result.topics.map((topic, index) => (
              <div key={index} className="border border-gray-700/50 rounded-xl p-6 bg-gray-800/20">
                <h3 className="font-medium text-gray-100 mb-3 text-lg">{topic.topic}</h3>
                <p className="text-sm text-gray-300 mb-4">
                  <span className="font-medium text-gray-200">Emphasis:</span> {topic.duration_emphasis}
                </p>
                
                {topic.key_points.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-200 mb-2">Key Points:</p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {topic.key_points.map((point, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-violet-400 mr-2">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {topic.decisions_made.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-200 mb-2">Decisions Made:</p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {topic.decisions_made.map((decision, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-green-400 mr-2">✓</span>
                          {decision}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {topic.open_questions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-200 mb-2">Open Questions:</p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {topic.open_questions.map((question, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-yellow-400 mr-2">?</span>
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
        <h2 className="text-xl font-light text-gray-100 mb-6">Full Transcript</h2>
        <div className="bg-gray-950/50 rounded-xl p-6 max-h-96 overflow-y-auto border border-gray-800/30">
          <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono leading-relaxed">{result.transcript}</pre>
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
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  
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
      console.log('📁 File selected:', {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB'
      });
      
      if (file.size > 200 * 1024 * 1024) {
        setError('File size must be less than 200MB');
        return;
      }
      // Gemini 2.5 Flash supported audio formats
      const validTypes = [
        'audio/x-aac',
        'audio/flac',
        'audio/mp3',
        'audio/m4a',
        'audio/x-m4a', // Alternative M4A MIME type
        'audio/mpeg',
        'audio/mpga',
        'audio/mp4',
        'audio/opus',
        'audio/pcm',
        'audio/wav',
        'audio/webm',
        // Also support video formats that contain audio
        'video/mp4',
        'video/webm',
        'video/ogg'
      ];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid audio file. Supported formats: AAC, FLAC, MP3, M4A, MPEG, MPGA, MP4, OPUS, PCM, WAV, WebM');
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
    setCompressionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeMeeting = async () => {
    const audioToAnalyze = audioBlob || uploadedFile;
    if (!audioToAnalyze) return;

    setIsLoading(true);
    setError(null);
    setCompressionResult(null);

    try {
      let finalAudio = audioToAnalyze;
      let fileName = uploadedFile ? uploadedFile.name : 'recording.wav';

      // Check if audio should be compressed
      if (shouldCompressAudio(audioToAnalyze)) {
        setIsCompressing(true);
        console.log('Compressing audio...', {
          originalSize: formatFileSize(audioToAnalyze.size),
          type: audioToAnalyze.type || 'unknown'
        });

        try {
          const compressionOptions = {
            bitRate: 128, // 128 kbps for good quality/size balance
            sampleRate: 44100,
            channels: 1, // Mono for smaller file size
            quality: 3 // Good quality
          };

          const result = await compressAudio(audioToAnalyze, compressionOptions);
          setCompressionResult(result);
          finalAudio = result.compressedBlob;
          fileName = fileName.replace(/\.[^/.]+$/, '') + '.mp3'; // Change extension to mp3

          console.log('Compression completed:', {
            originalSize: formatFileSize(result.originalSize),
            compressedSize: formatFileSize(result.compressedSize),
            ratio: `${result.compressionRatio.toFixed(2)}x smaller`
          });
        } catch (compressionError) {
          console.warn('Audio compression failed, using original file:', compressionError);
          // Continue with original file if compression fails
        } finally {
          setIsCompressing(false);
        }
      }

      const formData = new FormData();
      formData.append('audio', finalAudio, fileName);

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
      setIsCompressing(false);
    }
  };

  const getAudioSource = () => {
    if (audioBlob) return 'recording';
    if (uploadedFile) return 'upload';
    return null;
  };

  const audioSource = getAudioSource();

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="mb-6">
            <h1 className="text-6xl font-light text-white mb-4 tracking-tight">
              K<span className="text-violet-400">Nest</span>
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 mx-auto rounded-full"></div>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Transform your meetings into actionable intelligence with AI-powered analysis
          </p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 mb-12">
          <div className="flex border-b border-gray-700/50 mb-8">
            <button
              onClick={() => setActiveTab('record')}
              className={`px-6 py-3 font-medium transition-all duration-200 relative ${
                activeTab === 'record'
                  ? 'text-violet-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="relative z-10">Record Meeting</span>
              {activeTab === 'record' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 font-medium transition-all duration-200 relative ${
                activeTab === 'upload'
                  ? 'text-violet-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="relative z-10">Upload Recording</span>
              {activeTab === 'upload' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"></div>
              )}
            </button>
          </div>

          {activeTab === 'record' && (
            <div className="flex flex-col items-center space-y-8">
              <div className="flex space-x-6">
                <button
                  onClick={startRecording}
                  disabled={isRecording}
                  className={`px-8 py-4 rounded-xl font-medium transition-all duration-200 flex items-center space-x-3 ${
                    isRecording
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-red-500/25 transform hover:scale-105'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  <span>{isRecording ? 'Recording...' : 'Start Recording'}</span>
                </button>
                
                <button
                  onClick={stopRecording}
                  disabled={!isRecording}
                  className={`px-8 py-4 rounded-xl font-medium transition-all duration-200 flex items-center space-x-3 ${
                    !isRecording
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-700 text-white hover:bg-gray-600 shadow-lg transform hover:scale-105'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  <span>Stop Recording</span>
                </button>
              </div>

              {isRecording && (
                <div className="flex items-center space-x-3 text-red-400">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Recording in progress...</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
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
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-300 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-gradient-to-r file:from-violet-600 file:to-indigo-600 file:text-white hover:file:from-violet-700 hover:file:to-indigo-700 file:transition-all file:duration-200 bg-gray-800 border border-gray-700 rounded-xl p-3"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Supported: AAC, FLAC, MP3, M4A, MPEG, MPGA, MP4, OPUS, PCM, WAV, WebM (max 200MB)
                </p>
              </div>
            </div>
          )}

          {audioSource && (
            <div className="mt-8 text-center">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-green-400 font-medium">
                    {audioSource === 'recording' ? 'Recording ready for analysis' : 'File uploaded successfully'}
                  </p>
                </div>
                {uploadedFile && (
                  <div className="text-center">
                    <p className="text-sm text-green-300">{uploadedFile.name}</p>
                    <p className="text-xs text-green-400/70">Size: {formatFileSize(uploadedFile.size)}</p>
                  </div>
                )}
                {audioBlob && (
                  <div className="text-center">
                    <p className="text-xs text-green-400/70">Size: {formatFileSize(audioBlob.size)}</p>
                  </div>
                )}
              </div>

              {compressionResult && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <p className="text-blue-400 font-medium">Audio Compressed Successfully</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <p className="text-blue-300 font-medium">Original</p>
                      <p className="text-blue-400/80">{formatFileSize(compressionResult.originalSize)}</p>
                    </div>
                    <div>
                      <p className="text-blue-300 font-medium">Compressed</p>
                      <p className="text-blue-400/80">{formatFileSize(compressionResult.compressedSize)}</p>
                    </div>
                    <div>
                      <p className="text-blue-300 font-medium">Reduction</p>
                      <p className="text-blue-400/80">{compressionResult.compressionRatio.toFixed(2)}x</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-center space-x-6">
                <button
                  onClick={analyzeMeeting}
                  disabled={isLoading}
                  className={`px-10 py-4 rounded-xl font-medium transition-all duration-200 flex items-center space-x-3 ${
                    isLoading
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg hover:shadow-violet-500/25 transform hover:scale-105'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{isCompressing ? 'Compressing...' : 'Analyzing...'}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Analyze Meeting</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={clearAudio}
                  disabled={isLoading}
                  className="px-6 py-4 rounded-xl font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-all duration-200"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-400"></div>
              <p className="text-violet-400">
                {isCompressing 
                  ? 'Compressing audio for faster processing...' 
                  : 'Analyzing your meeting with advanced AI...'
                }
              </p>
            </div>
          </div>
        )}

        {analysisResult && <ResultsDisplay result={analysisResult} />}
      </div>
    </div>
  );
}