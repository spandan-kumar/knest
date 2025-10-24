import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SharedMeetingService } from '@/lib/services/shared-meeting.service';
import { createShareSchema } from '@/lib/validations/schemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const body = await request.json();

    // Validate input
    const validatedData = createShareSchema.parse(body);

    const shareLink = await SharedMeetingService.createShareLink({
      meetingId: params.id,
      userId: session.user.id,
      expiresInDays: validatedData.expiresInDays,
    });

    // Generate full share URL
    const shareUrl = `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/shared/${
      shareLink.shareToken
    }`;

    return NextResponse.json({
      ...shareLink,
      shareUrl,
    });
  } catch (error) {
    console.error('Create share link error:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const shareLinks = await SharedMeetingService.getShareLinks(
      params.id,
      session.user.id
    );

    return NextResponse.json(shareLinks);
  } catch (error) {
    console.error('Get share links error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share links' },
      { status: 500 }
    );
  }
}
