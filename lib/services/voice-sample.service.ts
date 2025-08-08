import type { VoiceSample, VoiceSampleMetadata, DiarizationProfile, VoiceSampleRecordingConfig } from '@/lib/types/voice-sample.types';

export class VoiceSampleService {
  private static readonly STORAGE_KEY = 'knest_voice_samples';
  private static readonly PROFILES_KEY = 'knest_diarization_profiles';
  
  private static readonly DEFAULT_CONFIG: VoiceSampleRecordingConfig = {
    maxDuration: 30, // 30 seconds max
    minDuration: 3,  // 3 seconds min
    sampleRate: 44100,
    channels: 1, // mono
    bitRate: 128
  };

  private static readonly SAMPLE_TEXTS = [
    "Hello, my name is {name} and I'm participating in this meeting today. I'm excited to contribute to our discussion.",
    "Good morning everyone. This is {name} speaking. I'd like to share some thoughts on today's agenda items.",
    "Hi, this is {name}. I'm looking forward to our productive discussion and collaboration on these important topics.",
    "Greetings team. {name} here. I'm ready to engage in today's meeting and provide my input on the matters at hand.",
    "Hello everyone, {name} speaking. I appreciate the opportunity to be part of this conversation and share my perspective."
  ];

  static getRandomSampleText(name: string): string {
    const randomIndex = Math.floor(Math.random() * this.SAMPLE_TEXTS.length);
    return this.SAMPLE_TEXTS[randomIndex].replace('{name}', name);
  }

  static async saveVoiceSample(sample: Omit<VoiceSample, 'id' | 'createdAt' | 'updatedAt' | 'audioUrl'>): Promise<VoiceSample> {
    const id = this.generateId();
    const now = new Date();
    
    const voiceSample: VoiceSample = {
      ...sample,
      id,
      createdAt: now,
      updatedAt: now
    };

    // Store audio blob in IndexedDB for persistence
    await this.storeAudioBlob(id, sample.audioBlob);
    
    // Store metadata in localStorage
    const samples = this.getAllVoiceSamples();
    samples.push({
      id: voiceSample.id,
      name: voiceSample.name,
      sampleText: voiceSample.sampleText,
      quality: voiceSample.quality,
      duration: voiceSample.duration,
      fileSize: voiceSample.fileSize,
      createdAt: voiceSample.createdAt,
      updatedAt: voiceSample.updatedAt
    });
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(samples));
    
    return voiceSample;
  }

  static getAllVoiceSamples(): VoiceSampleMetadata[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    
    try {
      const samples = JSON.parse(stored);
      return samples.map((sample: any) => ({
        ...sample,
        createdAt: new Date(sample.createdAt),
        updatedAt: new Date(sample.updatedAt)
      }));
    } catch {
      return [];
    }
  }

  static async getVoiceSample(id: string): Promise<VoiceSample | null> {
    const metadata = this.getAllVoiceSamples().find(s => s.id === id);
    if (!metadata) return null;

    const audioBlob = await this.getAudioBlob(id);
    if (!audioBlob) return null;

    return {
      ...metadata,
      audioBlob,
      audioUrl: URL.createObjectURL(audioBlob)
    };
  }

  static async deleteVoiceSample(id: string): Promise<void> {
    // Remove from localStorage
    const samples = this.getAllVoiceSamples().filter(s => s.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(samples));
    
    // Remove from IndexedDB
    await this.deleteAudioBlob(id);
    
    // Update profiles that reference this sample
    this.removeFromProfiles(id);
  }

  static getAllProfiles(): DiarizationProfile[] {
    const stored = localStorage.getItem(this.PROFILES_KEY);
    if (!stored) return [];
    
    try {
      const profiles = JSON.parse(stored);
      return profiles.map((profile: any) => ({
        ...profile,
        lastUsed: profile.lastUsed ? new Date(profile.lastUsed) : undefined,
        voiceSamples: profile.voiceSamples.map((sample: any) => ({
          ...sample,
          createdAt: new Date(sample.createdAt),
          updatedAt: new Date(sample.updatedAt)
        }))
      }));
    } catch {
      return [];
    }
  }

  static saveProfile(profile: DiarizationProfile): void {
    const profiles = this.getAllProfiles().filter(p => p.id !== profile.id);
    profiles.push(profile);
    localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profiles));
  }

  static deleteProfile(id: string): void {
    const profiles = this.getAllProfiles().filter(p => p.id !== id);
    localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profiles));
  }

  static createProfile(name: string, voiceSampleIds: string[]): DiarizationProfile {
    const allSamples = this.getAllVoiceSamples();
    const voiceSamples = allSamples.filter(s => voiceSampleIds.includes(s.id));
    
    const confidence = this.calculateProfileConfidence(voiceSamples);
    
    const profile: DiarizationProfile = {
      id: this.generateId(),
      name,
      voiceSamples,
      isActive: true,
      confidence
    };
    
    this.saveProfile(profile);
    return profile;
  }

  static getActiveProfiles(): DiarizationProfile[] {
    return this.getAllProfiles().filter(p => p.isActive);
  }

  static updateProfileLastUsed(profileId: string): void {
    const profiles = this.getAllProfiles();
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      profile.lastUsed = new Date();
      this.saveProfile(profile);
    }
  }

  private static calculateProfileConfidence(samples: VoiceSampleMetadata[]): number {
    if (samples.length === 0) return 0;
    
    // Base confidence on number of samples and their quality
    let qualityScore = 0;
    samples.forEach(sample => {
      switch (sample.quality) {
        case 'excellent': qualityScore += 1.0; break;
        case 'good': qualityScore += 0.8; break;
        case 'fair': qualityScore += 0.6; break;
        case 'poor': qualityScore += 0.3; break;
      }
    });
    
    const avgQuality = qualityScore / samples.length;
    const sampleCountFactor = Math.min(samples.length / 5, 1); // Optimal around 5 samples
    
    return Math.min(avgQuality * sampleCountFactor, 1);
  }

  private static removeFromProfiles(sampleId: string): void {
    const profiles = this.getAllProfiles();
    profiles.forEach(profile => {
      profile.voiceSamples = profile.voiceSamples.filter(s => s.id !== sampleId);
      profile.confidence = this.calculateProfileConfidence(profile.voiceSamples);
      this.saveProfile(profile);
    });
  }

  private static generateId(): string {
    return `vs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // IndexedDB operations for storing audio blobs
  private static async storeAudioBlob(id: string, blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('KnestVoiceSamples', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('samples')) {
          db.createObjectStore('samples');
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['samples'], 'readwrite');
        const store = transaction.objectStore('samples');
        
        const putRequest = store.put(blob, id);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
    });
  }

  private static async getAudioBlob(id: string): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('KnestVoiceSamples', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['samples'], 'readonly');
        const store = transaction.objectStore('samples');
        
        const getRequest = store.get(id);
        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  }

  private static async deleteAudioBlob(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('KnestVoiceSamples', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['samples'], 'readwrite');
        const store = transaction.objectStore('samples');
        
        const deleteRequest = store.delete(id);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
    });
  }
}