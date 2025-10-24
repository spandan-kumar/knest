import { prisma } from '@/lib/db/prisma';
import type { MeetingParticipant, User } from '@prisma/client';

export interface ParticipantWithUser extends MeetingParticipant {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AddParticipantRequest {
  meetingId: string;
  userEmail: string;
  requestingUserId: string; // User making the request (must be owner)
}

export interface RemoveParticipantRequest {
  meetingId: string;
  participantUserId: string;
  requestingUserId: string; // User making the request (must be owner)
}

export class MeetingParticipantService {
  /**
   * Adds a participant to a meeting
   */
  static async addParticipant(request: AddParticipantRequest): Promise<ParticipantWithUser> {
    const { meetingId, userEmail, requestingUserId } = request;

    // Verify the requesting user owns the meeting
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId: requestingUserId,
      },
    });

    if (!meeting) {
      throw new Error('Meeting not found or access denied');
    }

    // Find the user to add by email
    const userToAdd = await prisma.user.findUnique({
      where: { email: userEmail.toLowerCase() },
      select: { id: true, name: true, email: true },
    });

    if (!userToAdd) {
      throw new Error('User not found');
    }

    // Check if user is already the owner
    if (userToAdd.id === meeting.userId) {
      throw new Error('User is already the owner of this meeting');
    }

    // Check if already a participant
    const existingParticipant = await prisma.meetingParticipant.findUnique({
      where: {
        meetingId_userId: {
          meetingId,
          userId: userToAdd.id,
        },
      },
    });

    if (existingParticipant) {
      throw new Error('User is already a participant');
    }

    // Add participant
    const participant = await prisma.meetingParticipant.create({
      data: {
        meetingId,
        userId: userToAdd.id,
        role: 'participant',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return participant;
  }

  /**
   * Removes a participant from a meeting
   */
  static async removeParticipant(request: RemoveParticipantRequest): Promise<void> {
    const { meetingId, participantUserId, requestingUserId } = request;

    // Verify the requesting user owns the meeting
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId: requestingUserId,
      },
    });

    if (!meeting) {
      throw new Error('Meeting not found or access denied');
    }

    // Remove participant
    await prisma.meetingParticipant.delete({
      where: {
        meetingId_userId: {
          meetingId,
          userId: participantUserId,
        },
      },
    });
  }

  /**
   * Gets all participants for a meeting
   */
  static async getParticipants(
    meetingId: string,
    userId: string
  ): Promise<ParticipantWithUser[]> {
    // Verify user has access to the meeting (owner or participant)
    const hasAccess = await this.userHasAccess(meetingId, userId);

    if (!hasAccess) {
      throw new Error('Access denied');
    }

    const participants = await prisma.meetingParticipant.findMany({
      where: { meetingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return participants;
  }

  /**
   * Checks if a user has access to a meeting (as owner or participant)
   */
  static async userHasAccess(meetingId: string, userId: string): Promise<boolean> {
    // Check if user is the owner
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId,
      },
    });

    if (meeting) {
      return true;
    }

    // Check if user is a participant
    const participant = await prisma.meetingParticipant.findUnique({
      where: {
        meetingId_userId: {
          meetingId,
          userId,
        },
      },
    });

    return !!participant;
  }

  /**
   * Checks if a user is the owner of a meeting
   */
  static async isOwner(meetingId: string, userId: string): Promise<boolean> {
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId,
      },
    });

    return !!meeting;
  }
}
