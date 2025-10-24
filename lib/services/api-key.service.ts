import { prisma } from '@/lib/db/prisma';
import { encrypt, decrypt, maskApiKey } from '@/lib/crypto';
import { geminiApiKeySchema } from '@/lib/validations/schemas';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class ApiKeyService {
  /**
   * Validates a Gemini API key by attempting to initialize the client
   */
  static async validateGeminiApiKey(apiKey: string): Promise<boolean> {
    try {
      // First check the format
      geminiApiKeySchema.parse(apiKey);

      // Try to initialize the client and make a test call
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

      // Make a minimal test request
      await model.generateContent('test');

      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  /**
   * Saves an encrypted API key for a user
   */
  static async saveApiKey(userId: string, apiKey: string): Promise<void> {
    // Validate the API key first
    const isValid = await this.validateGeminiApiKey(apiKey);
    if (!isValid) {
      throw new Error('Invalid Gemini API key');
    }

    // Encrypt and save
    const encryptedKey = encrypt(apiKey);

    await prisma.user.update({
      where: { id: userId },
      data: { geminiApiKey: encryptedKey },
    });
  }

  /**
   * Gets the decrypted API key for a user
   */
  static async getApiKey(userId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { geminiApiKey: true },
    });

    if (!user?.geminiApiKey) {
      return null;
    }

    try {
      return decrypt(user.geminiApiKey);
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      return null;
    }
  }

  /**
   * Gets a masked version of the API key for display
   */
  static async getMaskedApiKey(userId: string): Promise<string | null> {
    const apiKey = await this.getApiKey(userId);
    if (!apiKey) {
      return null;
    }

    return maskApiKey(apiKey);
  }

  /**
   * Removes the API key for a user
   */
  static async removeApiKey(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { geminiApiKey: null },
    });
  }

  /**
   * Checks if a user has a valid API key configured
   */
  static async hasApiKey(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { geminiApiKey: true },
    });

    return !!user?.geminiApiKey;
  }
}
