'use client';

import { useState, useEffect } from 'react';
import type { SpeakerIdentification, SpeakerHint } from '@/lib/types/meeting.types';

interface SpeakerMappingProps {
  speakerIdentification: SpeakerIdentification;
  onSpeakerMappingUpdate: (mappings: Record<string, string>) => void;
  meetingId: string | null;
  className?: string;
}

export default function SpeakerMapping({
  speakerIdentification,
  onSpeakerMappingUpdate,
  meetingId,
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    onSpeakerMappingUpdate(mappings);
  }, [mappings, onSpeakerMappingUpdate]);

  const handleNameChange = (speakerId: string, name: string) => {
    const newMappings = { ...mappings, [speakerId]: name };
    setMappings(newMappings);
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

  const handleSaveMappings = async () => {
    if (!meetingId) {
      setSaveMessage('Cannot save: Meeting ID not available');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          speakerMappings: mappings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save speaker mappings');
      }

      setSaveMessage('Speaker mappings saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage('Failed to save speaker mappings');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
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

              {/* Name Input */}
              <div className="mb-3">
                <label className="block text-sm text-gray-300 mb-2">Enter Speaker Name:</label>
                <input
                  type="text"
                  value={mappings[hint.speaker_id] || ''}
                  onChange={(e) => handleNameChange(hint.speaker_id, e.target.value)}
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

            {/* Save Button */}
            {meetingId && (
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSaveMappings}
                  disabled={isSaving}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save Speaker Names</span>
                    </>
                  )}
                </button>
                {saveMessage && (
                  <span className={`text-sm ${saveMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                    {saveMessage}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}