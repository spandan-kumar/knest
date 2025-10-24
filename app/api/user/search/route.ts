import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const lowerQuery = query.toLowerCase();

    // Search users by email or name
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: lowerQuery } },
          { name: { contains: lowerQuery } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
      take: 10, // Limit results
      orderBy: [{ email: 'asc' }],
    });

    // Filter out the current user
    const filteredUsers = users.filter(user => user.email !== session.user?.email);

    return NextResponse.json({ users: filteredUsers });
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
