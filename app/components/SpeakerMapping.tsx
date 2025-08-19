'use client';

import { useState, useEffect } from 'react';
import type { SpeakerIdentification, SpeakerHint } from '@/lib/types/meeting.types';

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
            
          </div>
        </div>
      )}
    </div>
  );
}