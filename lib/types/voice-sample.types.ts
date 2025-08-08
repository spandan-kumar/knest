export interface VoiceSample {
  id: string;
  name: string;
  audioBlob: Blob;
  audioUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  sampleText: string; // The text that was read for this sample
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  duration: number; // in seconds
  fileSize: number; // in bytes
}

export interface VoiceSampleMetadata {
  id: string;
  name: string;
  sampleText: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  duration: number;
  fileSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiarizationProfile {
  id: string;
  name: string;
  voiceSamples: VoiceSampleMetadata[];
  isActive: boolean;
  confidence: number; // 0-1 based on sample quality and quantity
  lastUsed?: Date;
}

export interface VoiceSampleRecordingConfig {
  maxDuration: number; // in seconds
  minDuration: number; // in seconds
  sampleRate: number;
  channels: number;
  bitRate: number;
}