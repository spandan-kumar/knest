import { NextRequest, NextResponse } from 'next/server';
import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import formidable from 'formidable';
import { Readable } from 'stream';
import fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

async function parseFormData(req: NextRequest): Promise<{ audioBuffer: Buffer; fileName: string; mimeType: string }> {
  const form = formidable({
    maxFileSize: 50 * 1024 * 1024, // 50MB
    keepExtensions: true,
  });

  // Convert ReadableStream to Node.js Readable stream
  const body = await req.arrayBuffer();
  const readable = new Readable();
  readable.push(Buffer.from(body));
  readable.push(null);

  return new Promise((resolve, reject) => {
    // Create a mock request object that formidable expects
    const mockReq = {
      headers: {
        'content-type': req.headers.get('content-type') || 'multipart/form-data',
        'content-length': body.byteLength.toString(),
      },
      pipe: (stream: any) => {
        readable.pipe(stream);
        return stream;
      },
    } as any;

    form.parse(mockReq, async (err, _fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
      if (!audioFile) {
        reject(new Error('No audio file provided'));
        return;
      }

      // Validate file size
      if (audioFile.size && audioFile.size > 50 * 1024 * 1024) {
        reject(new Error('File size exceeds 50MB limit'));
        return;
      }

      // Validate file type
      const validMimeTypes = ['audio/wav', 'audio/mp3', 'audio/m4a', 'audio/webm', 'audio/ogg', 'audio/mpeg'];
      if (audioFile.mimetype && !validMimeTypes.includes(audioFile.mimetype)) {
        reject(new Error(`Unsupported audio format: ${audioFile.mimetype}`));
        return;
      }

      try {
        const audioBuffer = await readFile(audioFile.filepath);
        await unlink(audioFile.filepath); // Clean up temp file
        
        resolve({ 
          audioBuffer,
          fileName: audioFile.originalFilename || 'recording.wav',
          mimeType: audioFile.mimetype || 'audio/wav'
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    if (!projectId) {
      return NextResponse.json(
        { error: 'Google Cloud project ID not configured' },
        { status: 500 }
      );
    }

    // Parse the multipart form data
    const { audioBuffer, fileName, mimeType } = await parseFormData(req);

    // Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: projectId,
      location: location,
    });

    // Get the generative model
    const model: GenerativeModel = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
    });

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

    // Make the request to Gemini
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64,
            },
          },
        ],
      }],
    });

    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse the JSON response
    let parsedResult;
    try {
      // Clean the response text to extract just the JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
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
      return NextResponse.json(
        { error: 'Invalid response structure from AI' },
        { status: 500 }
      );
    }

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
    }
    
    return NextResponse.json(
      { error: 'Failed to process meeting audio' },
      { status: 500 }
    );
  }
}