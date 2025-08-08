'use client';

import { useState, useRef, useEffect } from 'react';
import { VoiceSampleService } from '@/lib/services/voice-sample.service';
import type { VoiceSample, VoiceSampleMetadata } from '@/lib/types/voice-sample.types';

interface ReRecordingMode {
  sampleId: string;
  existingSample?: VoiceSampleMetadata;
}

interface VoiceSampleRecorderProps {
  onSampleAdded?: (sample: VoiceSampleMetadata) => void;
  reRecordingMode?: ReRecordingMode;
  className?: string;
}

export default function VoiceSampleRecorder({ onSampleAdded, reRecordingMode, className = '' }: VoiceSampleRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [speakerName, setSpeakerName] = useState('');
  const [sampleText, setSampleText] = useState('');
  const [quality, setQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [recordingFormat, setRecordingFormat] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize with existing sample data when in re-recording mode
    if (reRecordingMode?.existingSample) {
      const sample = reRecordingMode.existingSample;
      setSpeakerName(sample.name);
      setSampleText(sample.sampleText);
      setQuality(sample.quality);
    }
  }, [reRecordingMode]);

  useEffect(() => {
    // Generate initial sample text
    if (!sampleText && speakerName && !reRecordingMode) {
      setSampleText(VoiceSampleService.getRandomSampleText(speakerName));
    }
  }, [speakerName, sampleText, reRecordingMode]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [audioUrl]);

  const generateNewSampleText = () => {
    if (speakerName) {
      setSampleText(VoiceSampleService.getRandomSampleText(speakerName));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      // Try different formats in order of preference for Gemini compatibility
      let mimeType = 'audio/wav';
      const supportedTypes = [
        'audio/wav',           // Best compatibility
        'audio/mp4',           // Good compatibility
        'audio/mpeg',          // Good compatibility
        'audio/webm',          // Acceptable but less ideal
        'audio/ogg'            // Fallback
      ];
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      setRecordingFormat(mimeType);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setRecordingTime(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setError(null);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= 30) { // Auto-stop at 30 seconds
            stopRecording();
            return 30;
          }
          return newTime;
        });
      }, 100);

    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (audioUrl && !isPlaying) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        setError('Failed to play recording');
      };
      
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => setError('Failed to play recording'));
    } else if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const saveVoiceSample = async () => {
    if (!audioBlob || !speakerName.trim() || !sampleText.trim()) {
      setError('Please provide a name, record audio, and ensure sample text is present');
      return;
    }

    if (recordingTime < 3) {
      setError('Recording must be at least 3 seconds long');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // If in re-recording mode, delete the old sample first
      if (reRecordingMode?.sampleId) {
        await VoiceSampleService.deleteVoiceSample(reRecordingMode.sampleId);
      }

      const sample = await VoiceSampleService.saveVoiceSample({
        name: speakerName.trim(),
        audioBlob,
        sampleText: sampleText.trim(),
        quality,
        duration: recordingTime,
        fileSize: audioBlob.size
      });

      // Reset form only if not in re-recording mode
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      
      if (!reRecordingMode) {
        setSpeakerName('');
        setSampleText('');
        setQuality('good');
      }
      
      setRecordingTime(0);

      onSampleAdded?.(sample);

    } catch (err) {
      setError('Failed to save voice sample. Please try again.');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const clearRecording = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordingTime(0);
    setError(null);
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className={`bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-light text-gray-100">
          {reRecordingMode ? 'Re-record Voice Sample' : 'Add Voice Sample'}
        </h3>
        <div className="text-sm text-gray-400">
          {recordingTime > 0 && `${formatTime(recordingTime)} / 0:30.0`}
          {recordingFormat && (
            <div className="text-xs text-gray-500 mt-1">
              Format: {recordingFormat}
            </div>
          )}
        </div>
      </div>

      {reRecordingMode && (
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 mb-4">
          <p className="text-yellow-200 text-sm">
            🔄 <strong>Re-recording mode:</strong> You're replacing the existing sample for "{reRecordingMode.existingSample?.name}". 
            The previous recording will be deleted when you save the new one.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Speaker Name Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Speaker Name *
          </label>
          <input
            type="text"
            value={speakerName}
            onChange={(e) => setSpeakerName(e.target.value)}
            placeholder="Enter speaker's name"
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            disabled={isRecording}
          />
        </div>

        {/* Sample Text */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">
              Sample Text *
            </label>
            <button
              onClick={generateNewSampleText}
              disabled={!speakerName || isRecording}
              className="text-xs text-violet-400 hover:text-violet-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              Generate New
            </button>
          </div>
          <textarea
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            placeholder="Text for the speaker to read during recording"
            rows={3}
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
            disabled={isRecording}
          />
          <p className="text-xs text-gray-500 mt-1">
            Read this text clearly during recording for best results
          </p>
        </div>

        {/* Recording Controls */}
        <div className="flex items-center justify-center space-x-4 py-4">
          {!audioBlob ? (
            <>
              <button
                onClick={startRecording}
                disabled={isRecording || !speakerName.trim() || !sampleText.trim()}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                  isRecording || !speakerName.trim() || !sampleText.trim()
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-red-500/25'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                <span>Start Recording</span>
              </button>
              
              <button
                onClick={stopRecording}
                disabled={!isRecording}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                  !isRecording
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 text-white hover:bg-gray-600 shadow-lg'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                <span>Stop</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={playRecording}
                className="px-6 py-3 rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  {isPlaying ? (
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  )}
                </svg>
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              
              <button
                onClick={clearRecording}
                className="px-4 py-3 rounded-xl font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-all duration-200"
              >
                Clear
              </button>
            </>
          )}
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="flex items-center justify-center space-x-3 text-red-400 py-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Recording... Speak clearly!</span>
            <div className="text-sm text-gray-400">
              ({Math.max(0, 30 - recordingTime).toFixed(1)}s remaining)
            </div>
          </div>
        )}

        {/* Quality Selection */}
        {audioBlob && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Recording Quality
            </label>
            <div className="flex space-x-2">
              {['excellent', 'good', 'fair', 'poor'].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q as any)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    quality === q
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {q.charAt(0).toUpperCase() + q.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        {audioBlob && (
          <div className="flex justify-center pt-4">
            <button
              onClick={saveVoiceSample}
              disabled={isSaving || !speakerName.trim() || !sampleText.trim()}
              className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                isSaving || !speakerName.trim() || !sampleText.trim()
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg hover:shadow-violet-500/25'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>{reRecordingMode ? 'Update Voice Sample' : 'Save Voice Sample'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}