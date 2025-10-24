'use client';

import type { AnalysisResult } from '@/lib/types/meeting.types';
import { useSpeakerMapping } from '@/app/hooks/useSpeakerMapping';
import SpeakerMapping from '../SpeakerMapping';
import { clientLoggers } from '@/lib/client-logger';

interface ResultsDisplayProps {
  result: AnalysisResult;
  meetingId: string | null;
  savedSpeakerMappings?: Record<string, string> | null;
}

export default function ResultsDisplay({ result, meetingId, savedSpeakerMappings }: ResultsDisplayProps) {
  console.log('[ResultsDisplay] savedSpeakerMappings:', savedSpeakerMappings);

  const { speakerMappings, processedResult, updateSpeakerMappings } = useSpeakerMapping(
    result,
    savedSpeakerMappings || undefined
  );

  console.log('[ResultsDisplay] speakerMappings from hook:', speakerMappings);

  const downloadMarkdown = async () => {
    try {
      const response = await fetch('/api/export-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedResult),
      });

      if (!response.ok) {
        throw new Error('Failed to export meeting report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `meeting-report-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      clientLoggers.ui.downloadError(error);
      alert('Failed to download report. Please try again.');
    }
  };

  const downloadTranscript = async () => {
    try {
      const response = await fetch('/api/export-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: processedResult.transcript }),
      });

      if (!response.ok) {
        throw new Error('Failed to export transcript');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `meeting-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      clientLoggers.ui.downloadError(error);
      alert('Failed to download transcript. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-6xl space-y-8">
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light text-white">Meeting Analysis</h2>
          <div className="flex space-x-3">
            <button
              onClick={downloadTranscript}
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center space-x-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Transcript</span>
            </button>
            <button
              onClick={downloadMarkdown}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-3 group"
            >
              <svg
                className="w-5 h-5 group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="font-medium">Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {result.speaker_identification && (
        <SpeakerMapping
          speakerIdentification={result.speaker_identification}
          onSpeakerMappingUpdate={updateSpeakerMappings}
          meetingId={meetingId}
        />
      )}

      <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
        <h2 className="text-xl font-light text-gray-100 mb-6">Executive Summary</h2>
        <p className="text-gray-300 leading-relaxed text-lg">{processedResult.summary}</p>
      </div>

      {processedResult.mom && (
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
          <h2 className="text-xl font-light text-gray-100 mb-6">Minutes of Meeting</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-200 mb-3">Meeting Purpose</h3>
              <p className="text-gray-300">{processedResult.mom.meeting_purpose}</p>
            </div>

            {processedResult.mom.attendees && processedResult.mom.attendees.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">Attendees</h3>
                <ul className="text-gray-300 space-y-1">
                  {processedResult.mom.attendees.map((attendee, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-violet-400 mr-2">•</span>
                      {attendee}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {processedResult.mom.key_decisions && processedResult.mom.key_decisions.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">Key Decisions</h3>
                <ul className="text-gray-300 space-y-2">
                  {processedResult.mom.key_decisions.map((decision, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      {decision}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {processedResult.mom.resolutions && processedResult.mom.resolutions.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">Resolutions</h3>
                <ul className="text-gray-300 space-y-2">
                  {processedResult.mom.resolutions.map((resolution, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-blue-400 mr-2">→</span>
                      {resolution}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {processedResult.mom.next_meeting && (
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-3">Next Meeting</h3>
                <p className="text-gray-300">{processedResult.mom.next_meeting}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {processedResult.meeting_metadata && (
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
          <h2 className="text-xl font-light text-gray-100 mb-6">Meeting Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
              <p className="text-sm text-gray-400 mb-2">Tone</p>
              <p className="font-medium text-white text-lg">
                {processedResult.meeting_metadata.overall_tone}
              </p>
            </div>
            <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
              <p className="text-sm text-gray-400 mb-2">Productivity</p>
              <p className="font-medium text-white text-lg">
                {processedResult.meeting_metadata.productivity_level}
              </p>
            </div>
            <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
              <p className="text-sm text-gray-400 mb-2">Speakers</p>
              <p className="font-medium text-white text-lg">
                {processedResult.meeting_metadata.total_speakers}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
        <h2 className="text-xl font-light text-gray-100 mb-6">Action Items</h2>
        <div className="space-y-4">
          {processedResult.tasks.map((task, index) => (
            <div key={index} className="border border-gray-700/50 rounded-xl p-6 bg-gray-800/20">
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 text-violet-500 bg-gray-800 border-gray-600 rounded focus:ring-violet-500 focus:ring-2"
                />
                <div className="flex-1">
                  <p className="text-gray-100 font-medium text-lg">{task.action}</p>
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium text-gray-200">Assigned to:</span>{' '}
                      {task.assigned_to}
                    </p>
                    {task.priority && (
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-gray-200">Priority:</span>
                        <span
                          className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${
                            task.priority === 'high'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : task.priority === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                              : 'bg-green-500/20 text-green-300 border border-green-500/30'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </p>
                    )}
                    {task.deadline && (
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-gray-200">Deadline:</span> {task.deadline}
                      </p>
                    )}
                    {task.context && (
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-gray-200">Context:</span> {task.context}
                      </p>
                    )}
                    {task.deliverable && (
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-gray-200">Deliverable:</span>{' '}
                        {task.deliverable}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {processedResult.participants && processedResult.participants.length > 0 && (
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
          <h2 className="text-xl font-light text-gray-100 mb-6">Participants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {processedResult.participants.map((participant, index) => (
              <div key={index} className="border border-gray-700/50 rounded-xl p-6 bg-gray-800/20">
                <h3 className="font-medium text-gray-100 mb-3 text-lg">{participant.speaker_id}</h3>
                <p className="text-sm text-gray-300 mb-4">
                  <span className="font-medium text-gray-200">Participation:</span>{' '}
                  {participant.participation_level}
                </p>
                {participant.key_contributions && participant.key_contributions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-200 mb-2">Key Contributions:</p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {participant.key_contributions?.map((contribution, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-violet-400 mr-2">•</span>
                          {contribution}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {processedResult.topics && processedResult.topics.length > 0 && (
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
          <h2 className="text-xl font-light text-gray-100 mb-6">Topics Discussed</h2>
          <div className="space-y-6">
            {processedResult.topics?.map((topic, index) => (
              <div key={index} className="border border-gray-700/50 rounded-xl p-6 bg-gray-800/20">
                <h3 className="font-medium text-gray-100 mb-3 text-lg">{topic.topic}</h3>
                <p className="text-sm text-gray-300 mb-4">
                  <span className="font-medium text-gray-200">Emphasis:</span>{' '}
                  {topic.duration_emphasis}
                </p>

                {topic.key_points && topic.key_points.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-200 mb-2">Key Points:</p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {topic.key_points?.map((point, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-violet-400 mr-2">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {topic.decisions_made && topic.decisions_made.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-200 mb-2">Decisions Made:</p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {topic.decisions_made?.map((decision, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-green-400 mr-2">✓</span>
                          {decision}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {topic.open_questions && topic.open_questions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-200 mb-2">Open Questions:</p>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {topic.open_questions?.map((question, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-yellow-400 mr-2">?</span>
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
        <h2 className="text-xl font-light text-gray-100 mb-6">Full Transcript</h2>
        <div className="bg-gray-950/50 rounded-xl p-6 max-h-96 overflow-y-auto border border-gray-800/30">
          <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono leading-relaxed">
            {processedResult.transcript}
          </pre>
        </div>
      </div>
    </div>
  );
}
