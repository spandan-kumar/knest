import { log } from './logger';
import type { CompressionResult } from './types/meeting.types';

export interface CompressionOptions {
  bitRate?: number; // kbps (default: 128)
  sampleRate?: number; // Hz (default: 44100) 
  channels?: number; // 1 for mono, 2 for stereo (default: 1 for smaller files)
  quality?: number; // 0-9, lower is better quality (default: 3)
}

export { type CompressionResult };

export async function compressAudio(
  audioBlob: Blob,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    bitRate = 128,
    sampleRate = 44100,
    channels = 1, // Mono for smaller file size
    quality = 3
  } = options;

  console.log('🗜️ COMPRESSION DEBUG START:');
  console.log('Input blob type:', audioBlob.type);
  console.log('Input blob size:', audioBlob.size);
  console.log('Compression options:', { bitRate, sampleRate, channels, quality });

  try {
    // For browser compatibility, we'll use MediaRecorder with different codecs
    // If the original is already compressed (MP3, AAC), return as-is
    if (audioBlob.type === 'audio/mp3' || audioBlob.type === 'audio/aac' || audioBlob.type === 'audio/mpeg') {
      console.log('🗜️ Skipping compression - already compressed format');
      return {
        compressedBlob: audioBlob,
        originalSize: audioBlob.size,
        compressedSize: audioBlob.size,
        compressionRatio: 1
      };
    }

    // Convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    // Create audio context for processing
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Get audio data (convert to mono if specified)
    let audioData: Float32Array;
    if (channels === 1 && audioBuffer.numberOfChannels > 1) {
      // Convert stereo to mono by averaging channels
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : left;
      audioData = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        audioData[i] = (left[i] + right[i]) / 2;
      }
    } else {
      audioData = audioBuffer.getChannelData(0);
    }
    
    // Resample if needed
    if (sampleRate !== audioBuffer.sampleRate) {
      audioData = resampleAudio(audioData, audioBuffer.sampleRate, sampleRate);
    }
    
    // Create a new audio buffer with the processed data
    const processedBuffer = audioContext.createBuffer(channels, audioData.length, sampleRate);
    processedBuffer.copyToChannel(audioData, 0);
    
    // Create a MediaStreamSource from the audio buffer
    const source = audioContext.createBufferSource();
    source.buffer = processedBuffer;
    
    // Create MediaRecorder with appropriate codec
    const stream = audioContext.createMediaStreamDestination();
    source.connect(stream);
    
    // Try different codecs based on browser support
    const codecs = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ];
    
    let mediaRecorder: MediaRecorder | null = null;
    let selectedCodec = '';
    
    for (const codec of codecs) {
      if (MediaRecorder.isTypeSupported(codec)) {
        mediaRecorder = new MediaRecorder(stream.stream, {
          mimeType: codec,
          audioBitsPerSecond: bitRate * 1000
        });
        selectedCodec = codec;
        break;
      }
    }
    
    if (!mediaRecorder) {
      throw new Error('No supported audio codec found');
    }
    
    const chunks: Blob[] = [];
    
    return new Promise((resolve, reject) => {
      mediaRecorder!.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder!.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: selectedCodec });
        const originalSize = audioBlob.size;
        const compressedSize = compressedBlob.size;
        const compressionRatio = originalSize / compressedSize;
        
        console.log('🗜️ COMPRESSION RESULT:');
        console.log('Original size:', originalSize);
        console.log('Compressed size:', compressedSize);
        console.log('Compression ratio:', compressionRatio);
        console.log('Selected codec:', selectedCodec);
        console.log('Chunks received:', chunks.length);
        
        resolve({
          compressedBlob,
          originalSize,
          compressedSize,
          compressionRatio
        });
      };
      
      mediaRecorder!.onerror = (event) => {
        reject(new Error(`MediaRecorder error: ${event}`));
      };
      
      // Start recording
      mediaRecorder!.start();
      source.start();
      
      // Stop when the audio ends
      source.onended = () => {
        mediaRecorder!.stop();
      };
    });
    
  } catch (error) {
    log.error({ error }, 'Audio compression failed');
    throw new Error(`Audio compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Simple resampling function
function resampleAudio(audioData: Float32Array, originalSampleRate: number, targetSampleRate: number): Float32Array {
  if (originalSampleRate === targetSampleRate) {
    return audioData;
  }
  
  const ratio = originalSampleRate / targetSampleRate;
  const newLength = Math.round(audioData.length / ratio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const originalIndex = i * ratio;
    const index = Math.floor(originalIndex);
    const fraction = originalIndex - index;
    
    if (index + 1 < audioData.length) {
      // Linear interpolation
      result[i] = audioData[index] * (1 - fraction) + audioData[index + 1] * fraction;
    } else {
      result[i] = audioData[index];
    }
  }
  
  return result;
}

// Utility function to format file sizes
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check if audio file should be compressed based on size and type
export function shouldCompressAudio(file: File | Blob, maxSize: number = 50 * 1024 * 1024): boolean {
  // Compress if file is larger than maxSize (default 50MB) or if it's in a format that can benefit from compression
  const benefitsFromCompression = file.type.includes('wav') || file.type.includes('flac') || file.type.includes('pcm');
  return file.size > maxSize || benefitsFromCompression;
}