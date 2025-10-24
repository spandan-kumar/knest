/**
 * Migration script to move users from JSON file to SQLite database
 * Run with: bun run scripts/migrate-users.ts
 */

import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '../lib/db/prisma';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

interface OldUser {
  id: string;
  email: string;
  name: string;
  hashedPassword: string;
  createdAt: string;
  lastLogin?: string;
}

async function migrateUsers() {
  console.log('🔄 Starting user migration from JSON to SQLite...\n');

  try {
    // Check if file exists
    try {
      await fs.access(USERS_FILE);
    } catch {
      console.log('✅ No users.json file found - nothing to migrate');
      return;
    }

    // Read existing users
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    const oldUsers: OldUser[] = JSON.parse(data);

    if (oldUsers.length === 0) {
      console.log('✅ No users found in JSON file - nothing to migrate');
      return;
    }

    console.log(`📊 Found ${oldUsers.length} users to migrate\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const oldUser of oldUsers) {
      try {
        // Check if user already exists in database
        const existingUser = await prisma.user.findUnique({
          where: { email: oldUser.email },
        });

        if (existingUser) {
          console.log(`⏭️  Skipping ${oldUser.email} - already exists in database`);
          skippedCount++;
          continue;
        }

        // Create user in database
        await prisma.user.create({
          data: {
            id: oldUser.id,
            email: oldUser.email,
            name: oldUser.name,
            hashedPassword: oldUser.hashedPassword,
            createdAt: new Date(oldUser.createdAt),
            lastLogin: oldUser.lastLogin ? new Date(oldUser.lastLogin) : null,
          },
        });

        console.log(`✅ Migrated ${oldUser.email}`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Failed to migrate ${oldUser.email}:`, error);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   - Successfully migrated: ${migratedCount}`);
    console.log(`   - Skipped (already exists): ${skippedCount}`);
    console.log(`   - Total: ${oldUsers.length}`);

    if (migratedCount > 0) {
      // Rename the old file as backup
      const backupFile = USERS_FILE + '.backup';
      await fs.rename(USERS_FILE, backupFile);
      console.log(`\n💾 Backup created: ${backupFile}`);
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateUsers();
