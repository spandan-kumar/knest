# Gemini Meeting Notes

AI-powered meeting assistant with audio recording and analysis using Google's Gemini 2.5 Pro via Vertex AI.

## Features

- 🎙️ **Audio Recording**: Record meetings directly in the browser
- 🤖 **AI Analysis**: Powered by Google's Gemini 2.5 Pro model
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

2. **Configure Google Cloud:**
   - Copy `.env.local.example` to `.env.local`
   - Set your Google Cloud project ID and location:
     ```
     GOOGLE_CLOUD_PROJECT_ID=your-project-id
     GOOGLE_CLOUD_LOCATION=us-central1
     ```
   - Set up authentication (one of):
     - Service account key: `GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json`
     - Use `gcloud auth application-default login`
     - Use workload identity when deploying to Google Cloud

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4.0
- **AI**: Google Cloud Vertex AI (Gemini 2.5 Pro)
- **PWA**: next-pwa for service worker generation
- **File Handling**: formidable for multipart uploads

## Usage

1. Click "Start Recording" to begin audio capture
2. Click "Stop Recording" when finished
3. Click "Analyze Meeting" to process with AI
4. Review the generated summary, action items, and transcript

## Deployment

This app can be deployed to any platform that supports Next.js:

- **Vercel**: Zero-config deployment
- **Google Cloud Run**: Ideal for Vertex AI integration
- **Netlify**: Static hosting with serverless functions

For Google Cloud deployment, ensure proper IAM permissions for Vertex AI access.