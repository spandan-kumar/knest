'use client';

import { useState, useRef } from 'react';
import type { Session } from 'next-auth';
import { useAudioRecording } from '@/app/hooks/useAudioRecording';
import { useFileUpload } from '@/app/hooks/useFileUpload';
import { useAudioCompression } from '@/app/hooks/useAudioCompression';
import { useMeetingAnalysis } from '@/app/hooks/useMeetingAnalysis';
import RecordingTab from './RecordingTab';
import UploadTab from './UploadTab';
import AudioSourceStatus from './AudioSourceStatus';
import AnalysisControls from './AnalysisControls';
import ResultsDisplay from '../results/ResultsDisplay';
import ProgressIndicator from '../ProgressIndicator';
import UserMenu from '../UserMenu';

interface MeetingAnalyzerProps {
  session: Session;
}

export default function MeetingAnalyzer({ session }: MeetingAnalyzerProps) {
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use custom hooks for business logic
  const recording = useAudioRecording();
  const fileUpload = useFileUpload();
  const compression = useAudioCompression();
  const analysis = useMeetingAnalysis();

  // Determine audio source
  const audioSource = recording.audioBlob
    ? 'recording'
    : fileUpload.uploadedFile
    ? 'upload'
    : null;

  const currentAudio = recording.audioBlob || fileUpload.uploadedFile;

  // Handle analyze meeting
  const handleAnalyze = async () => {
    if (!currentAudio) return;

    const fileName = fileUpload.uploadedFile
      ? fileUpload.uploadedFile.name
      : 'recording.wav';

    // Compress if needed
    const { audio: finalAudio, fileName: finalFileName } = await compression.compressIfNeeded(
      currentAudio,
      fileName
    );

    // Analyze with API
    await analysis.analyzeMeeting({
      audio: finalAudio,
      fileName: finalFileName,
      duration: fileUpload.audioDuration, // Pass duration from uploaded file
    });
  };

  // Handle clear
  const handleClear = () => {
    recording.clearAudio();
    fileUpload.clearFile();
    compression.clearCompression();
    analysis.clearResults();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Combined error from all sources
  const error = recording.error || fileUpload.error || analysis.error;

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-end mb-6">
            <UserMenu session={session} />
          </div>
          <div className="text-center">
            <h1 className="text-6xl font-light text-white mb-4 tracking-tight">
              K<span className="text-violet-400">Nest</span>
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Transform your meetings into actionable intelligence with AI-powered analysis
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 mb-12">
          {/* Tabs */}
          <div className="flex border-b border-gray-700/50 mb-8">
            <button
              onClick={() => setActiveTab('record')}
              className={`px-6 py-3 font-medium transition-all duration-200 relative ${
                activeTab === 'record' ? 'text-violet-400' : 'text-gray-400 hover:text-gray-200'
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
                activeTab === 'upload' ? 'text-violet-400' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="relative z-10">Upload Recording</span>
              {activeTab === 'upload' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"></div>
              )}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'record' && (
            <RecordingTab
              isRecording={recording.isRecording}
              onStartRecording={recording.startRecording}
              onStopRecording={recording.stopRecording}
            />
          )}

          {activeTab === 'upload' && (
            <UploadTab fileInputRef={fileInputRef} onFileUpload={fileUpload.handleFileUpload} />
          )}

          {/* Audio Source Status */}
          {audioSource && (
            <AudioSourceStatus
              audioSource={audioSource}
              uploadedFile={fileUpload.uploadedFile}
              audioBlob={recording.audioBlob}
              compressionResult={compression.compressionResult}
            />
          )}

          {/* Analysis Controls */}
          {audioSource && (
            <div className="text-center">
              <AnalysisControls
                isLoading={analysis.isLoading}
                isCompressing={compression.isCompressing}
                onAnalyze={handleAnalyze}
                onClear={handleClear}
              />
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Compression Progress */}
        {compression.isCompressing && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400"></div>
              <p className="text-yellow-400">Compressing audio for faster processing...</p>
            </div>
          </div>
        )}

        {/* Upload and Processing Progress */}
        <ProgressIndicator
          progress={analysis.uploadProgress}
          stage={analysis.processingStage}
          isVisible={analysis.isLoading && !compression.isCompressing}
          className="mb-8"
          fileSize={fileUpload.uploadedFile?.size || recording.audioBlob?.size}
          fileName={
            fileUpload.uploadedFile?.name || (recording.audioBlob ? 'recording.wav' : undefined)
          }
        />

        {/* Results */}
        {analysis.analysisResult && <ResultsDisplay result={analysis.analysisResult} meetingId={analysis.meetingId} />}
      </div>
    </div>
  );
}
