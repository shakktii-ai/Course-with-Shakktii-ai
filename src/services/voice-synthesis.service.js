import crypto from 'crypto';
import { VoiceProfile } from '../models/VoiceProfile.js';
import { VideoScene } from '../models/VideoScene.js';
import { MediaAsset } from '../models/MediaAsset.js';
import { VOICE_PROVIDER, VOICE_GENDER, MEDIA_TYPE } from '../constants/index.js';
import { NotFoundError } from '../lib/errors.js';

export const SYSTEM_VOICE_PRESETS = [
  // English
  {
    name: 'Jenny (Natural English)',
    voiceId: 'en-US-JennyNeural',
    provider: VOICE_PROVIDER.MOCK,
    language: 'en',
    languageName: 'English (US)',
    gender: VOICE_GENDER.FEMALE,
    sampleAudioUrl: '/audio/samples/en-jenny.mp3',
    isSystemDefault: true,
    settings: { speedRate: 1.0, pitch: 1.0, stability: 0.8 },
  },
  {
    name: 'Guy (Professional Male)',
    voiceId: 'en-US-GuyNeural',
    provider: VOICE_PROVIDER.MOCK,
    language: 'en',
    languageName: 'English (US)',
    gender: VOICE_GENDER.MALE,
    sampleAudioUrl: '/audio/samples/en-guy.mp3',
    isSystemDefault: true,
    settings: { speedRate: 1.0, pitch: 1.0, stability: 0.8 },
  },
  {
    name: 'Aria (Expressive)',
    voiceId: 'en-US-AriaNeural',
    provider: VOICE_PROVIDER.MOCK,
    language: 'en',
    languageName: 'English (US)',
    gender: VOICE_GENDER.FEMALE,
    sampleAudioUrl: '/audio/samples/en-aria.mp3',
    isSystemDefault: true,
    settings: { speedRate: 1.05, pitch: 1.0, stability: 0.75 },
  },
  // Hindi
  {
    name: 'Swara (Hindi Studio)',
    voiceId: 'hi-IN-SwaraNeural',
    provider: VOICE_PROVIDER.MOCK,
    language: 'hi',
    languageName: 'Hindi (हिन्दी)',
    gender: VOICE_GENDER.FEMALE,
    sampleAudioUrl: '/audio/samples/hi-swara.mp3',
    isSystemDefault: true,
    settings: { speedRate: 1.0, pitch: 1.0, stability: 0.8 },
  },
  {
    name: 'Madhur (Hindi Clear)',
    voiceId: 'hi-IN-MadhurNeural',
    provider: VOICE_PROVIDER.MOCK,
    language: 'hi',
    languageName: 'Hindi (हिन्दी)',
    gender: VOICE_GENDER.MALE,
    sampleAudioUrl: '/audio/samples/hi-madhur.mp3',
    isSystemDefault: true,
    settings: { speedRate: 1.0, pitch: 1.0, stability: 0.8 },
  },
  // Marathi
  {
    name: 'Aarohi (Marathi Authentic)',
    voiceId: 'mr-IN-AarohiNeural',
    provider: VOICE_PROVIDER.MOCK,
    language: 'mr',
    languageName: 'Marathi (मराठी)',
    gender: VOICE_GENDER.FEMALE,
    sampleAudioUrl: '/audio/samples/mr-aarohi.mp3',
    isSystemDefault: true,
    settings: { speedRate: 1.0, pitch: 1.0, stability: 0.8 },
  },
  {
    name: 'Manohar (Marathi Conversational)',
    voiceId: 'mr-IN-ManoharNeural',
    provider: VOICE_PROVIDER.MOCK,
    language: 'mr',
    languageName: 'Marathi (मराठी)',
    gender: VOICE_GENDER.MALE,
    sampleAudioUrl: '/audio/samples/mr-manohar.mp3',
    isSystemDefault: true,
    settings: { speedRate: 1.0, pitch: 1.0, stability: 0.8 },
  },
  // Telugu
  {
    name: 'Shruti (Telugu Fluent)',
    voiceId: 'te-IN-ShrutiNeural',
    provider: VOICE_PROVIDER.MOCK,
    language: 'te',
    languageName: 'Telugu (తెలుగు)',
    gender: VOICE_GENDER.FEMALE,
    sampleAudioUrl: '/audio/samples/te-shruti.mp3',
    isSystemDefault: true,
    settings: { speedRate: 1.0, pitch: 1.0, stability: 0.8 },
  },
  {
    name: 'Mohan (Telugu Academic)',
    voiceId: 'te-IN-MohanNeural',
    provider: VOICE_PROVIDER.MOCK,
    language: 'te',
    languageName: 'Telugu (తెలుగు)',
    gender: VOICE_GENDER.MALE,
    sampleAudioUrl: '/audio/samples/te-mohan.mp3',
    isSystemDefault: true,
    settings: { speedRate: 1.0, pitch: 1.0, stability: 0.8 },
  },
];

export class VoiceSynthesisService {
  /**
   * Seed default system voice presets if they don't already exist
   */
  static async seedSystemVoices() {
    const existing = await VoiceProfile.countDocuments({ isSystemDefault: true });
    if (existing >= SYSTEM_VOICE_PRESETS.length) {
      return;
    }

    for (const preset of SYSTEM_VOICE_PRESETS) {
      await VoiceProfile.findOneAndUpdate(
        { voiceId: preset.voiceId, isSystemDefault: true },
        { $set: preset },
        { upsert: true, new: true }
      );
    }
  }

  /**
   * List voice profiles available to tenant (System default + custom tenant profiles)
   */
  static async listVoiceProfiles(tenantId, filters = {}) {
    await this.seedSystemVoices();

    const query = {
      $or: [
        { isSystemDefault: true },
        ...(tenantId ? [{ tenantId }] : []),
      ],
    };

    if (filters.language) {
      query.language = filters.language;
    }
    if (filters.gender) {
      query.gender = filters.gender;
    }
    if (filters.provider) {
      query.provider = filters.provider;
    }

    return await VoiceProfile.find(query).sort({ language: 1, isSystemDefault: -1, name: 1 });
  }

  /**
   * Create custom voice profile for tenant
   */
  static async createCustomVoiceProfile(tenantId, data) {
    return await VoiceProfile.create({
      tenantId,
      name: data.name,
      voiceId: data.voiceId || `custom-${Date.now()}`,
      provider: data.provider || VOICE_PROVIDER.MOCK,
      language: data.language || 'en',
      languageName: data.languageName || 'English',
      gender: data.gender || VOICE_GENDER.NEUTRAL,
      sampleAudioUrl: data.sampleAudioUrl || '',
      isSystemDefault: false,
      isCustom: true,
      settings: data.settings || { speedRate: 1.0, pitch: 1.0, stability: 0.75 },
    });
  }

  /**
   * Synthesize speech audio from text
   * Returns simulated/synthesized audio asset URL and precise duration
   */
  static async synthesizeSpeech(text, voiceConfig = {}) {
    const cleanText = (text || '').trim();
    const words = cleanText.split(/\s+/).filter(Boolean);
    const speed = voiceConfig.speedRate || 1.0;
    
    // Duration in seconds: ~140 wpm = ~2.3 words/sec adjusted for speed rate
    const rawDuration = Math.round((words.length / 2.3) / speed);
    const durationSeconds = Math.max(3, rawDuration);

    const textHash = crypto.createHash('md5').update(cleanText + (voiceConfig.voiceId || 'default')).digest('hex').slice(0, 12);
    const audioUrl = `https://assets.aiacademy.internal/audio/synth-${textHash}.mp3`;

    return {
      audioUrl,
      durationSeconds,
      format: 'mp3',
      voiceId: voiceConfig.voiceId || 'en-US-JennyNeural',
      provider: voiceConfig.provider || 'MOCK',
    };
  }

  /**
   * Synthesize audio specifically for a VideoScene and store as MediaAsset
   */
  static async synthesizeSceneAudio(tenantId, projectId, sceneId, voiceConfig = {}, user = null) {
    const scene = await VideoScene.findOne({ _id: sceneId, projectId, tenantId });
    if (!scene) {
      throw new NotFoundError('Video scene not found');
    }

    const synthResult = await this.synthesizeSpeech(scene.narrationText, voiceConfig);

    scene.audioAssetUrl = synthResult.audioUrl;
    scene.durationSeconds = synthResult.durationSeconds;
    await scene.save();

    // Register audio in MediaAsset library
    await MediaAsset.create({
      tenantId,
      name: `Audio: Scene ${scene.sceneOrder} - ${scene.title || 'Narration'}`,
      mediaType: MEDIA_TYPE.AUDIO,
      storageKey: `audio/${projectId}/${sceneId}.mp3`,
      url: synthResult.audioUrl,
      mimeType: 'audio/mpeg',
      sizeBytes: Math.max(1024 * 32, synthResult.durationSeconds * 16 * 1024),
      durationSeconds: synthResult.durationSeconds,
      associatedProjectIds: [projectId],
      createdBy: user?._id || user?.id || null,
    });

    return scene;
  }
}

export default VoiceSynthesisService;
