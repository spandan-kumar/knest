'use client';

import { useState, useEffect, useRef } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface Participant {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ParticipantSelectorProps {
  meetingId: string;
  participants: Participant[];
  onParticipantAdded: () => void;
  onParticipantRemoved: () => void;
  isOwner: boolean;
}

export default function ParticipantSelector({
  meetingId,
  participants,
  onParticipantAdded,
  onParticipantRemoved,
  isOwner,
}: ParticipantSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/user/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          // Filter out users already added as participants
          const participantIds = participants.map(p => p.userId);
          const filtered = data.users.filter((user: User) => !participantIds.includes(user.id));
          setSearchResults(filtered);
          setShowDropdown(filtered.length > 0);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, participants]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddParticipant = async (email: string) => {
    setIsAdding(true);
    try {
      const response = await fetch(`/api/meetings/${meetingId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSearchQuery('');
        setShowDropdown(false);
        onParticipantAdded();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add participant');
      }
    } catch (error) {
      alert('Failed to add participant');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!confirm('Remove this participant from the meeting?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/meetings/${meetingId}/participants?userId=${userId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        onParticipantRemoved();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove participant');
      }
    } catch (error) {
      alert('Failed to remove participant');
    }
  };

  const highlightMatch = (text: string, query: string) => {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <span className="bg-violet-500/30 text-violet-200">
          {text.substring(index, index + query.length)}
        </span>
        {text.substring(index + query.length)}
      </>
    );
  };

  return (
    <div className="space-y-4">
      {isOwner && (
        <p className="text-sm text-gray-400 mb-2">
          Add registered users to collaborate on this meeting
        </p>
      )}

      {/* Search Input */}
      {isOwner && (
        <div className="relative">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email (e.g., pri)..."
              className="w-full px-4 py-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
              disabled={isAdding}
            />
            <svg
              className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-500"></div>
              </div>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAddParticipant(user.email)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                  disabled={isAdding}
                >
                  <div className="font-medium text-gray-200">
                    {highlightMatch(user.name, searchQuery)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {highlightMatch(user.email, searchQuery)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Participants List */}
      {participants.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-400">
            {participants.length} {participants.length === 1 ? 'Participant' : 'Participants'}
          </h4>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-200">{participant.user.name}</div>
                  <div className="text-sm text-gray-400">{participant.user.email}</div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleRemoveParticipant(participant.userId)}
                    className="ml-4 text-red-400 hover:text-red-300 transition-colors"
                    title="Remove participant"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          {isOwner ? 'No participants added yet' : 'No other participants'}
        </p>
      )}
    </div>
  );
}
