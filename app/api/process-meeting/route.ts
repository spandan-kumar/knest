import { NextRequest, NextResponse } from 'next/server';
import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import formidable, { IncomingForm } from 'formidable';
import { Readable } from 'stream';
import fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

async function parseFormData(req: NextRequest): Promise<{ audioBuffer: Buffer }> {
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
    form.parse(readable as any, async (err, _fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
      if (!audioFile) {
        reject(new Error('No audio file provided'));
        return;
      }

      try {
        const audioBuffer = await readFile(audioFile.filepath);
        await unlink(audioFile.filepath); // Clean up temp file
        resolve({ audioBuffer });
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
    const { audioBuffer } = await parseFormData(req);

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
              mimeType: 'audio/wav',
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
    return NextResponse.json(
      { error: 'Failed to process meeting audio' },
      { status: 500 }
    );
  }
}