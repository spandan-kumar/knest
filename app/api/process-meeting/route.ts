import { NextRequest } from 'next/server';
import { MeetingProcessingService } from '@/lib/services/meeting-processing.service';
import { APIErrorHandler } from '@/lib/utils/api-error-handler';
import { loggers } from '@/lib/logger';

export const maxDuration = 900;

export async function POST(req: NextRequest) {
  loggers.api.start('/api/process-meeting', 'POST');
  
  try {
    // Parse form data
    const formData = await req.formData();
    
    // Extract voice profiles if provided
    const voiceProfilesData = formData.get('voiceProfiles');
    let voiceProfiles;
    if (voiceProfilesData && typeof voiceProfilesData === 'string') {
      try {
        voiceProfiles = JSON.parse(voiceProfilesData);
      } catch (error) {
        console.warn('Failed to parse voice profiles:', error);
      }
    }
    
    // Process meeting with service layer
    const meetingService = new MeetingProcessingService();
    const result = await meetingService.processMeeting({ formData, voiceProfiles });
    
    if (!result.success) {
      return APIErrorHandler.handleError('/api/process-meeting', 'POST', result.error!);
    }
    
    return APIErrorHandler.success('/api/process-meeting', 'POST', result.data);
    
  } catch (error) {
    return APIErrorHandler.handleError('/api/process-meeting', 'POST', {
      message: 'Failed to process meeting audio',
      status: 500,
      type: 'UNEXPECTED_ERROR'
    });
  }
}