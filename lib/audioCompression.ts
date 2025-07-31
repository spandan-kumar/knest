import lamejs from 'lamejs';

export interface CompressionOptions {
  bitRate?: number; // kbps (default: 128)
  sampleRate?: number; // Hz (default: 44100) 
  channels?: number; // 1 for mono, 2 for stereo (default: 1 for smaller files)
  quality?: number; // 0-9, lower is better quality (default: 3)
}

export interface CompressionResult {
  compressedBlob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

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

  try {
    // Convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    // Create audio context for processing
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Resample to target sample rate if needed
    const targetSampleRate = Math.min(sampleRate, audioBuffer.sampleRate);
    
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
    if (targetSampleRate !== audioBuffer.sampleRate) {
      audioData = resampleAudio(audioData, audioBuffer.sampleRate, targetSampleRate);
    }
    
    // Convert float samples to 16-bit PCM
    const samples = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      samples[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    
    // Initialize MP3 encoder
    const mp3encoder = new lamejs.Mp3Encoder(channels, targetSampleRate, bitRate);
    const mp3Data: Int8Array[] = [];
    
    // Encode in chunks
    const chunkSize = 1152; // Standard MP3 frame size
    for (let i = 0; i < samples.length; i += chunkSize) {
      const chunk = samples.subarray(i, i + chunkSize);
      const mp3buf = mp3encoder.encodeBuffer(chunk);
      if (mp3buf.length > 0) {
        mp3Data.push(new Int8Array(mp3buf));
      }
    }
    
    // Finalize encoding
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(new Int8Array(mp3buf));
    }
    
    // Create blob from MP3 data
    const compressedBlob = new Blob(mp3Data, { type: 'audio/mp3' });
    
    const originalSize = audioBlob.size;
    const compressedSize = compressedBlob.size;
    const compressionRatio = originalSize / compressedSize;
    
    return {
      compressedBlob,
      originalSize,
      compressedSize,
      compressionRatio
    };
    
  } catch (error) {
    console.error('Audio compression failed:', error);
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