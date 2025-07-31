# Gemini Meeting Notes

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

1. **Clone and install dependencies:**
   ```bash
   npm install
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
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4.0
- **AI**: Google Gemini 2.0 Flash (via Gemini API)
- **PWA**: next-pwa for service worker generation
- **File Handling**: formidable for multipart uploads

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

This app can be deployed to any platform that supports Next.js:

- **Vercel**: Zero-config deployment
- **Netlify**: Static hosting with serverless functions
- **Railway**: Easy deployment with environment variable support

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