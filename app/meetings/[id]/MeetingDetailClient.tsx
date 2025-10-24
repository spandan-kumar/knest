'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ResultsDisplay from '@/app/components/results/ResultsDisplay';
import ParticipantSelector from '@/app/components/meeting/ParticipantSelector';
import type { AnalysisResult } from '@/lib/types/meeting.types';
import type { Session } from 'next-auth';

interface MeetingDetailClientProps {
  session: Session;
  meetingId: string;
}

interface Meeting {
  id: string;
  title: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  analysisResult: AnalysisResult;
  speakerMappings: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
}

interface ShareLink {
  id: string;
  shareToken: string;
  createdAt: string;
  expiresAt: string | null;
  isExpired: boolean;
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

export default function MeetingDetailClient({ session, meetingId }: MeetingDetailClientProps) {
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [isCreatingShare, setIsCreatingShare] = useState(false);

  // Fetch meeting
  useEffect(() => {
    fetchMeeting();
    fetchShareLinks();
    fetchParticipants();
  }, [meetingId]);

  const fetchMeeting = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/meetings/${meetingId}`);
      if (response.ok) {
        const data = await response.json();
        setMeeting(data);
        setEditedTitle(data.title);
      } else if (response.status === 404) {
        alert('Meeting not found');
        router.push('/meetings');
      }
    } catch (error) {
      console.error('Failed to fetch meeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShareLinks = async () => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}/share`);
      if (response.ok) {
        const data = await response.json();
        setShareLinks(data);
      }
    } catch (error) {
      console.error('Failed to fetch share links:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}/participants`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants);
      }
    } catch (error) {
      console.error('Failed to fetch participants:', error);
    }
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim() || editedTitle === meeting?.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editedTitle }),
      });

      if (response.ok) {
        const updated = await response.json();
        setMeeting(updated);
        setIsEditingTitle(false);
      }
    } catch (error) {
      alert('Failed to update title');
    }
  };

  const handleCreateShareLink = async () => {
    setIsCreatingShare(true);
    try {
      const response = await fetch(`/api/meetings/${meetingId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresInDays }),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchShareLinks();
        setShowShareModal(false);

        // Copy to clipboard
        navigator.clipboard.writeText(data.shareUrl);
        alert('Share link created and copied to clipboard!');
      }
    } catch (error) {
      alert('Failed to create share link');
    } finally {
      setIsCreatingShare(false);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    if (!confirm('Are you sure you want to revoke this share link?')) {
      return;
    }

    try {
      const response = await fetch(`/api/meetings/${meetingId}/share/${shareId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchShareLinks();
      }
    } catch (error) {
      alert('Failed to revoke share link');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this meeting? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/meetings');
      }
    } catch (error) {
      alert('Failed to delete meeting');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!meeting) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link href="/meetings" className="text-gray-400 hover:text-gray-200 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            {isEditingTitle ? (
              <div className="flex-1 flex items-center space-x-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-2xl outline-none focus:border-violet-500"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle()}
                />
                <button
                  onClick={handleSaveTitle}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditedTitle(meeting.title);
                    setIsEditingTitle(false);
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center space-x-4">
                <h1 className="text-4xl font-light text-white">{meeting.title}</h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center space-x-4 text-sm text-gray-400 mb-6">
            <span>Created {formatDate(meeting.createdAt)}</span>
            {meeting.fileName && (
              <>
                <span>•</span>
                <span>{meeting.fileName}</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all duration-200"
            >
              Share Link
            </button>
            {meeting.isOwner && (
              <button
                onClick={handleDelete}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200"
              >
                Delete Meeting
              </button>
            )}
          </div>
        </div>

        {/* Participants */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-light text-white mb-4">Meeting Participants</h2>
          <ParticipantSelector
            meetingId={meetingId}
            participants={participants}
            onParticipantAdded={fetchParticipants}
            onParticipantRemoved={fetchParticipants}
            isOwner={meeting.isOwner}
          />
        </div>

        {/* Share Links */}
        {shareLinks.length > 0 && meeting.isOwner && (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-light text-white mb-4">Active Share Links</h2>
            <div className="space-y-3">
              {shareLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-400">
                      {link.expiresAt
                        ? `Expires ${formatDate(link.expiresAt)}`
                        : 'Never expires'}
                    </p>
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      {`${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/shared/${link.shareToken}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `${window.location.origin}/shared/${link.shareToken}`
                        )
                      }
                      className="px-3 py-1 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => handleRevokeShare(link.id)}
                      className="px-3 py-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <ResultsDisplay
          result={meeting.analysisResult}
          meetingId={meetingId}
          savedSpeakerMappings={meeting.speakerMappings}
        />

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-light text-white mb-6">Create Share Link</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Link expires in
                  </label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 outline-none focus:border-violet-500"
                  >
                    <option value={1}>1 day</option>
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>
                <p className="text-sm text-gray-400">
                  Anyone with the link will be able to view this meeting's analysis.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCreateShareLink}
                  disabled={isCreatingShare}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isCreatingShare ? 'Creating...' : 'Create & Copy Link'}
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
