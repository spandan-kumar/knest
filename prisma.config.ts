import { defineConfig, env } from "prisma/config";

// Load environment variables
const DATABASE_URL = process.env.DATABASE_URL || "file:./prisma/knest.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: DATABASE_URL,
  },
});
