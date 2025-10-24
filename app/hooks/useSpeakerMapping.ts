'use client';

import { useState, useCallback, useEffect } from 'react';
import type { AnalysisResult } from '@/lib/types/meeting.types';

interface UseSpeakerMappingReturn {
  speakerMappings: Record<string, string>;
  processedResult: AnalysisResult;
  updateSpeakerMappings: (mappings: Record<string, string>) => void;
}

export function useSpeakerMapping(
  originalResult: AnalysisResult,
  savedMappings?: Record<string, string>
): UseSpeakerMappingReturn {
  // Initialize with saved mappings if available, otherwise use suggested names
  const [speakerMappings, setSpeakerMappings] = useState<Record<string, string>>(() => {
    // Priority: savedMappings > suggested names
    if (savedMappings && Object.keys(savedMappings).length > 0) {
      return savedMappings;
    }

    const initialMappings: Record<string, string> = {};
    if (originalResult.speaker_identification?.speaker_hints) {
      originalResult.speaker_identification.speaker_hints.forEach((hint) => {
        if (hint.suggested_name) {
          initialMappings[hint.speaker_id] = hint.suggested_name;
        }
      });
    }
    return initialMappings;
  });

  const [processedResult, setProcessedResult] = useState<AnalysisResult>(() => {
    // Priority: savedMappings > suggested names
    if (savedMappings && Object.keys(savedMappings).length > 0) {
      return applyMappings(originalResult, savedMappings);
    }

    // Apply initial suggested names
    const initialMappings: Record<string, string> = {};
    if (originalResult.speaker_identification?.speaker_hints) {
      originalResult.speaker_identification.speaker_hints.forEach((hint) => {
        if (hint.suggested_name) {
          initialMappings[hint.speaker_id] = hint.suggested_name;
        }
      });
    }

    if (Object.keys(initialMappings).length > 0) {
      return applyMappings(originalResult, initialMappings);
    }
    return originalResult;
  });

  // Update mappings when savedMappings changes (e.g., on page reload)
  useEffect(() => {
    if (savedMappings && Object.keys(savedMappings).length > 0) {
      setSpeakerMappings(savedMappings);
      setProcessedResult(applyMappings(originalResult, savedMappings));
    }
  }, [savedMappings, originalResult]);

  const updateSpeakerMappings = useCallback(
    (mappings: Record<string, string>) => {
      setSpeakerMappings(mappings);
      setProcessedResult(applyMappings(originalResult, mappings));
    },
    [originalResult]
  );

  return {
    speakerMappings,
    processedResult,
    updateSpeakerMappings,
  };
}

// Helper function to replace speaker IDs with real names
function replaceSpeakerNames(text: string, mappings: Record<string, string>): string {
  let processedText = text;
  Object.entries(mappings).forEach(([speakerId, realName]) => {
    if (realName.trim()) {
      const regex = new RegExp(`\\b${speakerId}\\b`, 'gi');
      processedText = processedText.replace(regex, realName);
    }
  });
  return processedText;
}

// Apply mappings to the entire result
function applyMappings(
  result: AnalysisResult,
  mappings: Record<string, string>
): AnalysisResult {
  return {
    ...result,
    transcript: replaceSpeakerNames(result.transcript, mappings),
    summary: replaceSpeakerNames(result.summary, mappings),
    mom: result.mom
      ? {
          ...result.mom,
          meeting_purpose: replaceSpeakerNames(result.mom.meeting_purpose, mappings),
          attendees: result.mom.attendees.map((attendee) =>
            replaceSpeakerNames(attendee, mappings)
          ),
          key_decisions: result.mom.key_decisions.map((decision) =>
            replaceSpeakerNames(decision, mappings)
          ),
          resolutions: result.mom.resolutions.map((resolution) =>
            replaceSpeakerNames(resolution, mappings)
          ),
          next_meeting: result.mom.next_meeting
            ? replaceSpeakerNames(result.mom.next_meeting, mappings)
            : result.mom.next_meeting,
        }
      : undefined,
    tasks: result.tasks.map((task) => ({
      ...task,
      action: replaceSpeakerNames(task.action, mappings),
      assigned_to: replaceSpeakerNames(task.assigned_to, mappings),
      context: task.context ? replaceSpeakerNames(task.context, mappings) : task.context,
      deliverable: task.deliverable
        ? replaceSpeakerNames(task.deliverable, mappings)
        : task.deliverable,
    })),
    participants: result.participants?.map((participant) => ({
      ...participant,
      speaker_id: replaceSpeakerNames(participant.speaker_id, mappings),
      key_contributions: participant.key_contributions?.map((contrib) =>
        replaceSpeakerNames(contrib, mappings)
      ),
      expertise_areas: participant.expertise_areas?.map((area) =>
        replaceSpeakerNames(area, mappings)
      ),
    })),
    topics: result.topics?.map((topic) => ({
      ...topic,
      key_points: topic.key_points?.map((point) =>
        replaceSpeakerNames(point, mappings)
      ),
      decisions_made: topic.decisions_made?.map((decision) =>
        replaceSpeakerNames(decision, mappings)
      ),
      open_questions: topic.open_questions?.map((question) =>
        replaceSpeakerNames(question, mappings)
      ),
    })),
  };
}
