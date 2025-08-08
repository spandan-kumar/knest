'use client';

import { useState, useEffect } from 'react';
import { VoiceSampleService } from '@/lib/services/voice-sample.service';
import type { VoiceSampleMetadata, DiarizationProfile } from '@/lib/types/voice-sample.types';
import VoiceSampleRecorder from './VoiceSampleRecorder';

interface VoiceSampleManagerProps {
  onProfilesChange?: (profiles: DiarizationProfile[]) => void;
  className?: string;
}

export default function VoiceSampleManager({ onProfilesChange, className = '' }: VoiceSampleManagerProps) {
  const [samples, setSamples] = useState<VoiceSampleMetadata[]>([]);
  const [profiles, setProfiles] = useState<DiarizationProfile[]>([]);
  const [selectedSamples, setSelectedSamples] = useState<Set<string>>(new Set());
  const [newProfileName, setNewProfileName] = useState('');
  const [activeTab, setActiveTab] = useState<'samples' | 'profiles'>('samples');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [expandedSample, setExpandedSample] = useState<string | null>(null);
  const [reRecordingSample, setReRecordingSample] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSamples(VoiceSampleService.getAllVoiceSamples());
    const loadedProfiles = VoiceSampleService.getAllProfiles();
    setProfiles(loadedProfiles);
    onProfilesChange?.(loadedProfiles);
  };

  const handleSampleAdded = (sample: VoiceSampleMetadata) => {
    loadData();
    setReRecordingSample(null); // Close re-recording mode
  };

  const startReRecording = (sampleId: string) => {
    setReRecordingSample(sampleId);
    setActiveTab('samples'); // Ensure we're on samples tab
  };

  const deleteSample = async (id: string) => {
    if (confirm('Are you sure you want to delete this voice sample?')) {
      await VoiceSampleService.deleteVoiceSample(id);
      loadData();
      setSelectedSamples(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const playAudio = async (sampleId: string) => {
    if (playingAudio === sampleId) {
      setPlayingAudio(null);
      return;
    }

    try {
      const sample = await VoiceSampleService.getVoiceSample(sampleId);
      if (sample && sample.audioUrl) {
        const audio = new Audio(sample.audioUrl);
        audio.onended = () => setPlayingAudio(null);
        audio.onerror = () => setPlayingAudio(null);
        
        setPlayingAudio(sampleId);
        await audio.play();
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      setPlayingAudio(null);
    }
  };

  const toggleSampleSelection = (sampleId: string) => {
    setSelectedSamples(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sampleId)) {
        newSet.delete(sampleId);
      } else {
        newSet.add(sampleId);
      }
      return newSet;
    });
  };

  const createProfile = () => {
    if (!newProfileName.trim() || selectedSamples.size === 0) return;

    setIsCreatingProfile(true);
    try {
      const profile = VoiceSampleService.createProfile(
        newProfileName.trim(),
        Array.from(selectedSamples)
      );
      
      setNewProfileName('');
      setSelectedSamples(new Set());
      loadData();
      setActiveTab('profiles');
    } catch (error) {
      console.error('Failed to create profile:', error);
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const deleteProfile = (profileId: string) => {
    if (confirm('Are you sure you want to delete this profile?')) {
      VoiceSampleService.deleteProfile(profileId);
      loadData();
    }
  };

  const toggleProfileActive = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      profile.isActive = !profile.isActive;
      VoiceSampleService.saveProfile(profile);
      loadData();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 ${className}`}>
      <div className="flex border-b border-gray-700/50 mb-6">
        <button
          onClick={() => setActiveTab('samples')}
          className={`px-4 py-2 font-medium transition-all duration-200 relative ${
            activeTab === 'samples'
              ? 'text-violet-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Voice Samples ({samples.length})
          {activeTab === 'samples' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('profiles')}
          className={`px-4 py-2 font-medium transition-all duration-200 relative ${
            activeTab === 'profiles'
              ? 'text-violet-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Profiles ({profiles.length})
          {activeTab === 'profiles' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"></div>
          )}
        </button>
      </div>

      {activeTab === 'samples' && (
        <div className="space-y-6">
          <VoiceSampleRecorder 
            onSampleAdded={handleSampleAdded} 
            reRecordingMode={reRecordingSample ? {
              sampleId: reRecordingSample,
              existingSample: samples.find(s => s.id === reRecordingSample)
            } : undefined}
          />
          
          {/* Profile Creation */}
          {selectedSamples.size > 0 && (
            <div className="bg-violet-900/20 border border-violet-700/30 rounded-lg p-4">
              <h4 className="text-lg font-medium text-violet-200 mb-3">
                Create Diarization Profile
              </h4>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Profile name (e.g., 'John Smith')"
                  className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
                <button
                  onClick={createProfile}
                  disabled={!newProfileName.trim() || isCreatingProfile}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all duration-200 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isCreatingProfile ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                  <span>Create Profile</span>
                </button>
              </div>
              <p className="text-sm text-violet-300 mt-2">
                Selected {selectedSamples.size} sample{selectedSamples.size !== 1 ? 's' : ''} for this profile
              </p>
            </div>
          )}

          {/* Samples List */}
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-gray-200">Voice Samples</h4>
            {samples.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No voice samples yet. Record your first sample above.
              </p>
            ) : (
              samples.map((sample) => (
                <div key={sample.id} className="border border-gray-700/50 rounded-lg p-4 bg-gray-800/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedSamples.has(sample.id)}
                        onChange={() => toggleSampleSelection(sample.id)}
                        className="h-4 w-4 text-violet-500 bg-gray-800 border-gray-600 rounded focus:ring-violet-500"
                      />
                      <div>
                        <h5 className="font-medium text-gray-200">{sample.name}</h5>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>{formatDuration(sample.duration)}</span>
                          <span>{formatFileSize(sample.fileSize)}</span>
                          <span className={getQualityColor(sample.quality)}>
                            {sample.quality}
                          </span>
                          <span>{sample.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setExpandedSample(expandedSample === sample.id ? null : sample.id)}
                        className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
                        title="View details"
                      >
                        <svg className={`w-4 h-4 transition-transform ${expandedSample === sample.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => playAudio(sample.id)}
                        className="p-2 text-green-400 hover:text-green-300 transition-colors"
                        title="Play sample"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          {playingAudio === sample.id ? (
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          )}
                        </svg>
                      </button>
                      <button
                        onClick={() => startReRecording(sample.id)}
                        className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"
                        title="Re-record sample"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteSample(sample.id)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete sample"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {expandedSample === sample.id && (
                    <div className="mt-3 pt-3 border-t border-gray-700/30">
                      <p className="text-sm text-gray-300 mb-2">
                        <span className="font-medium">Sample Text:</span>
                      </p>
                      <p className="text-sm text-gray-400 italic bg-gray-800/30 p-2 rounded">
                        "{sample.sampleText}"
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'profiles' && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-200">Diarization Profiles</h4>
          {profiles.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No profiles created yet. Create a profile by selecting samples in the Voice Samples tab.
            </p>
          ) : (
            profiles.map((profile) => (
              <div key={profile.id} className="border border-gray-700/50 rounded-lg p-4 bg-gray-800/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${profile.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <h5 className="font-medium text-gray-200">{profile.name}</h5>
                    <span className={`text-sm ${getConfidenceColor(profile.confidence)}`}>
                      {(profile.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleProfileActive(profile.id)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 ${
                        profile.isActive
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {profile.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => deleteProfile(profile.id)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      title="Delete profile"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  <p>{profile.voiceSamples.length} voice sample{profile.voiceSamples.length !== 1 ? 's' : ''}</p>
                  {profile.lastUsed && (
                    <p>Last used: {profile.lastUsed.toLocaleDateString()}</p>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {profile.voiceSamples.map((sample) => (
                    <span
                      key={sample.id}
                      className="px-2 py-1 bg-violet-900/30 text-violet-300 text-xs rounded"
                    >
                      {sample.name} ({sample.quality})
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}