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
      'audio/aac',
      'audio/flac',
      'audio/x-flac',
      'audio/mp3',
      'audio/mpeg3',
      'audio/x-mp3',
      'audio/m4a',
      'audio/x-m4a', // Alternative M4A MIME type
      'audio/mpeg',
      'audio/mpga',
      'audio/mp4',
      'audio/opus',
      'audio/x-opus',
      'audio/pcm',
      'audio/x-pcm',
      'audio/wav',
      'audio/x-wav', // Alternative WAV MIME type - this was missing!
      'audio/wave',
      'audio/x-wave',
      'audio/webm',
      'audio/x-webm',
      'audio/ogg',
      'audio/x-ogg',
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

    // Validate file type (handle codec specifications like "audio/webm;codecs=opus")
    const baseType = file.type.split(';')[0]; // Extract base type without codec info
    
    console.log(`🔍 File validation debug:`, {
      originalType: file.type,
      baseType: baseType,
      allowedTypes: this.config.allowedMimeTypes,
      exactMatch: this.config.allowedMimeTypes.includes(file.type),
      baseMatch: this.config.allowedMimeTypes.includes(baseType)
    });
    
    if (!this.config.allowedMimeTypes.includes(file.type) && !this.config.allowedMimeTypes.includes(baseType)) {
      return {
        isValid: false,
        error: `Unsupported audio format: ${file.type} (base: ${baseType}). Supported formats: AAC, FLAC, MP3, M4A, MPEG, MPGA, MP4, OPUS, PCM, WAV, WebM, OGG`,
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