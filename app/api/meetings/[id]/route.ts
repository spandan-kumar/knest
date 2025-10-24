import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MeetingService } from '@/lib/services/meeting.service';
import { updateMeetingSchema } from '@/lib/validations/schemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const meeting = await MeetingService.getMeetingById(params.id, session.user.id);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Add ownership info
    const isOwner = meeting.userId === session.user.id;

    return NextResponse.json({
      ...meeting,
      isOwner,
    });
  } catch (error) {
    console.error('Get meeting error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const body = await request.json();

    // Validate input
    const validatedData = updateMeetingSchema.parse(body);

    const updatedMeeting = await MeetingService.updateMeeting(
      params.id,
      session.user.id,
      {
        title: validatedData.title,
        speakerMappings: validatedData.speakerMappings as Record<string, string> | undefined,
      }
    );

    return NextResponse.json(updatedMeeting);
  } catch (error) {
    console.error('Update meeting error:', error);
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  // PATCH is an alias for PUT to support partial updates
  return PUT(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    await MeetingService.deleteMeeting(params.id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete meeting error:', error);
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    );
  }
}
