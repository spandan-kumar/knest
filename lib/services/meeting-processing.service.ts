import { FileValidationService } from './file-validation.service';
import { GeminiAIService } from './gemini-ai.service';
import { loggers, log } from '@/lib/logger';

export interface ProcessMeetingRequest {
  formData: FormData;
}

export interface ProcessMeetingResult {
  success: boolean;
  data?: any;
  error?: {
    message: string;
    status: number;
    type?: string;
  };
}

export class MeetingProcessingService {
  private fileValidator: FileValidationService;
  private geminiService: GeminiAIService;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required. Please configure your API key in settings.');
    }

    this.fileValidator = new FileValidationService();
    this.geminiService = new GeminiAIService(apiKey);
  }

  async processMeeting(request: ProcessMeetingRequest): Promise<ProcessMeetingResult> {
    const perfTimer = loggers.perf.start('process-meeting-service');

    try {
      // Extract and validate audio file
      const audioFile = await this.extractAudioFile(request.formData);
      
      // Validate file
      const validationResult = this.fileValidator.validateFile(audioFile);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: {
            message: validationResult.error!,
            status: 400,
            type: 'VALIDATION_ERROR'
          }
        };
      }

      loggers.file.received(audioFile.name, audioFile.size, audioFile.type);
      loggers.file.validated(audioFile.name, audioFile.type);

      // Convert file to buffer
      const audioBuffer = await this.convertFileToBuffer(audioFile);
      
      // Process with AI
      const analysisResult = await this.geminiService.analyzeAudio({
        audioFile,
        audioBuffer,
        prompt: GeminiAIService.createPrompt()
      });

      loggers.file.processed('meeting-analysis', perfTimer.end());

      return {
        success: true,
        data: analysisResult
      };

    } catch (error) {
      const duration = perfTimer.end();
      
      // Log the full error for debugging
      log.error({
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        duration,
        emoji: '💥'
      }, 'Meeting processing failed');
      
      // Handle specific error types
      if (error instanceof Error) {
        log.debug({}, '🔍 Checking error type for specific handling...');

        if (error.message.includes('File size exceeds')) {
          return {
            success: false,
            error: {
              message: 'File size exceeds 200MB limit',
              status: 400,
              type: 'FILE_TOO_LARGE'
            }
          };
        }

        if (error.message.includes('timed out')) {
          return {
            success: false,
            error: {
              message: 'Processing timed out after 12 minutes. The audio file may be too complex for comprehensive analysis.',
              status: 408,
              type: 'TIMEOUT'
            }
          };
        }

        if (error.message.includes('Unsupported audio format')) {
          return {
            success: false,
            error: {
              message: error.message,
              status: 400,
              type: 'INVALID_FORMAT'
            }
          };
        }

        if (error.message.includes('No audio file provided')) {
          return {
            success: false,
            error: {
              message: 'No audio file provided',
              status: 400,
              type: 'MISSING_FILE'
            }
          };
        }

        if (error.message.includes('API key not configured')) {
          return {
            success: false,
            error: {
              message: 'Gemini API key not configured',
              status: 500,
              type: 'CONFIG_ERROR'
            }
          };
        }

        return {
          success: false,
          error: {
            message: `API Error: ${error.message}`,
            status: 500,
            type: error.constructor.name
          }
        };
      }

      return {
        success: false,
        error: {
          message: 'Failed to process meeting audio',
          status: 500,
          type: 'UNKNOWN_ERROR'
        }
      };
    }
  }

  private async extractAudioFile(formData: FormData): Promise<File> {
    log.debug({}, '📁 Parsing form data...');
    
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      log.error({}, '❌ No audio file found in form data');
      throw new Error('No audio file provided');
    }

    return audioFile;
  }

  private async convertFileToBuffer(file: File): Promise<Buffer> {
    log.debug({}, '🔄 Converting file to buffer...');
    
    const bytes = await file.arrayBuffer();
    return Buffer.from(bytes);
  }
}