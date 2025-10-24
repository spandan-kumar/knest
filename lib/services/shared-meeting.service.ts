import { prisma } from '@/lib/db/prisma';
import { nanoid } from 'nanoid';
import type { SharedMeeting } from '@prisma/client';
import type { MeetingWithAnalysis } from './meeting.service';
import { MeetingService } from './meeting.service';

export interface CreateShareLinkRequest {
  meetingId: string;
  userId: string;
  expiresInDays?: number;
}

export interface ShareLinkInfo {
  id: string;
  shareToken: string;
  createdAt: Date;
  expiresAt: Date | null;
  isExpired: boolean;
}

export class SharedMeetingService {
  /**
   * Creates a share link for a meeting
   */
  static async createShareLink(request: CreateShareLinkRequest): Promise<ShareLinkInfo> {
    const { meetingId, userId, expiresInDays } = request;

    // Verify the user owns the meeting
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId,
      },
    });

    if (!meeting) {
      throw new Error('Meeting not found or access denied');
    }

    // Calculate expiration date if specified
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Generate unique token
    const shareToken = nanoid(32);

    // Create share record
    const share = await prisma.sharedMeeting.create({
      data: {
        meetingId,
        shareToken,
        expiresAt,
      },
    });

    return this.toShareLinkInfo(share);
  }

  /**
   * Gets a meeting by share token (for public access)
   */
  static async getMeetingByToken(token: string): Promise<MeetingWithAnalysis | null> {
    const share = await prisma.sharedMeeting.findUnique({
      where: { shareToken: token },
      include: {
        meeting: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!share) {
      return null;
    }

    // Check if expired
    if (share.expiresAt && share.expiresAt < new Date()) {
      return null;
    }

    // Parse and return meeting
    return {
      ...share.meeting,
      analysisResult: JSON.parse(share.meeting.analysisResult),
      speakerMappings: share.meeting.speakerMappings
        ? JSON.parse(share.meeting.speakerMappings)
        : null,
    };
  }

  /**
   * Gets the user who shared a meeting (for attribution)
   */
  static async getSharedBy(token: string): Promise<{ name: string; email: string } | null> {
    const share = await prisma.sharedMeeting.findUnique({
      where: { shareToken: token },
      include: {
        meeting: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return share?.meeting.user || null;
  }

  /**
   * Lists all share links for a meeting
   */
  static async getShareLinks(meetingId: string, userId: string): Promise<ShareLinkInfo[]> {
    // Verify ownership
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId,
      },
    });

    if (!meeting) {
      throw new Error('Meeting not found or access denied');
    }

    const shares = await prisma.sharedMeeting.findMany({
      where: { meetingId },
      orderBy: { createdAt: 'desc' },
    });

    return shares.map(s => this.toShareLinkInfo(s));
  }

  /**
   * Revokes a share link
   */
  static async revokeShareLink(shareId: string, userId: string): Promise<void> {
    // Verify ownership through meeting
    const share = await prisma.sharedMeeting.findUnique({
      where: { id: shareId },
      include: { meeting: true },
    });

    if (!share || share.meeting.userId !== userId) {
      throw new Error('Share link not found or access denied');
    }

    await prisma.sharedMeeting.delete({
      where: { id: shareId },
    });
  }

  /**
   * Converts SharedMeeting to ShareLinkInfo
   */
  private static toShareLinkInfo(share: SharedMeeting): ShareLinkInfo {
    const isExpired = share.expiresAt ? share.expiresAt < new Date() : false;

    return {
      id: share.id,
      shareToken: share.shareToken,
      createdAt: share.createdAt,
      expiresAt: share.expiresAt,
      isExpired,
    };
  }

  /**
   * Validates a share token
   */
  static async validateToken(token: string): Promise<boolean> {
    const share = await prisma.sharedMeeting.findUnique({
      where: { shareToken: token },
    });

    if (!share) {
      return false;
    }

    // Check expiration
    if (share.expiresAt && share.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Deletes all expired share links (cleanup task)
   */
  static async deleteExpiredShares(): Promise<number> {
    const result = await prisma.sharedMeeting.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}
