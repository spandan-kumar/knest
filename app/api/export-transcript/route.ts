import { NextRequest, NextResponse } from 'next/server';
import { APIErrorHandler } from '@/lib/utils/api-error-handler';
import { loggers } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const perfTimer = loggers.perf.start('export-transcript');
  loggers.api.start('/api/export-transcript', 'POST');
  
  try {
    const { transcript } = await req.json();
    
    if (!transcript || typeof transcript !== 'string') {
      return APIErrorHandler.handleError('/api/export-transcript', 'POST', {
        message: 'Invalid transcript data provided',
        status: 400,
        type: 'INVALID_DATA'
      });
    }
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `meeting-transcript-${timestamp}.txt`;
    
    perfTimer.end();
    loggers.api.success('/api/export-transcript', 'POST');

    return new NextResponse(transcript, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    perfTimer.end();
    return APIErrorHandler.handleError('/api/export-transcript', 'POST', {
      message: 'Failed to export transcript',
      status: 500,
      type: 'EXPORT_ERROR'
    });
  }
}