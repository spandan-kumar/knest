# KNest

AI-powered meeting assistant with audio recording and analysis using Google's Gemini 2.0 Flash model.

## Features

- 🎙️ **Audio Recording**: Record meetings directly in the browser
- 📁 **File Upload**: Upload existing meeting recordings
- 🤖 **AI Analysis**: Powered by Google's Gemini 2.0 Flash model
- 📝 **Meeting Summaries**: Get concise summaries of key decisions and discussion points
- ✅ **Action Items**: Automatically extract tasks with assigned speakers
- 📋 **Full Transcripts**: Speaker-labeled transcriptions
- 📱 **PWA Support**: Installable on desktop and mobile devices
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS

## Setup

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/spandan-kumar/knest.git
   cd knest
   bun install
   ```

2. **Configure Gemini API:**
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a `.env.local` file in the root directory
   - Add your Gemini API key:
     ```
     GEMINI_API_KEY=your-api-key-here
     ```

3. **Run the development server:**
   ```bash
   bun run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

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
- **Styling**: Tailwind CSS 3.4
- **AI**: Google Gemini 2.5 Flash (via Gemini API)
- **PWA**: next-pwa for service worker generation
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
- **Action Items**: Tasks with assigned speakers
- **Full Transcript**: Complete speaker-labeled transcription

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

3. **Set Environment Variables:**
   ```
   GEMINI_API_KEY=your-api-key-here
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   ```

4. **Deploy:**
   - Click "Deploy" to start the build process
   - Monitor logs for any issues

### Other Platforms

This app can be deployed to any platform that supports Docker:

- **Vercel**: Zero-config deployment
- **Railway**: Easy deployment with environment variable support
- **DigitalOcean App Platform**: Docker container support
- **AWS ECS**: Container orchestration
- **Google Cloud Run**: Serverless containers

### Environment Variables

Make sure to set the following environment variable in your deployment platform:

```
GEMINI_API_KEY=your-api-key-here
```

## API Key Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add it to your `.env.local` file or deployment environment variables

## Troubleshooting

### Common Issues

**"Gemini API key not configured"**
- Ensure you've set the `GEMINI_API_KEY` environment variable
- Check that the API key is valid and has proper permissions

**"File size exceeds 50MB limit"**
- Compress your audio file or use a shorter recording
- Consider using a lower quality audio format

**"Unsupported audio format"**
- Convert your audio file to one of the supported formats
- Use online converters if needed

**"Failed to access microphone"**
- Check browser permissions for microphone access
- Ensure you're using HTTPS in production (required for microphone access)