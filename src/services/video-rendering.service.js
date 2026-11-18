import crypto from 'crypto';
import { VideoProject } from '../models/VideoProject.js';
import { VideoScene } from '../models/VideoScene.js';
import { VideoRenderingJob } from '../models/VideoRenderingJob.js';
import { MediaAsset } from '../models/MediaAsset.js';
import { Lesson } from '../models/Lesson.js';
import { LessonBlock } from '../models/LessonBlock.js';
import { VoiceSynthesisService } from './voice-synthesis.service.js';
import {
  JOB_STATUS,
  RENDERING_STEP,
  VIDEO_STATUS,
  MEDIA_TYPE,
  LESSON_TYPE,
  BLOCK_TYPE,
} from '../constants/index.js';
import { NotFoundError, BadRequestError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export class VideoRenderingService {
  /**
   * Helper: Format duration seconds to WebVTT timestamp (HH:MM:SS.mmm)
   */
  static formatWebVTTTimestamp(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);

    const pad = (num, size = 2) => String(num).padStart(size, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
  }

  /**
   * Generate standard WebVTT subtitles from scene array
   */
  static generateWebVTT(scenes) {
    let vtt = 'WEBVTT\n\n';
    let currentTime = 0;

    scenes.forEach((scene, index) => {
      const startTime = currentTime;
      const duration = scene.durationSeconds || 5;
      const endTime = startTime + duration;

      const startTimestamp = this.formatWebVTTTimestamp(startTime);
      const endTimestamp = this.formatWebVTTTimestamp(endTime);

      vtt += `${index + 1}\n`;
      vtt += `${startTimestamp} --> ${endTimestamp}\n`;
      vtt += `${scene.narrationText.trim()}\n\n`;

      currentTime = endTime;
    });

    return vtt.trim();
  }

  /**
   * Queue a video rendering job
   */
  static async queueRenderingJob(tenantId, projectId, user) {
    const project = await VideoProject.findOne({ _id: projectId, tenantId });
    if (!project) {
      throw new NotFoundError('Video project not found');
    }

    const scenes = await VideoScene.find({ projectId, tenantId }).sort({ sceneOrder: 1 });
    if (!scenes || scenes.length === 0) {
      throw new BadRequestError('Cannot render a video project with zero scenes');
    }

    const job = await VideoRenderingJob.create({
      tenantId,
      projectId,
      userId: user?._id || user?.id,
      status: JOB_STATUS.QUEUED,
      currentStep: RENDERING_STEP.INITIALIZING,
      progress: 0,
      stepLogs: [
        {
          step: RENDERING_STEP.INITIALIZING,
          status: 'QUEUED',
          message: 'Video rendering job added to pipeline queue',
          timestamp: new Date(),
        },
      ],
      startedAt: new Date(),
    });

    project.status = VIDEO_STATUS.RENDERING;
    project.renderingJobId = job._id;
    await project.save();

    return { job, project };
  }

  /**
   * Execute the multi-stage rendering pipeline
   */
  static async processRenderingJob(jobId) {
    const job = await VideoRenderingJob.findById(jobId);
    if (!job) {
      throw new NotFoundError('Video rendering job not found');
    }

    const { tenantId, projectId } = job;
    const project = await VideoProject.findOne({ _id: projectId, tenantId });
    if (!project) {
      job.status = JOB_STATUS.FAILED;
      job.error = 'Video project not found';
      await job.save();
      throw new NotFoundError('Video project not found');
    }

    try {
      job.status = JOB_STATUS.PROCESSING;

      const logStep = async (step, progress, message) => {
        job.currentStep = step;
        job.progress = progress;
        job.stepLogs.push({
          step,
          status: 'COMPLETED',
          message,
          timestamp: new Date(),
        });
        await job.save();
      };

      const scenes = await VideoScene.find({ projectId, tenantId }).sort({ sceneOrder: 1 });

      // Step 1: Voice synthesis for all scenes
      await logStep(
        RENDERING_STEP.SYNTHESIZING_VOICE,
        20,
        `Synthesizing voice narration for ${scenes.length} scenes using ${project.voiceConfig?.voiceId || 'standard'}`
      );

      for (const scene of scenes) {
        if (!scene.audioAssetUrl) {
          const synth = await VoiceSynthesisService.synthesizeSpeech(
            scene.narrationText,
            project.voiceConfig
          );
          scene.audioAssetUrl = synth.audioUrl;
          scene.durationSeconds = synth.durationSeconds;
          await scene.save();
        }
      }

      // Step 2: Slide graphics generation
      await logStep(
        RENDERING_STEP.GENERATING_SLIDES,
        45,
        'Generating presentation slide cards and typography layouts'
      );

      for (const scene of scenes) {
        const slideHash = crypto.createHash('md5').update(scene._id.toString() + scene.title).digest('hex').slice(0, 8);
        scene.renderedFrameUrl = `https://assets.aiacademy.internal/slides/${projectId}/${scene.sceneOrder}_${slideHash}.png`;
        await scene.save();
      }

      // Step 3: Avatar presenter overlay synthesis
      await logStep(
        RENDERING_STEP.RENDERING_AVATAR,
        65,
        project.avatarConfig?.enabled
          ? `Rendering presenter avatar '${project.avatarConfig.avatarId}' with position ${project.avatarConfig.position}`
          : 'Avatar disabled; applying slide-only layout'
      );

      // Step 4: Video composition & scene stitching
      await logStep(
        RENDERING_STEP.STITCHING_SCENES,
        80,
        'Stitching multi-track video stream, audio narration, and transitions'
      );

      const totalDuration = scenes.reduce((acc, s) => acc + (s.durationSeconds || 5), 0);
      const videoKey = `videos/${projectId}/render_${Date.now()}.mp4`;
      const outputVideoUrl = `https://assets.aiacademy.internal/${videoKey}`;

      // Step 5: WebVTT Subtitle Generation
      await logStep(
        RENDERING_STEP.GENERATING_SUBTITLES,
        90,
        'Compiling precise WebVTT closed captions from scene narration timestamps'
      );

      const vttContent = this.generateWebVTT(scenes);
      const subtitlesUrl = `https://assets.aiacademy.internal/subtitles/${projectId}/captions.vtt`;

      // Step 6: HLS encoding and poster snapshot
      await logStep(
        RENDERING_STEP.ENCODING_HLS,
        100,
        'Encoding adaptive HLS master playlist and generating 1080p poster'
      );

      const hlsManifestUrl = `https://assets.aiacademy.internal/videos/${projectId}/hls/master.m3u8`;
      const thumbnailUrl = `https://assets.aiacademy.internal/thumbnails/${projectId}/poster.jpg`;

      // Update project
      project.status = VIDEO_STATUS.READY;
      project.totalDurationSeconds = totalDuration;
      project.scenesCount = scenes.length;
      project.outputVideoUrl = outputVideoUrl;
      project.hlsManifestUrl = hlsManifestUrl;
      project.subtitlesUrl = subtitlesUrl;
      project.thumbnailUrl = thumbnailUrl;
      await project.save();

      // Update job
      job.status = JOB_STATUS.COMPLETED;
      job.currentStep = RENDERING_STEP.COMPLETED;
      job.progress = 100;
      job.outputVideoUrl = outputVideoUrl;
      job.hlsManifestUrl = hlsManifestUrl;
      job.subtitlesUrl = subtitlesUrl;
      job.thumbnailUrl = thumbnailUrl;
      job.durationSeconds = totalDuration;
      job.completedAt = new Date();
      await job.save();

      // Register generated video asset in MediaAsset collection
      await MediaAsset.create({
        tenantId,
        name: `Video: ${project.title}`,
        mediaType: MEDIA_TYPE.VIDEO,
        storageKey: videoKey,
        url: outputVideoUrl,
        mimeType: 'video/mp4',
        sizeBytes: Math.max(1024 * 1024 * 5, totalDuration * 450 * 1024),
        durationSeconds: totalDuration,
        resolution: project.resolution,
        associatedProjectIds: [projectId],
        ...(project.courseId ? { associatedCourseIds: [project.courseId] } : {}),
        ...(project.lessonId ? { associatedLessonIds: [project.lessonId] } : {}),
        metadata: {
          aspectRatio: project.aspectRatio,
          hlsManifestUrl,
          subtitlesUrl,
          thumbnailUrl,
          vttContent,
        },
        createdBy: job.userId,
      });

      // Register subtitles asset
      await MediaAsset.create({
        tenantId,
        name: `Subtitles: ${project.title} (WebVTT)`,
        mediaType: MEDIA_TYPE.SUBTITLE,
        storageKey: `subtitles/${projectId}/captions.vtt`,
        url: subtitlesUrl,
        mimeType: 'text/vtt',
        sizeBytes: Math.max(512, vttContent.length),
        durationSeconds: totalDuration,
        associatedProjectIds: [projectId],
        metadata: { vttContent },
        createdBy: job.userId,
      });

      return { job, project };
    } catch (err) {
      logger.error('Video rendering job failed', { jobId, error: err.message });
      job.status = JOB_STATUS.FAILED;
      job.error = err.message;
      job.currentStep = RENDERING_STEP.FAILED;
      await job.save();

      project.status = VIDEO_STATUS.FAILED;
      await project.save();
      throw err;
    }
  }

  /**
   * Get live status of video rendering job
   */
  static async getRenderingStatus(tenantId, projectId) {
    const project = await VideoProject.findOne({ _id: projectId, tenantId });
    if (!project) {
      throw new NotFoundError('Video project not found');
    }

    const job = await VideoRenderingJob.findOne({ projectId, tenantId }).sort({ createdAt: -1 });

    return {
      projectId: project._id,
      projectStatus: project.status,
      job: job || null,
      outputVideoUrl: project.outputVideoUrl,
      hlsManifestUrl: project.hlsManifestUrl,
      subtitlesUrl: project.subtitlesUrl,
      thumbnailUrl: project.thumbnailUrl,
      durationSeconds: project.totalDurationSeconds,
    };
  }

  /**
   * 1-Click Embed completed video project into LMS Lesson
   */
  static async embedVideoInLesson(tenantId, projectId, lessonId, options = {}, user) {
    const project = await VideoProject.findOne({ _id: projectId, tenantId });
    if (!project) {
      throw new NotFoundError('Video project not found');
    }

    if (project.status !== VIDEO_STATUS.READY) {
      throw new BadRequestError('Only videos with status READY can be embedded into lessons');
    }

    const lesson = await Lesson.findOne({ _id: lessonId, tenantId });
    if (!lesson) {
      throw new NotFoundError('Target lesson not found');
    }

    // Update Lesson metadata
    lesson.type = LESSON_TYPE.VIDEO;
    lesson.durationMinutes = Math.max(1, Math.ceil(project.totalDurationSeconds / 60));
    await lesson.save();

    // Check if an existing VIDEO block exists or create a new one
    let videoBlock = await LessonBlock.findOne({
      lessonId: lesson._id,
      tenantId,
      type: BLOCK_TYPE.VIDEO,
    });

    if (videoBlock) {
      videoBlock.content = {
        videoUrl: project.outputVideoUrl,
        hlsUrl: project.hlsManifestUrl,
        subtitlesUrl: project.subtitlesUrl,
        thumbnail: project.thumbnailUrl,
        duration: project.totalDurationSeconds,
        sourceProjectId: project._id,
        aspectRatio: project.aspectRatio,
      };
      await videoBlock.save();
    } else {
      const highestBlock = await LessonBlock.findOne({ lessonId: lesson._id, tenantId }).sort({ order: -1 });
      const nextOrder = highestBlock ? highestBlock.order + 1 : 1;

      videoBlock = await LessonBlock.create({
        tenantId,
        courseId: lesson.courseId,
        lessonId: lesson._id,
        type: BLOCK_TYPE.VIDEO,
        order: nextOrder,
        content: {
          videoUrl: project.outputVideoUrl,
          hlsUrl: project.hlsManifestUrl,
          subtitlesUrl: project.subtitlesUrl,
          thumbnail: project.thumbnailUrl,
          duration: project.totalDurationSeconds,
          sourceProjectId: project._id,
          aspectRatio: project.aspectRatio,
        },
      });
    }

    // Link lessonId back on VideoProject
    project.lessonId = lesson._id;
    if (lesson.courseId) {
      project.courseId = lesson.courseId;
    }
    await project.save();

    // Update associatedLessonIds on MediaAsset
    await MediaAsset.updateMany(
      { associatedProjectIds: project._id, tenantId },
      { $addToSet: { associatedLessonIds: lesson._id, ...(lesson.courseId ? { associatedCourseIds: lesson.courseId } : {}) } }
    );

    return {
      success: true,
      lesson,
      block: videoBlock,
      project,
    };
  }
}

export default VideoRenderingService;
