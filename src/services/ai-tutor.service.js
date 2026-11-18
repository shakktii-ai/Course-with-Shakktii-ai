import TutorConversation from '../models/TutorConversation.js';
import TutorMessage from '../models/TutorMessage.js';
import TutorFeedback from '../models/TutorFeedback.js';
import TutorConfusionTopic from '../models/TutorConfusionTopic.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import LessonBlock from '../models/LessonBlock.js';
import CourseSourceMapping from '../models/CourseSourceMapping.js';
import AIUsageRecord from '../models/AIUsageRecord.js';
import { BaseService } from './base.service.js';
import { DocumentProcessorService } from './document-processor.service.js';
import { AIProviderFactory } from './ai-adapters/ai-provider.factory.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';
import {
  TUTOR_MODE,
  TUTOR_CONTEXT_SCOPE,
  TUTOR_MESSAGE_SENDER,
  TUTOR_CONFUSION_SEVERITY,
} from '../constants/index.js';

export class AITutorService extends BaseService {
  constructor() {
    super(TutorConversation);
  }

  /**
   * Module 07.1: Create a multi-turn AI Tutor conversation session
   */
  static async createConversation(tenantId, userId, data = {}) {
    if (!tenantId || !userId) {
      throw new BadRequestError('Tenant ID and User ID are required to initiate tutor conversation');
    }

    const {
      courseId = null,
      moduleId = null,
      lessonId = null,
      title = 'Learning Session',
      contextScope = TUTOR_CONTEXT_SCOPE.COURSE,
      mode = TUTOR_MODE.TUTOR,
      academyId = null,
    } = data;

    let resolvedTitle = title;
    let welcomeText = 'Hello! I am your AI Learning Companion. How can I assist your learning today?';

    if (courseId) {
      const course = await Course.findOne({ _id: courseId, tenantId }).lean();
      if (!course) {
        throw new NotFoundError('Target course not found in this organization');
      }
      resolvedTitle = `${course.title} — Session`;
      welcomeText = `Welcome to your AI Tutor for **${course.title}**! Ask me questions about concepts, code examples, or lesson topics.`;
    }

    if (lessonId) {
      const lesson = await Lesson.findOne({ _id: lessonId, tenantId }).lean();
      if (lesson) {
        resolvedTitle = `${lesson.title} — Discussion`;
        welcomeText = `I am ready to help you explore **${lesson.title}**. What would you like to dive into?`;
      }
    }

    const conversation = await TutorConversation.create({
      tenantId,
      academyId,
      userId,
      courseId,
      moduleId,
      lessonId,
      title: resolvedTitle,
      contextScope,
      mode,
      status: 'ACTIVE',
      messageCount: 1,
    });

    // Seed welcoming initial greeting
    const initialMessage = await TutorMessage.create({
      tenantId,
      conversationId: conversation._id,
      userId,
      sender: TUTOR_MESSAGE_SENDER.ASSISTANT,
      content: welcomeText,
      isGrounded: true,
      tokensUsed: { input: 0, output: 25 },
    });

    return {
      conversation,
      initialMessage,
    };
  }

  /**
   * List user's conversations with optional course or mode filters
   */
  static async getConversations(tenantId, userId, query = {}) {
    const filter = { tenantId, userId };

    if (query.courseId) filter.courseId = query.courseId;
    if (query.lessonId) filter.lessonId = query.lessonId;
    if (query.status) filter.status = query.status;
    if (query.mode) filter.mode = query.mode;

    const page = Math.max(1, parseInt(query.page || 1, 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || 20, 10)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      TutorConversation.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('courseId', 'title slug')
        .populate('lessonId', 'title')
        .lean(),
      TutorConversation.countDocuments(filter),
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
   * Get conversation details with complete message history
   */
  static async getConversationById(tenantId, userId, conversationId) {
    const conversation = await TutorConversation.findOne({
      _id: conversationId,
      tenantId,
      userId,
    })
      .populate('courseId', 'title slug description')
      .populate('lessonId', 'title type')
      .lean();

    if (!conversation) {
      throw new NotFoundError('Conversation not found or access denied');
    }

    const messages = await TutorMessage.find({
      tenantId,
      conversationId,
    })
      .sort({ createdAt: 1 })
      .lean();

    return {
      conversation,
      messages,
    };
  }

  /**
   * Archive conversation
   */
  static async archiveConversation(tenantId, userId, conversationId) {
    const conversation = await TutorConversation.findOneAndUpdate(
      { _id: conversationId, tenantId, userId },
      { $set: { status: 'ARCHIVED' } },
      { new: true }
    );

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    return conversation;
  }

  /**
   * Module 07.2: Send message, perform hybrid RAG retrieval, and generate grounded tutor reply
   */
  static async sendMessage(tenantId, userId, conversationId, { content, hintLevel = null, mode = null }) {
    if (!content || !content.trim()) {
      throw new BadRequestError('Message content cannot be empty');
    }

    const conversation = await TutorConversation.findOne({
      _id: conversationId,
      tenantId,
      userId,
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Allow updating mode on the fly
    if (mode && ['TUTOR', 'SOCRATIC', 'CODE_HINT', 'PRACTICE'].includes(mode)) {
      conversation.mode = mode;
      await conversation.save();
    }

    // Guardrails & Moderation check
    const { isFlagged, flagReason } = this.checkModerationGuardrails(content);

    // Sentiment detection
    const sentiment = this.detectSentiment(content);

    // Save user message
    const userMessage = await TutorMessage.create({
      tenantId,
      conversationId: conversation._id,
      userId,
      sender: TUTOR_MESSAGE_SENDER.USER,
      content: content.trim(),
      hintLevel,
      sentiment,
      isFlagged,
      flagReason,
      tokensUsed: { input: Math.ceil(content.length / 4), output: 0 },
    });

    // Build context
    const context = await this.buildConversationContext(tenantId, conversation, content);

    // Retrieve AI provider adapter
    const aiAdapter = await AIProviderFactory.getProvider(tenantId);

    // Fetch recent message history (last 8 messages)
    const recentMessages = await TutorMessage.find({
      tenantId,
      conversationId: conversation._id,
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    recentMessages.reverse();

    // Generate Tutor Response
    const tutorResult = await aiAdapter.generateTutorReply({
      messages: recentMessages,
      context,
      mode: conversation.mode,
      courseInfo: context.course,
    });

    // Save assistant reply
    const assistantMessage = await TutorMessage.create({
      tenantId,
      conversationId: conversation._id,
      userId,
      sender: TUTOR_MESSAGE_SENDER.ASSISTANT,
      content: tutorResult.content,
      citations: tutorResult.citations || [],
      isGrounded: tutorResult.isGrounded !== false,
      tokensUsed: tutorResult.tokenUsage || { input: 120, output: 250 },
    });

    // Update conversation metrics
    const totalTokens =
      (tutorResult.tokenUsage?.inputTokens || 120) + (tutorResult.tokenUsage?.outputTokens || 250);

    conversation.messageCount += 2;
    conversation.tokenUsage = {
      inputTokens: (conversation.tokenUsage?.inputTokens || 0) + (tutorResult.tokenUsage?.inputTokens || 120),
      outputTokens: (conversation.tokenUsage?.outputTokens || 0) + (tutorResult.tokenUsage?.outputTokens || 250),
      totalTokens: (conversation.tokenUsage?.totalTokens || 0) + totalTokens,
    };
    await conversation.save();

    // Log AI Usage
    await AIUsageRecord.create({
      tenantId,
      userId,
      taskType: 'TUTOR_CHAT',
      provider: aiAdapter.name,
      model: aiAdapter.model || 'default',
      inputTokens: tutorResult.tokenUsage?.inputTokens || 120,
      outputTokens: tutorResult.tokenUsage?.outputTokens || 250,
      totalTokens,
    });

    // Track learner confusion if sentiment indicates confusion or struggle
    if (sentiment === 'CONFUSED' || sentiment === 'FRUSTRATED') {
      await this.recordConfusionTopic(tenantId, conversation.courseId, conversation.lessonId, content);
    }

    return {
      conversation,
      userMessage,
      assistantMessage,
    };
  }

  /**
   * Module 07.4: Progressive Socratic Code & Concept Hint Revelation (Levels 1-4)
   */
  static async getSocraticHint(tenantId, userId, conversationId, { code = '', problemStatement = '', currentHintLevel = 1 }) {
    const conversation = await TutorConversation.findOne({
      _id: conversationId,
      tenantId,
      userId,
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const nextHintLevel = Math.min(4, Math.max(1, parseInt(currentHintLevel, 10)));

    // Save user request
    await TutorMessage.create({
      tenantId,
      conversationId: conversation._id,
      userId,
      sender: TUTOR_MESSAGE_SENDER.USER,
      content: `Requesting progressive hint Level ${nextHintLevel} for: ${problemStatement || 'current challenge'}`,
      hintLevel: nextHintLevel,
      tokensUsed: { input: 30, output: 0 },
    });

    const aiAdapter = await AIProviderFactory.getProvider(tenantId);
    const hintResult = await aiAdapter.generateSocraticHints({
      code,
      problemStatement,
      currentHintLevel: nextHintLevel,
    });

    // Save assistant hint
    const assistantMessage = await TutorMessage.create({
      tenantId,
      conversationId: conversation._id,
      userId,
      sender: TUTOR_MESSAGE_SENDER.ASSISTANT,
      content: `### ${hintResult.title}\n\n${hintResult.hint}`,
      hintLevel: hintResult.hintLevel,
      isGrounded: true,
      tokensUsed: hintResult.tokenUsage || { input: 80, output: 140 },
    });

    conversation.messageCount += 2;
    await conversation.save();

    return {
      hintLevel: hintResult.hintLevel,
      title: hintResult.title,
      hint: hintResult.hint,
      canAdvance: hintResult.canAdvance,
      assistantMessage,
    };
  }

  /**
   * Submit Learner Feedback on Tutor Response
   */
  static async submitFeedback(tenantId, userId, { conversationId, messageId, rating, comment = '' }) {
    if (!messageId || !rating) {
      throw new BadRequestError('Message ID and feedback rating are required');
    }

    const message = await TutorMessage.findOne({ _id: messageId, tenantId });
    if (!message) {
      throw new NotFoundError('Target message not found');
    }

    const feedback = await TutorFeedback.findOneAndUpdate(
      { tenantId, messageId, userId },
      {
        $set: {
          conversationId,
          rating,
          comment: comment.trim(),
        },
      },
      { upsert: true, new: true }
    );

    return feedback;
  }

  /**
   * Hybrid RAG context building: fetches course data, lesson blocks, and semantic document chunks
   */
  static async buildConversationContext(tenantId, conversation, query) {
    const context = {
      course: null,
      lesson: null,
      chunks: [],
    };

    if (conversation.courseId) {
      context.course = await Course.findOne({ _id: conversation.courseId, tenantId }).lean();
    }

    if (conversation.lessonId) {
      context.lesson = await Lesson.findOne({ _id: conversation.lessonId, tenantId }).lean();
      if (context.lesson) {
        const blocks = await LessonBlock.find({
          tenantId,
          lessonId: conversation.lessonId,
        })
          .limit(5)
          .lean();
        context.lesson.blocks = blocks;
      }
    }

    // Retrieve linked source documents
    let documentIds = [];
    if (conversation.courseId) {
      const mappings = await CourseSourceMapping.find({
        tenantId,
        courseId: conversation.courseId,
      }).lean();
      documentIds = mappings.map((m) => m.documentId);
    }

    // Hybrid Semantic + Keyword Retrieval
    try {
      const relevantChunks = await DocumentProcessorService.retrieveRelevantChunks(
        tenantId,
        query,
        documentIds,
        3
      );
      context.chunks = relevantChunks || [];
    } catch {
      context.chunks = [];
    }

    return context;
  }

  /**
   * Tracks repeated learner confusion topics for instructor analytics
   */
  static async recordConfusionTopic(tenantId, courseId, lessonId, query) {
    if (!query) return;

    // Extract core keywords
    const cleanTopic = query
      .replace(/[^\w\s]/gi, '')
      .split(' ')
      .filter((w) => w.length > 3)
      .slice(0, 4)
      .join(' ')
      .toLowerCase();

    if (!cleanTopic) return;

    await TutorConfusionTopic.findOneAndUpdate(
      {
        tenantId,
        courseId: courseId || null,
        topic: cleanTopic,
      },
      {
        $inc: { queryCount: 1 },
        $push: { sampleQueries: { $each: [query.substring(0, 200)], $slice: -10 } },
        $set: {
          lessonId: lessonId || null,
          severity: TUTOR_CONFUSION_SEVERITY.MEDIUM,
          resolved: false,
        },
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Sentiment heuristic detection
   */
  static detectSentiment(text) {
    const lower = text.toLowerCase();
    if (
      lower.includes('confused') ||
      lower.includes("don't understand") ||
      lower.includes('stuck') ||
      lower.includes('lost') ||
      lower.includes('frustrated') ||
      lower.includes('what do you mean')
    ) {
      return 'CONFUSED';
    }
    if (
      lower.includes('thank') ||
      lower.includes('great') ||
      lower.includes('helpful') ||
      lower.includes('got it') ||
      lower.includes('makes sense') ||
      lower.includes('awesome')
    ) {
      return 'POSITIVE';
    }
    return 'NEUTRAL';
  }

  /**
   * Safety and Prompt Injection Guardrails
   */
  static checkModerationGuardrails(text) {
    const lower = text.toLowerCase();
    const maliciousPatterns = [
      'ignore all previous instructions',
      'system prompt leak',
      'reveal api key',
      'bypass authorization',
      'drop database',
      'sudo rm -rf',
    ];

    for (const pattern of maliciousPatterns) {
      if (lower.includes(pattern)) {
        return {
          isFlagged: true,
          flagReason: `Guardrail violation: Detected security risk or prompt bypass pattern '${pattern}'`,
        };
      }
    }

    return { isFlagged: false, flagReason: null };
  }
}

export default AITutorService;

