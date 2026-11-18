/**
 * AI Academy - AI Video Clip & Explanation Analyzer Service
 * Downloads an uploaded video (via Cloudinary lightweight proxy), analyzes it with
 * Gemini Multimodal AI, and produces instant trimmed short clips + detailed explanations.
 */

import { VideoClipBreakdown } from '../models/VideoClipBreakdown.js';
import { CloudinaryService } from './cloudinary.service.js';
import { GeminiAdapter } from './ai-adapters/gemini.adapter.js';
import { logger } from '../lib/logger.js';
import { NotFoundError, BadRequestError } from '../lib/errors.js';

function formatTimestamp(totalSeconds) {
  const sec = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const rem = sec % 60;

  const mm = String(mins).padStart(2, '0');
  const ss = String(rem).padStart(2, '0');
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Parse "MM:SS", "HH:MM:SS", "MM:SS.ms", or numeric seconds into accurate integer seconds.
 */
function parseTimestampToSeconds(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }
  const str = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(str)) {
    return Math.max(0, Math.round(parseFloat(str)));
  }
  const parts = str.split(':').map((p) => parseFloat(p));
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 2) {
    return Math.max(0, Math.round(parts[0] * 60 + parts[1]));
  }
  if (parts.length === 3) {
    return Math.max(0, Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]));
  }
  return null;
}

export class VideoClipAnalyzerService {
  /**
   * Download video bytes for Gemini analysis.
   * For videos <= 28MB, prefer the ORIGINAL uploaded video first so frame timing
   * is 100% identical to the user's video with zero transcoding FPS drift.
   * For larger videos (> 28MB), prefer Cloudinary high-quality proxy first.
   */
  static async fetchVideoBuffer(sourceVideoUrl, cloudinaryPublicId, fileSizeBytes = 0) {
    const urlsToTry = [];
    const preferOriginalFirst = !fileSizeBytes || fileSizeBytes <= 28 * 1024 * 1024;

    const proxy =
      cloudinaryPublicId && CloudinaryService.isConfigured()
        ? CloudinaryService.buildVideoClipUrls(cloudinaryPublicId, 0, 10, {
            sourceVideoUrl,
          }).aiProxyUrl
        : null;

    if (preferOriginalFirst) {
      if (sourceVideoUrl) urlsToTry.push({ label: 'Original Source Video', url: sourceVideoUrl });
      if (proxy) urlsToTry.push({ label: 'Cloudinary AI Proxy', url: proxy });
    } else {
      if (proxy) urlsToTry.push({ label: 'Cloudinary AI Proxy', url: proxy });
      if (sourceVideoUrl) urlsToTry.push({ label: 'Original Source Video', url: sourceVideoUrl });
    }

    let lastErr = null;
    for (const candidate of urlsToTry) {
      try {
        logger.info(`[VideoClipAnalyzer] Fetching video bytes from ${candidate.label}...`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 90000);

        const res = await fetch(candidate.url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} from ${candidate.label}`);
        }

        const contentType = res.headers.get('content-type') || 'video/mp4';
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length > 0) {
          logger.info(
            `[VideoClipAnalyzer] Downloaded ${(buffer.length / (1024 * 1024)).toFixed(2)} MB (${contentType})`
          );
          return {
            buffer,
            mimeType: contentType.startsWith('video/') ? contentType.split(';')[0] : 'video/mp4',
          };
        }
      } catch (err) {
        lastErr = err;
        logger.warn(`[VideoClipAnalyzer] Failed fetching ${candidate.label}: ${err.message}`);
      }
    }

    throw new BadRequestError(
      `Could not retrieve uploaded video for AI analysis: ${lastErr?.message || 'Unknown error'}`
    );
  }

  /**
   * Full pipeline: Download video -> Analyze via Gemini Multimodal -> Build Cloudinary short clips -> Save to MongoDB
   */
  static async analyzeAndCreateClips(tenantId, userId, payload) {
    const {
      title,
      originalFileName = 'video.mp4',
      sourceVideoUrl,
      cloudinaryPublicId = '',
      durationSeconds = 0,
      fileSizeBytes = 0,
      language = 'Marathi-English',
      clipStyle = 'AUTO',
    } = payload;

    if (!sourceVideoUrl) {
      throw new BadRequestError('sourceVideoUrl is required to analyze the video');
    }

    const cleanTitle =
      (title || '').trim() ||
      originalFileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') ||
      'Uploaded Video';

    // 1. Fetch exact video bytes for Gemini File API
    const { buffer, mimeType } = await this.fetchVideoBuffer(
      sourceVideoUrl,
      cloudinaryPublicId,
      Number(fileSizeBytes) || 0
    );

    // 2. Analyze video with Gemini Multimodal AI
    const gemini = new GeminiAdapter();
    const analysis = await gemini.analyzeVideoToClips({
      videoBuffer: buffer,
      mimeType,
      displayName: originalFileName || 'uploaded-video.mp4',
      title: cleanTitle,
      durationSeconds: Number(durationSeconds) || 0,
      language,
      clipStyle,
    });

    const totalDuration = Math.max(
      Number(durationSeconds) || 0,
      Number(analysis.detectedDurationSeconds) || 0,
      10
    );

    // 3. Normalize clips using MM:SS priority parsing & build instant Cloudinary trimmed URLs
    const rawClips = Array.isArray(analysis.clips) ? analysis.clips : [];
    const parsedRaw = rawClips.map((clip) => {
      const parsedStart =
        parseTimestampToSeconds(clip.startTime) ??
        parseTimestampToSeconds(clip.startSeconds) ??
        0;
      const parsedEnd =
        parseTimestampToSeconds(clip.endTime) ??
        parseTimestampToSeconds(clip.endSeconds) ??
        parsedStart + 20;
      return {
        ...clip,
        _resolvedStart: parsedStart,
        _resolvedEnd: parsedEnd,
      };
    });

    const sortedRaw = [...parsedRaw].sort((a, b) => a._resolvedStart - b._resolvedStart);

    const processedClips = sortedRaw.map((clip, idx) => {
      let startSec = Math.max(0, clip._resolvedStart);
      let endSec = clip._resolvedEnd;

      if (durationSeconds > 0) {
        const maxDur = Math.round(durationSeconds);
        startSec = Math.min(startSec, Math.max(0, maxDur - 2));
        endSec = Math.min(endSec, maxDur);
      }

      if (endSec <= startSec + 1) {
        endSec = Math.min(
          durationSeconds > 0 ? Math.round(durationSeconds) : startSec + 15,
          startSec + 15
        );
      }

      const clipTitle = (clip.title || `Clip ${idx + 1}`).trim();
      const urls = CloudinaryService.buildVideoClipUrls(cloudinaryPublicId, startSec, endSec, {
        clipTitle: `${idx + 1}_${clipTitle}`,
        sourceVideoUrl,
      });

      const quizData =
        clip.quiz && clip.quiz.question && Array.isArray(clip.quiz.options) && clip.quiz.options.length >= 2
          ? {
              question: String(clip.quiz.question).trim(),
              options: clip.quiz.options.slice(0, 4).map((o) => String(o).trim()),
              correctIndex: Math.min(
                Math.max(0, Number(clip.quiz.correctIndex) || 0),
                clip.quiz.options.length - 1
              ),
              explanation: String(clip.quiz.explanation || '').trim(),
            }
          : null;

      return {
        order: idx + 1,
        title: clipTitle,
        startSeconds: startSec,
        endSeconds: endSec,
        startTimeFormatted: formatTimestamp(startSec),
        endTimeFormatted: formatTimestamp(endSec),
        durationSeconds: Math.max(1, endSec - startSec),
        clipUrl: urls.clipUrl,
        downloadUrl: urls.downloadUrl,
        thumbnailUrl: urls.thumbnailUrl,
        shortSummary: String(clip.shortSummary || '').trim(),
        detailedExplanation: String(clip.detailedExplanation || '').trim(),
        keyTakeaways: Array.isArray(clip.keyTakeaways)
          ? clip.keyTakeaways.map((t) => String(t).trim()).filter(Boolean)
          : [],
        realWorldExample: String(clip.realWorldExample || '').trim(),
        transcriptSnippet: String(clip.transcriptSnippet || '').trim(),
        quiz: quizData,
      };
    });

    // 4. Persist to MongoDB
    const record = await VideoClipBreakdown.create({
      tenantId,
      createdBy: userId,
      title: (title || '').trim() || analysis.videoTitle || cleanTitle,
      originalFileName,
      language,
      clipStyle,
      sourceVideoUrl,
      cloudinaryPublicId,
      durationSeconds: Math.round(totalDuration),
      fileSizeBytes: Number(fileSizeBytes) || 0,
      videoSummary: String(analysis.videoSummary || '').trim(),
      overallTopics: Array.isArray(analysis.overallTopics)
        ? analysis.overallTopics.map((t) => String(t).trim()).filter(Boolean)
        : [],
      clips: processedClips,
      status: 'COMPLETED',
    });

    return record.toObject();
  }

  /**
   * List saved video breakdowns
   */
  static async listBreakdowns(tenantId, userId, isAdmin = false, options = {}) {
    const query = isAdmin ? { tenantId } : { tenantId, createdBy: userId };
    const limit = Math.min(50, Math.max(1, Number(options.limit) || 30));

    if (options.summary) {
      const docs = await VideoClipBreakdown.find(query)
        .select('title language durationSeconds videoSummary overallTopics createdAt clips.thumbnailUrl')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return docs.map((d) => ({
        _id: d._id,
        title: d.title,
        language: d.language,
        durationSeconds: d.durationSeconds,
        videoSummary: d.videoSummary,
        overallTopics: d.overallTopics || [],
        createdAt: d.createdAt,
        clipCount: Array.isArray(d.clips) ? d.clips.length : 0,
        thumbnailUrl: d.clips?.[0]?.thumbnailUrl || '',
      }));
    }

    return await VideoClipBreakdown.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get single video breakdown by ID
   */
  static async getBreakdownById(tenantId, id) {
    const doc = await VideoClipBreakdown.findOne({ _id: id, tenantId }).lean();
    if (!doc) {
      throw new NotFoundError('Video breakdown not found');
    }
    return doc;
  }

  /**
   * Fine-tune a specific clip's startSeconds / endSeconds and regenerate its Cloudinary URLs
   */
  static async updateClipTiming(tenantId, breakdownId, clipId, startSeconds, endSeconds, userId, isAdmin = false) {
    const query = isAdmin
      ? { _id: breakdownId, tenantId }
      : { _id: breakdownId, tenantId, createdBy: userId };

    const doc = await VideoClipBreakdown.findOne(query);
    if (!doc) {
      throw new NotFoundError('Video breakdown not found or permission denied');
    }

    const clip = doc.clips.id(clipId);
    if (!clip) {
      throw new NotFoundError('Clip not found in this video breakdown');
    }

    const maxDur = doc.durationSeconds > 0 ? doc.durationSeconds : 36000;
    const cleanStart = Math.max(0, Math.min(Math.round(Number(startSeconds) || 0), Math.max(0, maxDur - 2)));
    const cleanEnd = Math.max(cleanStart + 2, Math.min(Math.round(Number(endSeconds) || cleanStart + 10), maxDur));

    const urls = CloudinaryService.buildVideoClipUrls(doc.cloudinaryPublicId, cleanStart, cleanEnd, {
      clipTitle: `${clip.order}_${clip.title}`,
      sourceVideoUrl: doc.sourceVideoUrl,
    });

    clip.startSeconds = cleanStart;
    clip.endSeconds = cleanEnd;
    clip.startTimeFormatted = formatTimestamp(cleanStart);
    clip.endTimeFormatted = formatTimestamp(cleanEnd);
    clip.durationSeconds = Math.max(1, cleanEnd - cleanStart);
    clip.clipUrl = urls.clipUrl;
    clip.downloadUrl = urls.downloadUrl;
    clip.thumbnailUrl = urls.thumbnailUrl;

    await doc.save();
    return doc.toObject();
  }

  /**
   * Delete a video breakdown
   */
  static async deleteBreakdown(tenantId, id, userId, isAdmin = false) {
    const query = isAdmin
      ? { _id: id, tenantId }
      : { _id: id, tenantId, createdBy: userId };
    const deleted = await VideoClipBreakdown.findOneAndDelete(query).lean();
    if (!deleted) {
      throw new NotFoundError('Video breakdown not found or you do not have permission to delete it');
    }
    return { deletedId: id };
  }
}

export default VideoClipAnalyzerService;
