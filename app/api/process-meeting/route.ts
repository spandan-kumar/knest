import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 900;

export async function POST(req: NextRequest) {
  console.log('🚀 API endpoint called - Starting meeting processing');
  
  try {
    console.log('🔑 Checking API key...');
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('❌ API key not found');
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please set GEMINI_API_KEY environment variable.' },
        { status: 500 }
      );
    }
    console.log('✅ API key found');

    console.log('📁 Parsing form data...');
    // Parse the multipart form data
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.error('❌ No audio file found in form data');
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }
    console.log('✅ Audio file found:', audioFile.name, 'Size:', audioFile.size, 'Type:', audioFile.type);

    // Validate file size - use larger limit to maximize context window usage
    const maxSize = 200 * 1024 * 1024; // 200MB to fully utilize context window
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds 200MB limit. Current file: ${Math.round(audioFile.size / (1024 * 1024))}MB` },
        { status: 400 }
      );
    }

    // Validate file type - Gemini 2.5 Flash supported audio formats
    const validMimeTypes = [
      'audio/x-aac',
      'audio/flac',
      'audio/mp3',
      'audio/m4a',
      'audio/mpeg',
      'audio/mpga',
      'audio/mp4',
      'audio/opus',
      'audio/pcm',
      'audio/wav',
      'audio/webm',
      // Also support video formats that contain audio
      'video/mp4',
      'video/webm',
      'video/ogg'
    ];
    if (!validMimeTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: `Unsupported audio format: ${audioFile.type}. Supported formats: AAC, FLAC, MP3, M4A, MPEG, MPGA, MP4, OPUS, PCM, WAV, WebM` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(bytes);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use the latest Gemini 2.5 Flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Convert audio buffer to base64
    const audioBase64 = audioBuffer.toString('base64');

    // Create comprehensive prompt to maximize context window utilization
    const prompt = `You are an expert meeting assistant with advanced audio analysis capabilities. Analyze the provided audio recording comprehensively and extract maximum value from the content:

## COMPREHENSIVE ANALYSIS TASKS:

### 1. DETAILED TRANSCRIPT
- Generate a complete, word-for-word transcript
- Accurately identify and label each unique speaker (Speaker 1, Speaker 2, etc.)
- Include timestamps for major topic changes
- Preserve emotional context and emphasis where evident
- Note any background sounds, interruptions, or audio quality issues

### 2. EXECUTIVE SUMMARY
- Provide a comprehensive summary of all key points discussed
- Identify the meeting's primary objectives and outcomes
- Highlight critical decisions made and their rationale
- Note any unresolved issues or topics requiring follow-up

### 3. ACTION ITEMS & TASK EXTRACTION
- Extract ALL action items, commitments, and deliverables mentioned
- Identify specific assignees for each task based on conversation context
- Include deadlines or timeframes mentioned
- Categorize tasks by priority (high/medium/low) based on discussion emphasis

### 4. PARTICIPANT ANALYSIS
- Identify speaking patterns and participation levels
- Note expertise areas demonstrated by each speaker
- Highlight key contributions from each participant

### 5. TOPIC ANALYSIS
- Break down discussion into main topics and subtopics
- Identify time spent on each major topic
- Note any recurring themes or concerns

### 6. SENTIMENT & TONE ANALYSIS
- Assess overall meeting tone (collaborative, contentious, productive, etc.)
- Identify areas of agreement and disagreement
- Note any concerns or enthusiastic responses

Return the analysis as a comprehensive JSON object with this structure:
{
  "summary": "Detailed executive summary with key outcomes and decisions",
  "tasks": [
    { 
      "action": "Specific action item description", 
      "assigned_to": "Speaker identifier",
      "deadline": "Mentioned timeframe or null",
      "priority": "high|medium|low",
      "context": "Brief context of why this task was assigned"
    }
  ],
  "transcript": "Complete word-for-word transcript with speaker labels and timestamps",
  "participants": [
    {
      "speaker_id": "Speaker 1",
      "participation_level": "high|medium|low",
      "key_contributions": ["List of main points contributed"],
      "expertise_areas": ["Identified areas of expertise"]
    }
  ],
  "topics": [
    {
      "topic": "Main topic discussed",
      "duration_emphasis": "high|medium|low",
      "key_points": ["List of key points discussed"],
      "decisions_made": ["Any decisions related to this topic"],
      "open_questions": ["Any unresolved questions"]
    }
  ],
  "meeting_metadata": {
    "overall_tone": "Description of meeting atmosphere",
    "productivity_level": "high|medium|low",
    "total_speakers": "Number of unique speakers identified",
    "main_outcomes": ["List of primary meeting outcomes"],
    "follow_up_required": ["Areas requiring additional discussion"]
  }
}

IMPORTANT: Utilize the full context window to provide the most comprehensive analysis possible. Do not truncate or summarize unless necessary. Include ALL relevant details from the audio.`;

    console.log('🤖 Making Gemini API call...');
    console.log('📊 Audio file details:', {
      type: audioFile.type,
      size: `${Math.round(audioFile.size / (1024 * 1024))}MB`,
      name: audioFile.name
    });

    // Add extended timeout for comprehensive analysis
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out after 12 minutes')), 720000)
    );

    console.log('⏱️ Starting Gemini API call with 12-minute timeout...');
    
    // Make the request to Gemini with extended timeout for full context utilization
    const result = await Promise.race([
      model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: audioFile.type,
            data: audioBase64,
          },
        },
      ]),
      timeoutPromise
    ]);

    console.log('✅ Gemini API call completed successfully');

    console.log('📄 Getting response text...');
    const response = await result.response;
    const text = response.text();

    console.log('📝 Raw response received - Length:', text.length);
    console.log('🔍 Response preview:', text.substring(0, 500) + '...');
    console.log('🔚 Response ending:', '...' + text.substring(text.length - 200));

    console.log('🔧 Starting JSON parsing...');
    // Parse the JSON response
    let parsedResult;
    try {
      console.log('🔍 Looking for JSON in response...');
      // Clean the response text to extract just the JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ No JSON found in response');
        console.error('📄 Full response text:', text);
        throw new Error('No JSON found in response');
      }
      console.log('✅ JSON pattern found - Length:', jsonMatch[0].length);
      console.log('🔍 JSON preview:', jsonMatch[0].substring(0, 300) + '...');
      
      console.log('⚙️ Attempting to parse JSON...');
      parsedResult = JSON.parse(jsonMatch[0]);
      console.log('✅ JSON parsed successfully');
      console.log('📊 Parsed object keys:', Object.keys(parsedResult));
      
    } catch (parseError) {
      console.error('❌ JSON parsing failed');
      console.error('🔥 Parse error:', parseError);
      console.error('📄 Raw text that failed to parse:', text.substring(0, 1000));
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: parseError instanceof Error ? parseError.message : 'Unknown parse error' },
        { status: 500 }
      );
    }

    console.log('🔍 Validating response structure...');
    // Validate the essential response structure (participants, topics, meeting_metadata are optional)
    const requiredFields = ['summary', 'tasks', 'transcript'];
    const missingFields = requiredFields.filter(field => !parsedResult[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Response validation failed');
      console.error('🚫 Missing required fields:', missingFields);
      console.error('📊 Available fields:', Object.keys(parsedResult));
      console.error('🔍 Field details:', requiredFields.map(field => ({
        field,
        exists: !!parsedResult[field],
        type: typeof parsedResult[field],
        value: parsedResult[field] ? 'present' : 'missing'
      })));
      return NextResponse.json(
        { error: `Invalid response structure from AI. Missing required fields: ${missingFields.join(', ')}` },
        { status: 500 }
      );
    }

    console.log('✅ Response validation passed');
    console.log('📊 Available fields:', Object.keys(parsedResult));
    console.log('🎯 Optional fields present:', {
      participants: !!parsedResult.participants,
      topics: !!parsedResult.topics,
      meeting_metadata: !!parsedResult.meeting_metadata
    });

    console.log('🎉 Successfully processed meeting analysis - returning response');
    
    try {
      const response = NextResponse.json(parsedResult);
      console.log('✅ NextResponse.json created successfully');
      return response;
    } catch (responseError) {
      console.error('❌ Failed to create NextResponse');
      console.error('🔥 Response error:', responseError);
      throw responseError;
    }
  } catch (error) {
    console.error('💥 CRITICAL ERROR in meeting processing');
    console.error('🔥 Error type:', error?.constructor?.name);
    console.error('📄 Error message:', error instanceof Error ? error.message : String(error));
    console.error('📚 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return more specific error messages
    if (error instanceof Error) {
      console.log('🔍 Checking error type for specific handling...');
      
      if (error.message.includes('File size exceeds')) {
        console.log('📏 File size error detected');
        return NextResponse.json(
          { error: 'File size exceeds 200MB limit' },
          { status: 400 }
        );
      }
      if (error.message.includes('timed out')) {
        console.log('⏰ Timeout error detected');
        return NextResponse.json(
          { error: 'Processing timed out after 12 minutes. The audio file may be too complex for comprehensive analysis.' },
          { status: 408 }
        );
      }
      if (error.message.includes('Unsupported audio format')) {
        console.log('🎵 Audio format error detected');
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes('No audio file provided')) {
        console.log('📁 Missing file error detected');
        return NextResponse.json(
          { error: 'No audio file provided' },
          { status: 400 }
        );
      }
      if (error.message.includes('API key not configured')) {
        console.log('🔑 API key error detected');
        return NextResponse.json(
          { error: 'Gemini API key not configured' },
          { status: 500 }
        );
      }
      
      console.log('🚨 Unknown error type - returning generic error response');
      // Return the actual error message for debugging
      return NextResponse.json(
        { 
          error: `API Error: ${error.message}`,
          errorType: error.constructor.name,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
    
    console.log('🚨 Non-Error type exception - returning fallback error');
    return NextResponse.json(
      { 
        error: 'Failed to process meeting audio',
        errorType: 'Unknown',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}