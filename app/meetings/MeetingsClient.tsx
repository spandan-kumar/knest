'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Session } from 'next-auth';
import UserMenu from '../components/UserMenu';

interface MeetingsClientProps {
  session: Session;
}

interface Meeting {
  id: string;
  userId: string;
  title: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

export default function MeetingsClient({ session }: MeetingsClientProps) {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch meetings
  useEffect(() => {
    fetchMeetings();
  }, [page, search]);

  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
      });

      const response = await fetch(`/api/meetings?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) {
      return;
    }

    try {
      const response = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the list
        fetchMeetings();
      } else {
        alert('Failed to delete meeting');
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  if (isLoading && meetings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <h1 className="text-4xl font-light text-white">My Meetings</h1>
            </div>
            <UserMenu session={session} />
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset to first page on search
              }}
              placeholder="Search meetings..."
              className="w-full px-4 py-3 pl-12 bg-gray-900/50 border border-gray-800 rounded-xl text-gray-200 placeholder-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
            />
            <svg
              className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2"
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
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">Total Meetings</p>
            <p className="text-3xl font-light text-white">{total}</p>
          </div>
        </div>

        {/* Meetings List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
          </div>
        ) : meetings.length === 0 ? (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl text-gray-400 mb-2">No meetings found</h3>
            <p className="text-gray-500 mb-6">
              {search
                ? 'Try a different search term'
                : 'Start by analyzing your first meeting'}
            </p>
            {!search && (
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all duration-200"
              >
                Analyze Meeting
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-violet-500/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Link href={`/meetings/${meeting.id}`}>
                        <h3 className="text-lg font-medium text-white hover:text-violet-400 transition-colors">
                          {meeting.title}
                        </h3>
                      </Link>
                      {meeting.userId !== session.user?.id && (
                        <span className="px-2 py-1 text-xs bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30">
                          Shared
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-400">
                      <span>{formatDate(meeting.createdAt)}</span>
                      {meeting.fileName && (
                        <>
                          <span>•</span>
                          <span>{meeting.fileName}</span>
                        </>
                      )}
                      {meeting.fileSize && (
                        <>
                          <span>•</span>
                          <span>{formatFileSize(meeting.fileSize)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/meetings/${meeting.id}`}
                      className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      View
                    </Link>
                    {meeting.userId === session.user?.id && (
                      <button
                        onClick={() => handleDelete(meeting.id)}
                        className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
