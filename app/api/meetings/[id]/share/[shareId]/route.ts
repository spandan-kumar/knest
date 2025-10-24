import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SharedMeetingService } from '@/lib/services/shared-meeting.service';

interface RouteContext {
  params: Promise<{ id: string; shareId: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    await SharedMeetingService.revokeShareLink(params.shareId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Revoke share link error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke share link' },
      { status: 500 }
    );
  }
}
