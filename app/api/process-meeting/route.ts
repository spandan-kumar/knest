import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please set GEMINI_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Parse the multipart form data
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (audioFile.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const validMimeTypes = ['audio/wav', 'audio/mp3', 'audio/m4a', 'audio/webm', 'audio/ogg', 'audio/mpeg'];
    if (!validMimeTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: `Unsupported audio format: ${audioFile.type}` },
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

    // Create the prompt
    const prompt = `You are an expert meeting assistant. Analyze the provided audio recording of a meeting and perform the following tasks:

1. Generate a full transcript, accurately labeling each speaker (e.g., "Speaker 1:", "Speaker 2:").
2. Create a concise summary of the key decisions and discussion points.
3. Extract all action items and tasks. For each task, identify who it was assigned to based on the conversation.

Return the entire output as a single, valid JSON object with the following structure:
{
  "summary": "A string containing the meeting summary.",
  "tasks": [
    { "action": "The described task", "assigned_to": "Speaker 1" }
  ],
  "transcript": "The full, speaker-labeled transcript."
}

Do not include any text or formatting outside of this JSON object.`;

    console.log('Making Gemini API call...');
    console.log('Audio file type:', audioFile.type);
    console.log('Audio file size:', audioFile.size);

    // Make the request to Gemini
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: audioFile.type,
          data: audioBase64,
        },
      },
    ]);

    console.log('Gemini API call successful');

    const response = await result.response;
    const text = response.text();

    console.log('Raw Gemini response:', text.substring(0, 200) + '...');

    // Parse the JSON response
    let parsedResult;
    try {
      // Clean the response text to extract just the JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response. Full response:', text);
        throw new Error('No JSON found in response');
      }
      parsedResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', text);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!parsedResult.summary || !parsedResult.tasks || !parsedResult.transcript) {
      console.error('Invalid response structure:', parsedResult);
      return NextResponse.json(
        { error: 'Invalid response structure from AI' },
        { status: 500 }
      );
    }

    console.log('Successfully processed meeting analysis');
    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error('Error processing meeting:', error);
    
    // Return more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('File size exceeds')) {
        return NextResponse.json(
          { error: 'File size exceeds 50MB limit' },
          { status: 400 }
        );
      }
      if (error.message.includes('Unsupported audio format')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes('No audio file provided')) {
        return NextResponse.json(
          { error: 'No audio file provided' },
          { status: 400 }
        );
      }
      if (error.message.includes('API key not configured')) {
        return NextResponse.json(
          { error: 'Gemini API key not configured' },
          { status: 500 }
        );
      }
      
      // Return the actual error message for debugging
      return NextResponse.json(
        { error: `API Error: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process meeting audio' },
      { status: 500 }
    );
  }
}