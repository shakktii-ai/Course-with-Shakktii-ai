import LearnerKnowledgeProfile from '../models/LearnerKnowledgeProfile.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import Assessment from '../models/Assessment.js';
import AssessmentQuestion from '../models/AssessmentQuestion.js';
import Course from '../models/Course.js';
import { BaseService } from './base.service.js';
import { AIProviderFactory } from './ai-adapters/ai-provider.factory.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';
import { LEARNING_STYLE } from '../constants/index.js';

export class AdaptivePracticeService extends BaseService {
  constructor() {
    super(LearnerKnowledgeProfile);
  }

  /**
   * Module 07.3: Diagnose an assessment attempt to detect knowledge gaps
   */
  static async diagnoseAssessmentAttempt(tenantId, userId, attemptId) {
    if (!tenantId || !userId || !attemptId) {
      throw new BadRequestError('Tenant ID, User ID, and Attempt ID are required');
    }

    const attempt = await AssessmentAttempt.findOne({
      _id: attemptId,
      tenantId,
      userId,
    }).populate('assessmentId');

    if (!attempt) {
      throw new NotFoundError('Assessment attempt not found or access denied');
    }

    const assessment = attempt.assessmentId;
    const courseId = assessment.courseId;

    // Fetch the questions for this assessment
    const questions = await AssessmentQuestion.find({
      tenantId,
      assessmentId: assessment._id,
    }).lean();

    const questionMap = new Map(questions.map((q) => [String(q._id), q]));

    // Identify weak and strong questions
    const weakQuestions = [];
    const strongQuestions = [];
    const weakTopics = new Set();
    const strongTopics = new Set();

    for (const answerItem of attempt.answers || []) {
      const q = questionMap.get(String(answerItem.questionId));
      const topic = q?.topic || assessment.title || 'Core Curriculum';

      if (answerItem.isCorrect) {
        strongQuestions.push(q);
        strongTopics.add(topic);
      } else {
        weakQuestions.push({
          questionId: answerItem.questionId,
          questionText: q?.prompt || 'Question',
          topic,
          userAnswer: answerItem.userAnswer,
          explanation: q?.explanation || 'Review topic fundamentals',
        });
        weakTopics.add(topic);
      }
    }

    const rawScore = typeof attempt.scorePercentage === 'number' && !isNaN(attempt.scorePercentage)
      ? attempt.scorePercentage
      : (attempt.totalPointsPossible ? Math.round(((attempt.totalPointsEarned || 0) / attempt.totalPointsPossible) * 100) : 0);

    const scorePct = Math.max(0, Math.min(100, Math.round(rawScore || 0)));

    // Update or create LearnerKnowledgeProfile
    let profile = await LearnerKnowledgeProfile.findOne({
      tenantId,
      userId,
      courseId,
    });

    if (!profile) {
      profile = new LearnerKnowledgeProfile({
        tenantId,
        userId,
        courseId,
        masteryLevel: scorePct,
        weakConcepts: Array.from(weakTopics),
        strongConcepts: Array.from(strongTopics),
      });
    } else {
      // Exponential moving average for mastery level
      profile.masteryLevel = Math.round(profile.masteryLevel * 0.4 + scorePct * 0.6);

      // Merge topics
      const currentWeak = new Set(profile.weakConcepts || []);
      const currentStrong = new Set(profile.strongConcepts || []);

      for (const t of weakTopics) currentWeak.add(t);
      for (const t of strongTopics) {
        currentStrong.add(t);
        currentWeak.delete(t); // Removed from weak if mastered now
      }

      profile.weakConcepts = Array.from(currentWeak);
      profile.strongConcepts = Array.from(currentStrong);
    }

    await profile.save();

    return {
      attemptId,
      courseId,
      totalQuestions: questions.length,
      correctCount: strongQuestions.length,
      missedCount: weakQuestions.length,
      scorePercentage: scorePct,
      weakQuestions,
      weakConcepts: profile.weakConcepts,
      strongConcepts: profile.strongConcepts,
      masteryLevel: profile.masteryLevel,
    };
  }

  /**
   * Module 07.3: Generate AI-grounded remediation plan with step-by-step breakdown & practice
   */
  static async generateRemediation(tenantId, userId, attemptId) {
    const diagnosis = await this.diagnoseAssessmentAttempt(tenantId, userId, attemptId);

    const course = await Course.findOne({ _id: diagnosis.courseId, tenantId }).lean();
    const profile = await LearnerKnowledgeProfile.findOne({
      tenantId,
      userId,
      courseId: diagnosis.courseId,
    });

    const aiAdapter = await AIProviderFactory.getProvider(tenantId);
    const remediationResult = await aiAdapter.generateRemediation({
      weakQuestions: diagnosis.weakQuestions,
      courseInfo: course || { title: 'Assigned Course' },
      learnerProfile: profile || {},
    });

    // Record remediation history on the profile
    if (profile) {
      profile.remediationHistory.push({
        attemptId,
        topic: diagnosis.weakConcepts[0] || 'General Review',
        recommendedActions: remediationResult.remediationPlan?.nextSteps || [],
        completedAt: new Date(),
      });
      await profile.save();
    }

    return {
      attemptId,
      courseId: diagnosis.courseId,
      scorePercentage: diagnosis.scorePercentage,
      remediationPlan: remediationResult.remediationPlan,
      tokenUsage: remediationResult.tokenUsage,
    };
  }

  /**
   * Get or initialize Learner Knowledge Profile for a course
   */
  static async getLearnerProfile(tenantId, userId, courseId) {
    if (!tenantId || !userId || !courseId) {
      throw new BadRequestError('Tenant ID, User ID, and Course ID are required');
    }

    let profile = await LearnerKnowledgeProfile.findOne({
      tenantId,
      userId,
      courseId,
    }).populate('courseId', 'title slug');

    if (!profile) {
      profile = await LearnerKnowledgeProfile.create({
        tenantId,
        userId,
        courseId,
        masteryLevel: 60,
        learningStyle: LEARNING_STYLE.CONCEPTUAL,
        weakConcepts: [],
        strongConcepts: [],
      });
    }

    return profile;
  }

  /**
   * Update learner's preferred learning style
   */
  static async updateLearningStyle(tenantId, userId, courseId, learningStyle) {
    if (!Object.values(LEARNING_STYLE).includes(learningStyle)) {
      throw new BadRequestError(`Invalid learning style: ${learningStyle}`);
    }

    const profile = await LearnerKnowledgeProfile.findOneAndUpdate(
      { tenantId, userId, courseId },
      { $set: { learningStyle } },
      { upsert: true, new: true }
    );

    return profile;
  }

  /**
   * Generate adaptive practice questions targeting learner's weak areas
   */
  static async generateAdaptivePracticeQuestions(tenantId, userId, courseId) {
    const profile = await this.getLearnerProfile(tenantId, userId, courseId);
    const course = await Course.findOne({ _id: courseId, tenantId }).lean();

    const targetConcepts =
      profile.weakConcepts && profile.weakConcepts.length > 0
        ? profile.weakConcepts
        : ['Fundamentals & Application'];

    const aiAdapter = await AIProviderFactory.getProvider(tenantId);
    const practiceQuiz = await aiAdapter.generateQuiz(
      `Course: ${course?.title || 'Course'}. Practice target concepts: ${targetConcepts.join(', ')}.`
    );

    return {
      courseId,
      targetConcepts,
      masteryLevel: profile.masteryLevel,
      questions: practiceQuiz,
    };
  }
}

export default AdaptivePracticeService;
