import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MeetingParticipantService } from '@/lib/services/meeting-participant.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const participants = await MeetingParticipantService.getParticipants(
      id,
      session.user.id
    );

    return NextResponse.json({ participants });
  } catch (error) {
    console.error('Get participants error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get participants';
    const status = message === 'Access denied' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const participant = await MeetingParticipantService.addParticipant({
      meetingId: id,
      userEmail: email,
      requestingUserId: session.user.id,
    });

    return NextResponse.json({ participant });
  } catch (error) {
    console.error('Add participant error:', error);
    const message = error instanceof Error ? error.message : 'Failed to add participant';

    let status = 500;
    if (message === 'Meeting not found or access denied') status = 403;
    if (message === 'User not found') status = 404;
    if (message === 'User is already the owner of this meeting' ||
        message === 'User is already a participant') status = 400;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const participantUserId = searchParams.get('userId');

    if (!participantUserId) {
      return NextResponse.json(
        { error: 'Participant user ID is required' },
        { status: 400 }
      );
    }

    await MeetingParticipantService.removeParticipant({
      meetingId: id,
      participantUserId,
      requestingUserId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove participant error:', error);
    const message = error instanceof Error ? error.message : 'Failed to remove participant';
    const status = message === 'Meeting not found or access denied' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
