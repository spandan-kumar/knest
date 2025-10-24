# KNest

AI-powered meeting assistant with audio recording and analysis using Google's Gemini 2.5 Pro model.

## Features

- 🎙️ **Audio Recording**: Record meetings directly in the browser
- 📁 **File Upload**: Upload existing meeting recordings (up to 50MB)
- 🤖 **AI Analysis**: Powered by Google's Gemini 2.5 Pro model
- 📝 **Meeting Summaries**: Get concise summaries of key decisions and discussion points
- ✅ **Action Items**: Automatically extract tasks with assigned speakers
- 📋 **Full Transcripts**: Speaker-labeled transcriptions with speaker mapping
- 🔐 **BYOK (Bring Your Own Key)**: Use your own Gemini API key with encrypted storage
- 💾 **Persistent Storage**: SQLite database for meeting history
- 🔗 **Meeting Sharing**: Generate shareable links with optional expiration
- 👥 **User Management**: Secure authentication with NextAuth v5
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS

## Setup

### Prerequisites

- [Bun](https://bun.sh) runtime installed
- Node.js 18+ (for compatibility)
- SQLite (included with most systems)

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/spandan-kumar/knest.git
   cd knest
   bun install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set the required values:
   ```bash
   # NextAuth Configuration
   AUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32
   NEXTAUTH_URL=http://localhost:3000

   # Database
   DATABASE_URL="file:./prisma/knest.db"

   # Encryption Secret (for API key storage)
   ENCRYPTION_SECRET=your-encryption-secret  # Generate with: openssl rand -hex 32
   ```

3. **Initialize the database:**
   ```bash
   bun x prisma generate
   bun x prisma migrate dev --name init
   ```

4. **Run the development server:**
   ```bash
   bun run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

6. **Configure your Gemini API key:**
   - Sign up at [http://localhost:3000/signup](http://localhost:3000/signup)
   - Navigate to Settings after logging in
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Add it in the Settings page (it will be encrypted and stored securely)

### Docker Development

```bash
# Build and run with Docker Compose
bun run docker:compose

# Or build and run manually
bun run docker:build
bun run docker:run
```

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Runtime**: Bun (fast JavaScript runtime)
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth v5 (Auth.js)
- **Styling**: Tailwind CSS 3.4
- **AI**: Google Gemini 2.5 Pro (via Gemini API)
- **Validation**: Zod schema validation
- **Security**: AES-256-GCM encryption for API keys
- **File Handling**: Native FormData API
- **Containerization**: Docker with multi-stage builds

## Usage

### Recording a Meeting
1. Click the "Record Meeting" tab
2. Click "Start Recording" to begin audio capture
3. Click "Stop Recording" when finished
4. Click "Analyze Meeting" to process with AI

### Uploading Existing Recordings
1. Click the "Upload Recording" tab
2. Choose an audio file (WAV, MP3, M4A, WebM, OGG)
3. Click "Analyze Meeting" to process with AI

### Review Results
- **Meeting Summary**: Concise overview of key decisions
- **Action Items**: Tasks with assigned speakers and due dates
- **Full Transcript**: Complete speaker-labeled transcription
- **Speaker Mapping**: Rename speakers from "Speaker 1" to actual names

### Managing Meetings
- View all your meetings in the **Meetings** page
- Search meetings by title or filename
- Click on any meeting to view details
- Edit meeting titles
- Delete meetings you no longer need

### Sharing Meetings
1. Open a meeting detail page
2. Click "Create Share Link"
3. Set optional expiration (7, 30, or 90 days)
4. Copy the generated link
5. Share with anyone (no login required)
6. Revoke access anytime from the meeting detail page

## Supported Audio Formats

- **WAV** - Waveform Audio File Format
- **MP3** - MPEG Audio Layer III
- **M4A** - MPEG-4 Audio
- **WebM** - Web Media
- **OGG** - Ogg Vorbis

**Maximum file size**: 50MB

## Deployment

### Coolify (Self-Hosted)

1. **In Coolify Dashboard:**
   - Click "New Resource" → "Application"
   - Select "GitHub" as source
   - Choose your `knest` repository
   - Set branch to `main`

2. **Configure Build Settings:**
   - Build Pack: `Dockerfile`
   - Dockerfile Path: `./Dockerfile`
   - Port: `3000`
   - Health Check Path: `/api/health`

3. **Configure Persistent Storage:**
   - Add a volume mount for the SQLite database:
     - Source: `/app/prisma` (or any host path)
     - Destination: `/app/prisma`
   - This ensures your database persists across deployments

4. **Set Environment Variables:**
   ```bash
   # Required
   AUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32
   NEXTAUTH_URL=https://your-domain.com  # Or http://your-ip:port
   DATABASE_URL=file:./prisma/knest.db
   ENCRYPTION_SECRET=your-encryption-secret  # Generate with: openssl rand -hex 32

   # Optional
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   ```

5. **Deploy:**
   - Click "Deploy" to start the build process
   - The Dockerfile will automatically run database migrations on startup
   - Monitor logs for any issues

### Migrating from JSON to Database

If you have an existing deployment with JSON-based user storage:

1. **Backup your data:**
   ```bash
   cp data/users.json data/users.json.backup
   ```

2. **Run the migration script:**
   ```bash
   bun run scripts/migrate-users.ts
   ```

3. **Verify migration:**
   - Check the database: `bun x prisma studio`
   - Ensure all users were migrated successfully

### Other Platforms

This app can be deployed to any platform that supports Docker:

- **Railway**: Easy deployment with persistent volumes
- **DigitalOcean App Platform**: Docker container support
- **AWS ECS/Fargate**: Container orchestration
- **Google Cloud Run**: Serverless containers (note: use Cloud SQL for production)
- **Fly.io**: Docker deployment with persistent volumes

**Note**: For Vercel deployment, you'll need to use a different database (PostgreSQL/MySQL) as Vercel's serverless environment doesn't support persistent SQLite files.

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes | Secret for NextAuth session encryption |
| `NEXTAUTH_URL` | Yes | Your application URL (with protocol) |
| `DATABASE_URL` | Yes | SQLite connection string |
| `ENCRYPTION_SECRET` | Yes | 32-byte hex string for encrypting API keys |
| `NODE_ENV` | No | Set to `production` in production |
| `NEXT_TELEMETRY_DISABLED` | No | Disable Next.js telemetry |

## Security

### API Key Storage
- User API keys are encrypted using AES-256-GCM before storage
- Encryption key must be 32 bytes (64 hex characters)
- Never commit `ENCRYPTION_SECRET` to version control

### Database Security
- SQLite database is file-based and stored in `/app/prisma/knest.db`
- Ensure proper file permissions in production
- Use volume mounts to persist data across container restarts
- Regular backups recommended

### Authentication
- NextAuth v5 with JWT strategy
- Passwords hashed with bcrypt (12 rounds)
- Session tokens expire after inactivity

## Database Management

### Prisma Studio (GUI)
```bash
bun x prisma studio
```
Opens a web interface at `http://localhost:5555` to view and edit data.

### Creating Migrations
```bash
bun x prisma migrate dev --name migration_name
```

### Applying Migrations in Production
```bash
bun x prisma migrate deploy
```
This runs automatically in the Docker container on startup.

### Resetting Database (Development Only)
```bash
bun x prisma migrate reset
```
**Warning**: This deletes all data!

## Troubleshooting

### Common Issues

**"Gemini API key not configured"**
- Ensure you've added your API key in Settings page after logging in
- The key must be valid and have proper permissions from Google AI Studio

**"Invalid Gemini API key"**
- Verify the key at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Ensure the key has access to Gemini 2.5 Pro model

**"File size exceeds 50MB limit"**
- Compress your audio file or use a shorter recording
- Consider using a lower quality audio format

**"Unsupported audio format"**
- Convert your audio file to one of the supported formats (WAV, MP3, M4A, WebM, OGG)
- Use online converters if needed

**"Failed to access microphone"**
- Check browser permissions for microphone access
- Ensure you're using HTTPS in production (required for microphone access)

**"Database locked" error**
- SQLite doesn't handle high concurrency well
- For high-traffic deployments, consider migrating to PostgreSQL or MySQL
- Check that the database file isn't being accessed by multiple processes

**"Prisma Client not generated"**
- Run `bun x prisma generate` to generate the Prisma Client
- In Docker, this happens automatically during build

## Architecture

### Project Structure
```
knest/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── meetings/         # Meeting CRUD
│   │   ├── shared/           # Public shared meetings
│   │   └── user/             # User settings
│   ├── components/           # React components
│   │   ├── meeting/          # Meeting analyzer components
│   │   └── results/          # Results display components
│   ├── hooks/                # Custom React hooks (business logic)
│   └── [pages]/              # Page components
├── lib/                      # Shared utilities
│   ├── db/                   # Database client
│   ├── services/             # Business logic services
│   ├── validations/          # Zod schemas
│   └── crypto.ts             # Encryption utilities
├── prisma/                   # Database schema and migrations
└── scripts/                  # Utility scripts
```

### Design Patterns
- **Service Layer**: Business logic separated into service classes
- **Custom Hooks**: React state management and side effects
- **Presentational Components**: UI components receive data via props
- **API Route Handlers**: RESTful API endpoints with Zod validation
- **Repository Pattern**: Database access through Prisma ORM

## Future Roadmap

See [FUTURE_ROADMAP.md](./FUTURE_ROADMAP.md) for planned features and enhancements.