import { MediaAsset } from '../models/MediaAsset.js';
import { NotFoundError, BadRequestError } from '../lib/errors.js';
import { MEDIA_TYPE } from '../constants/index.js';

export class MediaAssetService {
  /**
   * Create / register a new media asset
   */
  static async createMediaAsset(tenantId, data, user) {
    if (!data.name || !data.mediaType || !data.url) {
      throw new BadRequestError('Asset name, mediaType, and url are required');
    }

    if (!Object.values(MEDIA_TYPE).includes(data.mediaType)) {
      throw new BadRequestError(`Invalid mediaType. Allowed: ${Object.values(MEDIA_TYPE).join(', ')}`);
    }

    const storageKey = data.storageKey || `uploads/${tenantId}/${Date.now()}_${data.name.replace(/\s+/g, '_')}`;

    return await MediaAsset.create({
      tenantId,
      name: data.name.trim(),
      mediaType: data.mediaType,
      storageKey,
      url: data.url.trim(),
      mimeType: data.mimeType || 'application/octet-stream',
      sizeBytes: data.sizeBytes || 1024 * 1024,
      durationSeconds: data.durationSeconds || 0,
      resolution: data.resolution || '',
      associatedProjectIds: data.projectId ? [data.projectId] : [],
      associatedCourseIds: data.courseId ? [data.courseId] : [],
      associatedLessonIds: data.lessonId ? [data.lessonId] : [],
      metadata: data.metadata || {},
      createdBy: user?._id || user?.id || null,
    });
  }

  /**
   * List media assets with filtering & pagination
   */
  static async listMediaAssets(tenantId, query = {}, pagination = { page: 1, limit: 20 }) {
    const filter = { tenantId };

    if (query.mediaType) {
      filter.mediaType = query.mediaType;
    }
    if (query.search) {
      filter.name = { $regex: query.search.trim(), $options: 'i' };
    }
    if (query.projectId) {
      filter.associatedProjectIds = query.projectId;
    }
    if (query.courseId) {
      filter.associatedCourseIds = query.courseId;
    }

    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      MediaAsset.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      MediaAsset.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single media asset by ID
   */
  static async getMediaAssetById(tenantId, assetId) {
    const asset = await MediaAsset.findOne({ _id: assetId, tenantId });
    if (!asset) {
      throw new NotFoundError('Media asset not found');
    }
    return asset;
  }

  /**
   * Delete media asset
   */
  static async deleteMediaAsset(tenantId, assetId) {
    const asset = await MediaAsset.findOne({ _id: assetId, tenantId });
    if (!asset) {
      throw new NotFoundError('Media asset not found');
    }

    await MediaAsset.deleteOne({ _id: assetId, tenantId });
    return { success: true, deletedAssetId: assetId };
  }

  /**
   * Aggregate storage usage metrics for tenant
   */
  static async getStorageUsage(tenantId) {
    const stats = await MediaAsset.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: '$mediaType',
          count: { $sum: 1 },
          totalBytes: { $sum: '$sizeBytes' },
        },
      },
    ]);

    const breakdown = {
      [MEDIA_TYPE.VIDEO]: { count: 0, totalBytes: 0 },
      [MEDIA_TYPE.AUDIO]: { count: 0, totalBytes: 0 },
      [MEDIA_TYPE.IMAGE]: { count: 0, totalBytes: 0 },
      [MEDIA_TYPE.SUBTITLE]: { count: 0, totalBytes: 0 },
      [MEDIA_TYPE.DOCUMENT]: { count: 0, totalBytes: 0 },
    };

    let grandTotalBytes = 0;
    let grandTotalAssets = 0;

    stats.forEach((item) => {
      if (breakdown[item._id]) {
        breakdown[item._id] = {
          count: item.count,
          totalBytes: item.totalBytes,
        };
      }
      grandTotalBytes += item.totalBytes;
      grandTotalAssets += item.count;
    });

    return {
      totalBytes: grandTotalBytes,
      totalAssets: grandTotalAssets,
      breakdown,
    };
  }
}

export default MediaAssetService;

