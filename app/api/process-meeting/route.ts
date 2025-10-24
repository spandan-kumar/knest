import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { MeetingProcessingService } from '@/lib/services/meeting-processing.service';
import { MeetingService } from '@/lib/services/meeting.service';
import { ApiKeyService } from '@/lib/services/api-key.service';
import { APIErrorHandler } from '@/lib/utils/api-error-handler';
import { loggers } from '@/lib/logger';

export const maxDuration = 900;

export async function POST(req: NextRequest) {
  loggers.api.start('/api/process-meeting', 'POST');

  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return APIErrorHandler.handleError('/api/process-meeting', 'POST', {
        message: 'Unauthorized',
        status: 401,
        type: 'UNAUTHORIZED',
      });
    }

    const userId = session.user.id;

    // Get user's API key
    const apiKey = await ApiKeyService.getApiKey(userId);
    if (!apiKey) {
      return APIErrorHandler.handleError('/api/process-meeting', 'POST', {
        message: 'Gemini API key not configured. Please add your API key in settings.',
        status: 400,
        type: 'API_KEY_NOT_CONFIGURED',
      });
    }

    // Parse form data
    const formData = await req.formData();

    // Extract file metadata
    const audioFile = formData.get('audio') as File;
    const fileName = audioFile?.name;
    const fileSize = audioFile?.size;
    const durationStr = formData.get('duration') as string | null;
    const duration = durationStr ? parseInt(durationStr, 10) : null;

    // Process meeting with service layer
    const meetingService = new MeetingProcessingService(apiKey);
    const result = await meetingService.processMeeting({ formData });

    if (!result.success) {
      return APIErrorHandler.handleError('/api/process-meeting', 'POST', result.error!);
    }

    // Generate a default title from the file name or timestamp
    const defaultTitle = fileName
      ? fileName.replace(/\.[^/.]+$/, '')
      : `Meeting ${new Date().toLocaleDateString()}`;

    // Save meeting to database
    const savedMeeting = await MeetingService.createMeeting({
      userId,
      title: defaultTitle,
      fileName,
      fileSize,
      duration: duration ?? undefined,
      analysisResult: result.data,
    });

    // Return the analysis result with meeting ID
    return APIErrorHandler.success('/api/process-meeting', 'POST', {
      ...result.data,
      meetingId: savedMeeting.id,
    });
  } catch (error) {
    console.error('Process meeting error:', error);
    return APIErrorHandler.handleError('/api/process-meeting', 'POST', {
      message: 'Failed to process meeting audio',
      status: 500,
      type: 'UNEXPECTED_ERROR',
    });
  }
}