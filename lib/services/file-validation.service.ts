import { log } from '@/lib/logger';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    name: string;
    size: number;
    type: string;
    sizeMB: number;
  };
}

export interface FileValidationConfig {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
}

export class FileValidationService {
  private static readonly DEFAULT_CONFIG: FileValidationConfig = {
    maxSizeBytes: 200 * 1024 * 1024, // 200MB
    allowedMimeTypes: [
      'audio/x-aac',
      'audio/flac', 
      'audio/mp3',
      'audio/m4a',
      'audio/x-m4a', // Alternative M4A MIME type
      'audio/mpeg',
      'audio/mpga',
      'audio/mp4',
      'audio/opus',
      'audio/pcm',
      'audio/wav',
      'audio/webm',
      // Video formats that contain audio
      'video/mp4',
      'video/webm',
      'video/ogg'
    ]
  };

  private config: FileValidationConfig;

  constructor(config?: Partial<FileValidationConfig>) {
    this.config = { ...FileValidationService.DEFAULT_CONFIG, ...config };
  }

  validateFile(file: File): FileValidationResult {
    const details = {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeMB: Math.round(file.size / (1024 * 1024))
    };

    log.debug({ details }, '🔍 Validating file');

    // Check if file exists
    if (!file) {
      return {
        isValid: false,
        error: 'No audio file provided',
        details
      };
    }

    // Check for empty files
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'Audio file is empty (0 bytes). Please check your file and try again.',
        details
      };
    }

    // Check for minimum file size (1KB)
    if (file.size < 1024) {
      return {
        isValid: false,
        error: 'Audio file is too small. Please ensure you have a valid audio recording.',
        details
      };
    }

    // Validate file size
    if (file.size > this.config.maxSizeBytes) {
      const maxSizeMB = Math.round(this.config.maxSizeBytes / (1024 * 1024));
      return {
        isValid: false,
        error: `File size exceeds ${maxSizeMB}MB limit. Current file: ${details.sizeMB}MB`,
        details
      };
    }

    // Validate file type
    if (!this.config.allowedMimeTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Unsupported audio format: ${file.type}. Supported formats: AAC, FLAC, MP3, M4A, MPEG, MPGA, MP4, OPUS, PCM, WAV, WebM`,
        details
      };
    }

    log.debug({ details }, '✅ File validation passed');
    return {
      isValid: true,
      details
    };
  }

  getAllowedMimeTypes(): string[] {
    return [...this.config.allowedMimeTypes];
  }

  getMaxSizeBytes(): number {
    return this.config.maxSizeBytes;
  }
}