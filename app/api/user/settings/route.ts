import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ApiKeyService } from '@/lib/services/api-key.service';
import { updateUserSettingsSchema } from '@/lib/validations/schemas';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const maskedKey = await ApiKeyService.getMaskedApiKey(session.user.id);
    const hasKey = await ApiKeyService.hasApiKey(session.user.id);

    return NextResponse.json({
      hasApiKey: hasKey,
      maskedApiKey: maskedKey,
    });
  } catch (error) {
    console.error('Get user settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateUserSettingsSchema.parse(body);

    if (validatedData.geminiApiKey) {
      try {
        await ApiKeyService.saveApiKey(session.user.id, validatedData.geminiApiKey);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your Gemini API key and try again.' },
          { status: 400 }
        );
      }
    }

    const maskedKey = await ApiKeyService.getMaskedApiKey(session.user.id);

    return NextResponse.json({
      success: true,
      maskedApiKey: maskedKey,
    });
  } catch (error) {
    console.error('Update user settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ApiKeyService.removeApiKey(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
