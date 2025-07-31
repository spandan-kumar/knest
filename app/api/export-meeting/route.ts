import { NextRequest, NextResponse } from 'next/server';
import { ReportExportService } from '@/lib/services/report-export.service';
import { APIErrorHandler } from '@/lib/utils/api-error-handler';
import { loggers } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const perfTimer = loggers.perf.start('export-meeting');
  loggers.api.start('/api/export-meeting', 'POST');
  
  try {
    const meetingData = await req.json();
    
    const exportService = new ReportExportService();
    const result = exportService.generateMarkdownReport(meetingData);
    
    perfTimer.end();
    loggers.api.success('/api/export-meeting', 'POST');

    return new NextResponse(result.content, {
      status: 200,
      headers: {
        'Content-Type': result.mimeType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error) {
    perfTimer.end();
    return APIErrorHandler.handleError('/api/export-meeting', 'POST', {
      message: 'Failed to export meeting report',
      status: 500,
      type: 'EXPORT_ERROR'
    });
  }
}

