import TutorConversation from '../models/TutorConversation.js';
import TutorMessage from '../models/TutorMessage.js';
import TutorFeedback from '../models/TutorFeedback.js';
import TutorConfusionTopic from '../models/TutorConfusionTopic.js';
import AIUsageRecord from '../models/AIUsageRecord.js';
import { BaseService } from './base.service.js';
import { NotFoundError } from '../lib/errors.js';

export class TutorAnalyticsService extends BaseService {
  constructor() {
    super(TutorConversation);
  }

  /**
   * Module 07.5: Overall Tutor Usage and Performance Analytics
   */
  static async getTutorOverview(tenantId, filters = {}) {
    const baseFilter = { tenantId };
    if (filters.courseId) baseFilter.courseId = filters.courseId;

    const [
      totalConversations,
      activeLearners,
      totalMessages,
      feedbackStats,
      tokenAggregation,
    ] = await Promise.all([
      TutorConversation.countDocuments(baseFilter),
      TutorConversation.distinct('userId', baseFilter),
      TutorMessage.countDocuments({ tenantId }),
      TutorFeedback.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
      ]),
      AIUsageRecord.aggregate([
        { $match: { tenantId, taskType: 'TUTOR_CHAT' } },
        {
          $group: {
            _id: null,
            totalInputTokens: { $sum: '$inputTokens' },
            totalOutputTokens: { $sum: '$outputTokens' },
            totalTokens: { $sum: '$totalTokens' },
          },
        },
      ]),
    ]);

    // Calculate feedback satisfaction rate
    let helpfulCount = 0;
    let totalRatings = 0;
    for (const stat of feedbackStats) {
      totalRatings += stat.count;
      if (stat._id === 'HELPFUL') helpfulCount += stat.count;
    }

    const satisfactionRate =
      totalRatings > 0 ? Math.round((helpfulCount / totalRatings) * 100) : 100;

    const tokens = tokenAggregation[0] || {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
    };

    return {
      totalConversations,
      activeLearnersCount: activeLearners.length,
      totalMessages,
      satisfactionRate,
      feedbackBreakdown: feedbackStats,
      tokenUsage: tokens,
    };
  }

  /**
   * Top Learner Confusion Topics Heatmap
   */
  static async getConfusionTopics(tenantId, query = {}) {
    const filter = { tenantId };

    if (query.courseId) filter.courseId = query.courseId;
    if (query.severity) filter.severity = query.severity;
    if (query.resolved !== undefined) {
      filter.resolved = query.resolved === 'true' || query.resolved === true;
    }

    const topics = await TutorConfusionTopic.find(filter)
      .sort({ queryCount: -1, updatedAt: -1 })
      .populate('courseId', 'title slug')
      .populate('lessonId', 'title')
      .lean();

    return topics;
  }

  /**
   * Mark a confusion topic as resolved by the instructor
   */
  static async resolveConfusionTopic(tenantId, topicId) {
    const topic = await TutorConfusionTopic.findOneAndUpdate(
      { _id: topicId, tenantId },
      { $set: { resolved: true } },
      { new: true }
    );

    if (!topic) {
      throw new NotFoundError('Confusion topic not found');
    }

    return topic;
  }

  /**
   * Audit of flagged queries (moderation / jailbreak / policy alerts)
   */
  static async getFlaggedMessages(tenantId, query = {}) {
    const filter = { tenantId, isFlagged: true };

    const page = Math.max(1, parseInt(query.page || 1, 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || 20, 10)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      TutorMessage.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .populate('conversationId', 'title courseId')
        .lean(),
      TutorMessage.countDocuments(filter),
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
   * Content Gap Detection: identifies topics where students gave negative feedback or had ungrounded answers
   */
  static async getContentGaps(tenantId, courseId = null) {
    const matchFilter = { tenantId };
    if (courseId) matchFilter.courseId = courseId;

    const ungroundedMessages = await TutorMessage.aggregate([
      { $match: { ...matchFilter, sender: 'ASSISTANT', isGrounded: false } },
      { $limit: 10 },
      { $project: { content: 1, conversationId: 1, createdAt: 1 } },
    ]);

    const negativeFeedback = await TutorFeedback.find({
      tenantId,
      rating: { $in: ['UNHELPFUL', 'INACCURATE', 'CONFUSING'] },
    })
      .populate('messageId', 'content')
      .limit(10)
      .lean();

    return {
      ungroundedResponsesCount: ungroundedMessages.length,
      ungroundedSamples: ungroundedMessages,
      negativeFeedbackCount: negativeFeedback.length,
      feedbackSamples: negativeFeedback,
    };
  }

  /**
   * Export comprehensive conversation transcript for auditing & compliance
   */
  static async exportConversationAudit(tenantId, conversationId) {
    const conversation = await TutorConversation.findOne({ _id: conversationId, tenantId })
      .populate('userId', 'name email role')
      .populate('courseId', 'title slug')
      .populate('lessonId', 'title')
      .lean();

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const messages = await TutorMessage.find({ tenantId, conversationId })
      .sort({ createdAt: 1 })
      .lean();

    return {
      exportTimestamp: new Date().toISOString(),
      conversationId: conversation._id,
      tenantId,
      user: conversation.userId,
      course: conversation.courseId,
      lesson: conversation.lessonId,
      status: conversation.status,
      mode: conversation.mode,
      totalMessages: messages.length,
      tokenUsage: conversation.tokenUsage,
      transcript: messages.map((m) => ({
        id: m._id,
        sender: m.sender,
        content: m.content,
        sentiment: m.sentiment,
        hintLevel: m.hintLevel,
        isGrounded: m.isGrounded,
        citations: m.citations,
        tokensUsed: m.tokensUsed,
        timestamp: m.createdAt,
      })),
    };
  }
}

export default TutorAnalyticsService;

