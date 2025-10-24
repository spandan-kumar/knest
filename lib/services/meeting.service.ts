import { prisma } from '@/lib/db/prisma';
import type { Meeting, Prisma } from '@prisma/client';
import type { AnalysisResult } from '@/lib/types/meeting.types';

export interface CreateMeetingRequest {
  userId: string;
  title: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  analysisResult: AnalysisResult;
  speakerMappings?: Record<string, string>;
}

export interface UpdateMeetingRequest {
  title?: string;
  speakerMappings?: Record<string, string>;
}

export interface MeetingWithAnalysis extends Omit<Meeting, 'analysisResult' | 'speakerMappings'> {
  analysisResult: AnalysisResult;
  speakerMappings: Record<string, string> | null;
}

export interface MeetingListOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'title' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface MeetingListResult {
  meetings: MeetingWithAnalysis[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class MeetingService {
  /**
   * Creates a new meeting
   */
  static async createMeeting(request: CreateMeetingRequest): Promise<MeetingWithAnalysis> {
    const meeting = await prisma.meeting.create({
      data: {
        userId: request.userId,
        title: request.title,
        fileName: request.fileName,
        fileSize: request.fileSize,
        duration: request.duration,
        analysisResult: JSON.stringify(request.analysisResult),
        speakerMappings: request.speakerMappings ? JSON.stringify(request.speakerMappings) : null,
      },
    });

    return this.parseMeeting(meeting);
  }

  /**
   * Gets a meeting by ID
   * User must be owner or participant
   */
  static async getMeetingById(id: string, userId: string): Promise<MeetingWithAnalysis | null> {
    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        OR: [
          { userId }, // User is owner
          {
            participants: {
              some: {
                userId, // User is participant
              },
            },
          },
        ],
      },
    });

    if (!meeting) {
      return null;
    }

    return this.parseMeeting(meeting);
  }

  /**
   * Gets meetings for a user with pagination and filters
   * Includes meetings where user is owner OR participant
   */
  static async getMeetingsByUserId(
    userId: string,
    options: MeetingListOptions = {}
  ): Promise<MeetingListResult> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const search = options.search || undefined;
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause - include meetings where user is owner OR participant
    const where: Prisma.MeetingWhereInput = search
      ? {
          AND: [
            {
              OR: [
                { userId }, // User is the owner
                {
                  participants: {
                    some: {
                      userId, // User is a participant
                    },
                  },
                },
              ],
            },
            {
              OR: [
                { title: { contains: search } },
                { fileName: { contains: search } },
              ],
            },
          ],
        }
      : {
          OR: [
            { userId }, // User is the owner
            {
              participants: {
                some: {
                  userId, // User is a participant
                },
              },
            },
          ],
        };

    // Get total count
    const total = await prisma.meeting.count({ where });

    // Get meetings
    const meetings = await prisma.meeting.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      meetings: meetings.map(m => this.parseMeeting(m)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Updates a meeting
   */
  static async updateMeeting(
    id: string,
    userId: string,
    updates: UpdateMeetingRequest
  ): Promise<MeetingWithAnalysis> {
    const meeting = await prisma.meeting.update({
      where: {
        id,
        userId,
      },
      data: {
        ...(updates.title && { title: updates.title }),
        ...(updates.speakerMappings && {
          speakerMappings: JSON.stringify(updates.speakerMappings),
        }),
      },
    });

    return this.parseMeeting(meeting);
  }

  /**
   * Deletes a meeting
   */
  static async deleteMeeting(id: string, userId: string): Promise<void> {
    await prisma.meeting.delete({
      where: {
        id,
        userId,
      },
    });
  }

  /**
   * Gets meeting count for a user
   */
  static async getMeetingCount(userId: string): Promise<number> {
    return prisma.meeting.count({
      where: { userId },
    });
  }

  /**
   * Parses a meeting from the database (deserializes JSON fields)
   */
  private static parseMeeting(meeting: Meeting): MeetingWithAnalysis {
    return {
      ...meeting,
      analysisResult: JSON.parse(meeting.analysisResult) as AnalysisResult,
      speakerMappings: meeting.speakerMappings
        ? JSON.parse(meeting.speakerMappings)
        : null,
    };
  }
}
