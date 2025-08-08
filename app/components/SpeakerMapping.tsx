'use client';

import { useState, useEffect } from 'react';
import type { SpeakerIdentification, SpeakerHint } from '@/lib/types/meeting.types';
import type { DiarizationProfile } from '@/lib/types/voice-sample.types';
import { VoiceSampleService } from '@/lib/services/voice-sample.service';

interface SpeakerMappingProps {
  speakerIdentification: SpeakerIdentification;
  onSpeakerMappingUpdate: (mappings: Record<string, string>) => void;
  className?: string;
}

export default function SpeakerMapping({ 
  speakerIdentification, 
  onSpeakerMappingUpdate,
  className = '' 
}: SpeakerMappingProps) {
  const [mappings, setMappings] = useState<Record<string, string>>(() => {
    // Initialize with suggested names if available
    const initialMappings: Record<string, string> = {};
    speakerIdentification.speaker_hints.forEach(hint => {
      if (hint.suggested_name) {
        initialMappings[hint.speaker_id] = hint.suggested_name;
      }
    });
    return initialMappings;
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [profiles, setProfiles] = useState<DiarizationProfile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<Record<string, string>>({});
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);

  useEffect(() => {
    const loadedProfiles = VoiceSampleService.getAllProfiles();
    setProfiles(loadedProfiles.filter(p => p.isActive));
  }, []);

  const handleNameChange = (speakerId: string, name: string) => {
    const newMappings = { ...mappings, [speakerId]: name };
    setMappings(newMappings);
    onSpeakerMappingUpdate(newMappings);
  };

  const handleProfileSelection = (speakerId: string, profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      handleNameChange(speakerId, profile.name);
      setSelectedProfiles(prev => ({ ...prev, [speakerId]: profileId }));
      VoiceSampleService.updateProfileLastUsed(profileId);
    }
  };

  const clearProfileSelection = (speakerId: string) => {
    setSelectedProfiles(prev => {
      const newSelected = { ...prev };
      delete newSelected[speakerId];
      return newSelected;
    });
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return '🎯';
      case 'medium': return '🤔';
      case 'low': return '❓';
      default: return '🔍';
    }
  };

  return (
    <div className={`bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 ${className}`}>
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-light text-gray-100">Speaker Identification</h2>
          <span className="text-sm text-gray-400">
            ({speakerIdentification.total_speakers} speakers detected)
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">
            {Object.keys(mappings).length > 0 ? 'Names assigned' : 'Click to assign names'}
          </span>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-4">
          {speakerIdentification.speaker_hints.map((hint: SpeakerHint) => (
            <div key={hint.speaker_id} className="border border-gray-700/50 rounded-xl p-4 bg-gray-800/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-gray-200">{hint.speaker_id}</h3>
                  <span className={`text-sm ${getConfidenceColor(hint.confidence)}`}>
                    {getConfidenceIcon(hint.confidence)} {hint.confidence} confidence
                  </span>
                </div>
              </div>

              {/* Voice Profile Selection */}
              {profiles.length > 0 && (
                <div className="mb-3">
                  <label className="block text-sm text-gray-300 mb-2">Quick Select from Voice Profiles:</label>
                  <div className="flex flex-wrap gap-2">
                    {profiles.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => handleProfileSelection(hint.speaker_id, profile.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                          selectedProfiles[hint.speaker_id] === profile.id
                            ? 'bg-violet-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <span>{profile.name}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          profile.confidence >= 0.8 ? 'bg-green-400' :
                          profile.confidence >= 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                        }`} title={`${(profile.confidence * 100).toFixed(0)}% confidence`}></div>
                      </button>
                    ))}
                  </div>
                  {selectedProfiles[hint.speaker_id] && (
                    <button
                      onClick={() => {
                        clearProfileSelection(hint.speaker_id);
                        handleNameChange(hint.speaker_id, '');
                      }}
                      className="mt-2 text-xs text-gray-400 hover:text-gray-300"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              )}

              {/* Manual Name Input */}
              <div className="mb-3">
                <label className="block text-sm text-gray-300 mb-2">Or Enter Name Manually:</label>
                <input
                  type="text"
                  value={mappings[hint.speaker_id] || ''}
                  onChange={(e) => {
                    handleNameChange(hint.speaker_id, e.target.value);
                    clearProfileSelection(hint.speaker_id);
                  }}
                  placeholder={hint.suggested_name || `Enter name for ${hint.speaker_id}`}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>

              {/* AI Hints */}
              <div className="space-y-2">
                {hint.suggested_name && (
                  <div className="text-sm">
                    <span className="text-gray-400">AI Suggestion: </span>
                    <span className="text-green-400">{hint.suggested_name}</span>
                  </div>
                )}

                {hint.role_hints.length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-400">Role hints: </span>
                    <span className="text-blue-400">{hint.role_hints.join(', ')}</span>
                  </div>
                )}

                {hint.context_clues.length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-400">Context clues: </span>
                    <span className="text-yellow-400">{hint.context_clues.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="mt-4 space-y-3">
            <div className="p-3 bg-violet-900/20 border border-violet-700/30 rounded-lg">
              <p className="text-sm text-violet-200">
                💡 <strong>Tip:</strong> Assign real names to speakers to make the transcript and reports more readable. 
                The AI has provided hints based on conversation context to help you identify speakers.
              </p>
            </div>
            
            {profiles.length === 0 && (
              <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-200">
                    🎙️ <strong>Voice Samples:</strong> No voice profiles found. Record voice samples to improve speaker identification.
                  </p>
                  <button
                    onClick={() => setShowVoiceHelp(!showVoiceHelp)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Learn more
                  </button>
                </div>
                {showVoiceHelp && (
                  <div className="mt-2 pt-2 border-t border-blue-700/30 text-sm text-blue-300">
                    <p>Voice samples help improve diarization accuracy by:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Training the system to recognize specific voices</li>
                      <li>Reducing misidentification in future meetings</li>
                      <li>Providing quick name assignment options</li>
                    </ul>
                    <p className="mt-2 text-blue-400">Go to the main page to add voice samples.</p>
                  </div>
                )}
              </div>
            )}
            
            {profiles.length > 0 && (
              <div className="p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                <p className="text-sm text-green-200">
                  ✅ <strong>Voice Profiles Available:</strong> {profiles.length} active profile{profiles.length !== 1 ? 's' : ''} loaded. 
                  Click the profile buttons above for quick speaker assignment.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}