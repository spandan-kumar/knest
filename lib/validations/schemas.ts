import { z } from 'zod';

// User schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const updateUserSettingsSchema = z.object({
  geminiApiKey: z.string().optional(),
});

// Meeting schemas
export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  duration: z.number().optional(),
  analysisResult: z.any(), // Complex nested object, validated separately
  speakerMappings: z.record(z.string(), z.string()).optional(),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1).optional(),
  speakerMappings: z.record(z.string(), z.string()).optional(),
});

export const meetingListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().nullable().optional().transform(val => val ?? undefined),
  sortBy: z.enum(['createdAt', 'title', 'updatedAt']).nullable().default('createdAt').transform(val => val ?? 'createdAt'),
  sortOrder: z.enum(['asc', 'desc']).nullable().default('desc').transform(val => val ?? 'desc'),
});

// Share schemas
export const createShareSchema = z.object({
  expiresInDays: z.number().min(1).max(365).optional(),
});

export const validateShareTokenSchema = z.object({
  token: z.string().min(1),
});

// API Key validation
export const geminiApiKeySchema = z.string()
  .min(30, 'API key appears to be invalid')
  .startsWith('AIza', 'API key must start with "AIza"');

// Types derived from schemas
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type MeetingListQuery = z.infer<typeof meetingListQuerySchema>;
export type CreateShareInput = z.infer<typeof createShareSchema>;
export type ValidateShareTokenInput = z.infer<typeof validateShareTokenSchema>;
