// Centralized type definitions for meeting analysis

export interface Task {
  action: string;
  assigned_to: string;
  deadline?: string;
  priority?: string;
  context?: string;
  deliverable?: string;
}

export interface Participant {
  speaker_id: string;
  participation_level: string;
  key_contributions?: string[];
  expertise_areas?: string[];
}

export interface Topic {
  topic: string;
  duration_emphasis?: string;
  key_points?: string[];
  decisions_made?: string[];
  open_questions?: string[];
}

export interface MeetingMetadata {
  overall_tone?: string;
  productivity_level?: string;
  total_speakers?: string;
  main_outcomes?: string[];
  follow_up_required?: string[];
}

export interface MinutesOfMeeting {
  meeting_purpose: string;
  attendees: string[];
  key_decisions: string[];
  resolutions: string[];
  next_meeting?: string | null;
}

export interface SpeakerHint {
  speaker_id: string;
  suggested_name?: string | null;
  role_hints: string[];
  context_clues: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface SpeakerIdentification {
  total_speakers: string;
  speaker_hints: SpeakerHint[];
}

export interface AnalysisResult {
  summary: string;
  mom?: MinutesOfMeeting;
  tasks: Task[];
  transcript: string;
  speaker_identification: SpeakerIdentification;
  participants?: Participant[];
  topics?: Topic[];
  meeting_metadata?: MeetingMetadata;
}

export interface CompressionResult {
  compressedBlob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}