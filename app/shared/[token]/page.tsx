'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import ResultsDisplay from '@/app/components/results/ResultsDisplay';
import type { AnalysisResult } from '@/lib/types/meeting.types';

interface Meeting {
  id: string;
  title: string;
  fileName?: string;
  analysisResult: AnalysisResult;
  createdAt: string;
}

interface SharedBy {
  name: string;
  email: string;
}

export default function SharedMeetingPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [sharedBy, setSharedBy] = useState<SharedBy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSharedMeeting();
  }, [resolvedParams.token]);

  const fetchSharedMeeting = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shared/${resolvedParams.token}`);

      if (response.ok) {
        const data = await response.json();
        setMeeting(data.meeting);
        setSharedBy(data.sharedBy);
      } else if (response.status === 404) {
        setError('This share link is invalid or has expired.');
      } else {
        setError('Failed to load shared meeting.');
      }
    } catch (err) {
      setError('Failed to load shared meeting.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 text-center">
          <svg
            className="w-16 h-16 text-red-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className="text-2xl font-light text-white mb-4">Share Link Not Found</h1>
          <p className="text-gray-400 mb-6">
            {error || 'This share link is invalid or has expired.'}
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all duration-200"
          >
            Go to KNest
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Watermark */}
        <div className="mb-8">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-white mb-2">{meeting.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>Meeting from {formatDate(meeting.createdAt)}</span>
                  {meeting.fileName && (
                    <>
                      <span>•</span>
                      <span>{meeting.fileName}</span>
                    </>
                  )}
                </div>
              </div>
              <a
                href="/"
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all duration-200"
              >
                Try KNest
              </a>
            </div>
          </div>

          {/* Shared By */}
          {sharedBy && (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-400">
                Shared by{' '}
                <span className="text-gray-200 font-medium">{sharedBy.name}</span>
              </p>
            </div>
          )}
        </div>

        {/* Read-only Results */}
        <div className="relative">
          {/* Watermark overlay */}
          <div className="absolute top-4 right-4 z-10 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2">
            <p className="text-xs text-gray-400">
              Shared via{' '}
              <span className="text-violet-400 font-medium">KNest</span>
            </p>
          </div>

          <ResultsDisplay result={meeting.analysisResult} meetingId={null} />
        </div>

        {/* Footer CTA */}
        <div className="mt-12 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/30 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-light text-white mb-4">
            Want to analyze your own meetings?
          </h2>
          <p className="text-gray-400 mb-6">
            KNest uses AI to transform your meetings into actionable intelligence with summaries,
            action items, and full transcripts.
          </p>
          <a
            href="/"
            className="inline-block px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 font-medium"
          >
            Get Started Free
          </a>
        </div>
      </div>
    </div>
  );
}
