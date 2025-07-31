import { NextResponse } from 'next/server';
import { loggers } from '@/lib/logger';

export interface APIError {
  message: string;
  status: number;
  type?: string;
  timestamp?: string;
}

export class APIErrorHandler {
  static handleError(endpoint: string, method: string, error: APIError): NextResponse {
    // Enhanced error logging with more context
    loggers.api.error(endpoint, method, {
      ...error,
      endpoint,
      method,
      stack: error instanceof Error ? (error as Error).stack : undefined
    });

    return NextResponse.json(
      {
        error: error.message,
        ...(error.type && { errorType: error.type }),
        timestamp: error.timestamp || new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { 
          endpoint, 
          method,
          details: 'Check server logs for more information'
        })
      },
      { status: error.status }
    );
  }

  static success(endpoint: string, method: string, data: any): NextResponse {
    loggers.api.success(endpoint, method);
    return NextResponse.json(data);
  }
}