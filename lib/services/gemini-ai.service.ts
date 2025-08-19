import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { loggers, log } from '@/lib/logger';

export interface AIAnalysisConfig {
  model: string;
  timeoutMs: number;
  maxRetries: number;
}

export interface AIAnalysisRequest {
  audioFile: File;
  audioBuffer: Buffer;
  prompt: string;
}

import type { AnalysisResult } from '../types/meeting.types';

export type AIAnalysisResult = AnalysisResult;

export class GeminiAIService {
  private static readonly DEFAULT_CONFIG: AIAnalysisConfig = {
    model: 'gemini-2.5-pro',
    timeoutMs: 720000, // 12 minutes
    maxRetries: 2
  };

  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: AIAnalysisConfig;

  constructor(apiKey: string, config?: Partial<AIAnalysisConfig>) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.config = { ...GeminiAIService.DEFAULT_CONFIG, ...config };
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: this.config.model });
  }

  async analyzeAudio(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const { audioFile, audioBuffer, prompt } = request;
    
    // Validate inputs
    if (!audioFile || !audioBuffer || !prompt) {
      throw new Error('Invalid analysis request: missing required parameters');
    }
    
    if (audioBuffer.length === 0) {
      throw new Error('Invalid audio file: buffer is empty');
    }
    
    loggers.ai.request(this.config.model, audioFile.size);

    // Convert audio buffer to base64
    const audioBase64 = audioBuffer.toString('base64');

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini API call timed out after ${this.config.timeoutMs / 1000} seconds`)), this.config.timeoutMs)
    );

    log.info({ timeout: this.config.timeoutMs }, `⏱️ Starting Gemini API call with ${this.config.timeoutMs / 1000}-second timeout...`);

    try {
      // Make the request to Gemini with timeout
      const result = await Promise.race([
        this.model.generateContent([
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

      loggers.ai.response(this.config.model);

      const response = result.response;
      const text = response.text();

      log.info({ length: text.length }, '📝 Raw response received');
      log.debug({ preview: text.substring(0, 500) }, '🔍 Response preview');
      log.debug({ ending: text.substring(text.length - 200) }, '🔚 Response ending');
      
      // Debug: Log the full response for troubleshooting
      console.log('🤖 FULL AI RESPONSE:');
      console.log(text);
      console.log('🤖 END OF RESPONSE');

      const parsedResult = this.parseAIResponse(text);
      
      // Debug speaker identification specifically
      console.log('🎯 SPEAKER IDENTIFICATION DEBUG:');
      console.log('Has speaker_identification:', !!parsedResult.speaker_identification);
      if (parsedResult.speaker_identification) {
        console.log('Total speakers:', parsedResult.speaker_identification.total_speakers);
        console.log('Speaker hints:', parsedResult.speaker_identification.speaker_hints);
        console.log('Speaker hints count:', parsedResult.speaker_identification.speaker_hints?.length);
      }
      
      return parsedResult;

    } catch (error) {
      if (error instanceof Error && error.message.includes('timed out')) {
        loggers.ai.timeout(this.config.model, this.config.timeoutMs);
      } else {
        loggers.ai.error(this.config.model, error);
      }
      throw error;
    }
  }

  private parseAIResponse(text: string): AIAnalysisResult {
    log.debug({}, '🔧 Starting JSON parsing...');

    try {
      log.debug({}, '🔍 Looking for JSON in response...');
      
      // Clean the response text to extract just the JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        log.error({ responseText: text }, '❌ No JSON found in response');
        throw new Error('No JSON found in response');
      }

      log.debug({ length: jsonMatch[0].length }, '✅ JSON pattern found');
      log.debug({ preview: jsonMatch[0].substring(0, 300) }, '🔍 JSON preview');

      log.debug({}, '⚙️ Attempting to parse JSON...');
      const parsedResult = JSON.parse(jsonMatch[0]);
      
      log.debug({ keys: Object.keys(parsedResult) }, '✅ JSON parsed successfully');

      this.validateAIResponse(parsedResult);

      return parsedResult as AIAnalysisResult;

    } catch (parseError) {
      log.error({ parseError, rawText: text.substring(0, 1000) }, '❌ JSON parsing failed');
      throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
    }
  }

  private validateAIResponse(parsedResult: any): void {
    log.debug({}, '🔍 Validating response structure...');

    // Validate the essential response structure (mom is optional, but speaker_identification is required)
    const requiredFields = ['summary', 'tasks', 'transcript', 'speaker_identification'];
    const missingFields = requiredFields.filter(field => !parsedResult[field]);

    if (missingFields.length > 0) {
      log.error({
        missingFields,
        availableFields: Object.keys(parsedResult),
        fieldDetails: requiredFields.map(field => ({
          field,
          exists: !!parsedResult[field],
          type: typeof parsedResult[field],
          value: parsedResult[field] ? 'present' : 'missing'
        }))
      }, '❌ Response validation failed');

      throw new Error(`Invalid response structure from AI. Missing required fields: ${missingFields.join(', ')}`);
    }

    // Additional validation for speaker_identification structure
    if (parsedResult.speaker_identification) {
      if (!parsedResult.speaker_identification.total_speakers || !parsedResult.speaker_identification.speaker_hints) {
        log.error({
          speaker_identification: parsedResult.speaker_identification
        }, '❌ Invalid speaker_identification structure');
        
        throw new Error('Invalid speaker_identification structure from AI. Missing total_speakers or speaker_hints.');
      }
      
      // Ensure speaker_hints is an array
      if (!Array.isArray(parsedResult.speaker_identification.speaker_hints)) {
        log.error({
          speaker_hints_type: typeof parsedResult.speaker_identification.speaker_hints
        }, '❌ speaker_hints is not an array');
        
        throw new Error('Invalid speaker_identification structure: speaker_hints must be an array.');
      }
    }

    log.info({
      availableFields: Object.keys(parsedResult),
      speakerCount: parsedResult.speaker_identification?.total_speakers,
      speakerHintsCount: parsedResult.speaker_identification?.speaker_hints?.length,
      optionalFields: {
        mom: !!parsedResult.mom,
        participants: !!parsedResult.participants,
        topics: !!parsedResult.topics,
        meeting_metadata: !!parsedResult.meeting_metadata
      }
    }, '✅ Response validation passed');
  }

  static createPrompt(): string {
    return `You are an expert meeting assistant with advanced audio analysis capabilities. Analyze the provided audio recording comprehensively and extract maximum value from the content.
## CRITICAL ANALYSIS REQUIREMENTS:

### 1. DETAILED TRANSCRIPT WITH SPEAKER DIARIZATION (MANDATORY)
- Generate a complete, word-for-word transcript
- **MANDATORY**: Accurately identify and label each unique speaker (Speaker 1, Speaker 2, etc.)
- **MANDATORY**: Distinguish between different voices even if only subtle differences exist
- If only one speaker is detected, still label as "Speaker 1"
- Include timestamps for major topic changes
- Preserve emotional context and emphasis where evident
- Note any background sounds, interruptions, or audio quality issues

### 2. EXECUTIVE SUMMARY
- Provide a comprehensive summary of all key points discussed
- Identify the meeting's primary objectives and outcomes
- Highlight critical decisions made and their rationale
- Note any unresolved issues or topics requiring follow-up

### 3. MINUTES OF MEETING (MOM)
- Create a formal, structured summary of the meeting
- Include meeting purpose, key decisions, and outcomes
- List attendees and their roles
- Document important discussions and resolutions
- Note any voting results or consensus reached

### 4. ACTION ITEMS EXTRACTION (CRITICAL - BE PRECISE)
**ONLY include items that are:**
- Explicit commitments made by participants
- Specific tasks assigned with clear deliverables
- Follow-up actions with defined outcomes
- Concrete next steps that require execution


### 5. SPEAKER IDENTIFICATION & PARTICIPANT ANALYSIS (MANDATORY)
- **MANDATORY**: Analyze conversation context for speaker identification clues
- **MANDATORY**: Extract names mentioned in conversation (introductions, name mentions, role references)
- **MANDATORY**: Identify job titles, departments, or roles mentioned
- **MANDATORY**: Note speaking patterns and participation levels
- **MANDATORY**: Note expertise areas demonstrated by each speaker
- **MANDATORY**: Highlight key contributions from each participant
- **MANDATORY**: Provide concise hints for speaker identification based on conversation context
- **MANDATORY**: Even if no clear speaker identification clues exist, provide basic speaker analysis

### 6. TOPIC ANALYSIS
- Break down discussion into main topics and subtopics
- Identify time spent on each major topic
- Note any recurring themes or concerns
- Separate decisions from open questions

### 7. SENTIMENT & TONE ANALYSIS
- Assess overall meeting tone (collaborative, contentious, productive, etc.)
- Identify areas of agreement and disagreement
- Note any concerns or enthusiastic responses

**MANDATORY**: Return the analysis as a comprehensive JSON object with this EXACT structure. ALL fields are required:
{
  "summary": "Detailed executive summary with key outcomes and decisions",
  "mom": {
    "meeting_purpose": "Primary purpose of the meeting",
    "attendees": ["List of participants and their roles"],
    "key_decisions": ["Major decisions made during the meeting"],
    "resolutions": ["Issues resolved or consensus reached"],
    "next_meeting": "Date/time of next meeting if mentioned, or null"
  },
  "tasks": [
    { 
      "action": "Specific, actionable task description", 
      "assigned_to": "Person responsible for the task",
      "deadline": "Mentioned timeframe or null",
      "priority": "high|medium|low",
      "context": "Brief context of why this task was assigned",
      "deliverable": "Expected outcome or deliverable"
    }
  ],
  "transcript": "Complete word-for-word transcript with speaker labels and timestamps",
  "speaker_identification": {
    "total_speakers": "Number of unique speakers identified",
    "speaker_hints": [
      {
        "speaker_id": "Speaker 1",
        "suggested_name": "Name mentioned in conversation or null",
        "role_hints": ["Job title, department, or role clues"],
        "context_clues": ["Brief contextual hints for identification"],
        "confidence": "high|medium|low"
      }
    ]
  },
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
      "open_questions": ["Any unresolved questions that need follow-up"]
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

IMPORTANT: 
1. Be extremely selective with action items - only include genuine commitments and assigned tasks
2. Distinguish clearly between questions asked and actions to be taken
3. **CRITICAL**: Pay special attention to speaker identification - listen for names, introductions, role mentions
4. **CRITICAL**: Provide helpful context clues for speaker identification even if names aren't explicitly mentioned
5. **CRITICAL**: Always include speaker_identification field even if only one speaker is detected
6. **CRITICAL**: If you cannot distinguish speakers, still provide Speaker 1 with confidence "low" and context clues like "single speaker detected" or "unable to distinguish multiple speakers"
7. Utilize the full context window to provide comprehensive analysis
8. Include ALL relevant details from the audio while maintaining structure

**FALLBACK RULE**: If speaker identification is difficult, provide minimal speaker_identification structure:
{
  "total_speakers": "1",
  "speaker_hints": [
    {
      "speaker_id": "Speaker 1",
      "suggested_name": null,
      "role_hints": ["primary speaker"],
      "context_clues": ["single speaker detected or unable to distinguish multiple speakers"],
      "confidence": "low"
    }
  ]
}`;
  }
}