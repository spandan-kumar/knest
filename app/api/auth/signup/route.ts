import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json();

    // Validate required fields
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    // Create user
    const user = await UserService.createUser({
      email,
      name,
      password,
    });

    // Return success (without sensitive data)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}