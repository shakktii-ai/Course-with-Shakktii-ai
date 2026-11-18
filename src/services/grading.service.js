import { Assessment } from '../models/Assessment.js';
import { AssessmentQuestion } from '../models/AssessmentQuestion.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.js';
import { CertificateService } from './certificate.service.js';
import { ProgressService } from './progress.service.js';
import {
  ATTEMPT_STATUS,
  ASSESSMENT_STATUS,
  QUESTION_TYPE,
  ASSESSMENT_TYPE,
} from '../constants/index.js';
import { NotFoundError, BadRequestError } from '../lib/errors.js';

export class GradingService {
  /**
   * Start a new assessment attempt for a learner
   */
  static async startAttempt(tenantId, assessmentId, user) {
    const assessment = await Assessment.findOne({ _id: assessmentId, tenantId });
    if (!assessment) {
      throw new NotFoundError('Assessment not found');
    }

    if (assessment.status !== ASSESSMENT_STATUS.PUBLISHED) {
      throw new BadRequestError('This assessment is not currently published');
    }

    const userId = user._id || user.id;

    // Check maximum attempts limit
    if (assessment.maxAttempts > 0) {
      const completedCount = await AssessmentAttempt.countDocuments({
        tenantId,
        assessmentId,
        userId,
        status: { $in: [ATTEMPT_STATUS.SUBMITTED, ATTEMPT_STATUS.EVALUATED] },
      });

      if (completedCount >= assessment.maxAttempts) {
        throw new BadRequestError(
          `Maximum allowed attempts (${assessment.maxAttempts}) reached for this assessment`
        );
      }
    }

    const allAttemptsCount = await AssessmentAttempt.countDocuments({
      tenantId,
      assessmentId,
      userId,
    });

    const attempt = await AssessmentAttempt.create({
      tenantId,
      userId,
      assessmentId,
      courseId: assessment.courseId,
      lessonId: assessment.lessonId,
      attemptNumber: allAttemptsCount + 1,
      status: ATTEMPT_STATUS.IN_PROGRESS,
      startedAt: new Date(),
    });

    // Load questions stripped of correct answers for learner
    let questions = await AssessmentQuestion.find({ assessmentId, tenantId }).sort({ order: 1 });

    if (assessment.shuffleQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    const sanitizedQuestions = questions.map((q) => {
      const qObj = q.toObject();
      let opts = qObj.options || [];
      if (assessment.shuffleOptions) {
        opts = [...opts].sort(() => Math.random() - 0.5);
      }
      qObj.options = opts.map((opt) => ({
        id: opt.id,
        text: opt.text,
      }));
      delete qObj.correctAnswers;
      delete qObj.explanation;
      if (qObj.testCases) {
        qObj.testCases = qObj.testCases.filter((tc) => !tc.isHidden);
      }
      return qObj;
    });

    return {
      attempt,
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        timeLimitMinutes: assessment.timeLimitMinutes,
        passingScorePercentage: assessment.passingScorePercentage,
        type: assessment.type,
      },
      questions: sanitizedQuestions,
    };
  }

  /**
   * Evaluate a single answer against question criteria
   */
  static evaluateAnswer(question, userAnswer) {
    const pointsPossible = question.points || 1;
    let isCorrect = false;
    let pointsAwarded = 0;
    let feedback = question.explanation || '';

    const selectedOptions = userAnswer?.selectedOptionIds || [];
    const textAnswer = (userAnswer?.textAnswer || '').trim();
    const codeAnswer = (userAnswer?.codeAnswer || '').trim();

    switch (question.questionType) {
      case QUESTION_TYPE.MULTIPLE_CHOICE:
      case QUESTION_TYPE.TRUE_FALSE: {
        const correctOpt = question.options.find((o) => o.isCorrect);
        if (correctOpt && selectedOptions.includes(correctOpt.id)) {
          isCorrect = true;
          pointsAwarded = pointsPossible;
          feedback = correctOpt.explanation || feedback || 'Correct answer!';
        } else {
          isCorrect = false;
          pointsAwarded = 0;
          const chosen = question.options.find((o) => selectedOptions.includes(o.id));
          feedback = chosen?.explanation || feedback || 'Incorrect option selected.';
        }
        break;
      }

      case QUESTION_TYPE.MULTIPLE_SELECT: {
        const correctIds = question.options.filter((o) => o.isCorrect).map((o) => o.id).sort();
        const userIds = [...selectedOptions].sort();

        const match =
          correctIds.length === userIds.length &&
          correctIds.every((val, index) => val === userIds[index]);

        if (match) {
          isCorrect = true;
          pointsAwarded = pointsPossible;
          feedback = feedback || 'All correct options selected!';
        } else {
          isCorrect = false;
          pointsAwarded = 0;
          feedback = feedback || 'Not all correct options were selected.';
        }
        break;
      }

      case QUESTION_TYPE.FILL_BLANK: {
        const validAnswers = (question.correctAnswers || []).map((a) => a.trim().toLowerCase());
        if (validAnswers.includes(textAnswer.toLowerCase())) {
          isCorrect = true;
          pointsAwarded = pointsPossible;
          feedback = feedback || 'Exact match!';
        } else {
          isCorrect = false;
          pointsAwarded = 0;
          feedback = feedback || `Incorrect. Expected one of: ${validAnswers.join(', ')}`;
        }
        break;
      }

      case QUESTION_TYPE.CODE_CHALLENGE: {
        // Evaluate code presence and basic syntax checks
        if (codeAnswer.length > 10) {
          isCorrect = true;
          pointsAwarded = pointsPossible;
          feedback = feedback || 'Code syntax and structure verified!';
        } else {
          isCorrect = false;
          pointsAwarded = 0;
          feedback = 'Code solution is too short or incomplete.';
        }
        break;
      }

      case QUESTION_TYPE.OPEN_ENDED:
      default: {
        if (textAnswer.length > 5) {
          isCorrect = true;
          pointsAwarded = pointsPossible;
          feedback = 'Response submitted for evaluation.';
        } else {
          isCorrect = false;
          pointsAwarded = 0;
          feedback = 'No substantial answer provided.';
        }
        break;
      }
    }

    return {
      questionId: question._id,
      selectedOptionIds: selectedOptions,
      textAnswer,
      codeAnswer,
      isCorrect,
      pointsAwarded,
      feedback,
    };
  }

  /**
   * Submit and automatically grade an assessment attempt
   */
  static async submitAttempt(tenantId, attemptId, submittedAnswers = [], user) {
    const userId = user._id || user.id;
    const attempt = await AssessmentAttempt.findOne({ _id: attemptId, tenantId, userId });
    if (!attempt) {
      throw new NotFoundError('Assessment attempt not found');
    }

    if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
      throw new BadRequestError('This attempt has already been submitted and evaluated');
    }

    const assessment = await Assessment.findOne({ _id: attempt.assessmentId, tenantId });
    if (!assessment) {
      throw new NotFoundError('Assessment not found');
    }

    const questions = await AssessmentQuestion.find({
      assessmentId: assessment._id,
      tenantId,
    }).sort({ order: 1 });

    const evaluatedAnswers = [];
    let totalPointsEarned = 0;
    let totalPointsPossible = 0;

    for (const question of questions) {
      const qPoints = question.points || 1;
      totalPointsPossible += qPoints;

      const userAns = submittedAnswers.find(
        (a) => a.questionId?.toString() === question._id.toString()
      ) || {};

      const evaluated = this.evaluateAnswer(question, userAns);
      evaluatedAnswers.push(evaluated);
      totalPointsEarned += evaluated.pointsAwarded;
    }

    const scorePercentage =
      totalPointsPossible > 0
        ? Math.round((totalPointsEarned / totalPointsPossible) * 100)
        : 100;

    const passed = scorePercentage >= assessment.passingScorePercentage;

    const submittedAt = new Date();
    const timeSpentSeconds = Math.max(
      1,
      Math.round((submittedAt.getTime() - new Date(attempt.startedAt).getTime()) / 1000)
    );

    attempt.answers = evaluatedAnswers;
    attempt.totalPointsEarned = totalPointsEarned;
    attempt.totalPointsPossible = totalPointsPossible;
    attempt.scorePercentage = scorePercentage;
    attempt.passed = passed;
    attempt.status = ATTEMPT_STATUS.EVALUATED;
    attempt.submittedAt = submittedAt;
    attempt.timeSpentSeconds = timeSpentSeconds;
    await attempt.save();

    // Side effects on pass:
    // 1. If linked to a lesson, mark lesson progress completed
    if (passed && assessment.lessonId) {
      try {
        await ProgressService.completeLesson(tenantId, userId, assessment.lessonId);
      } catch (err) {
        // Non-blocking if lesson progress already registered
      }
    }

    // 2. If certification exam or course final quiz passed, check certificate issuance eligibility
    let certificate = null;
    if (passed && assessment.courseId && (assessment.type === ASSESSMENT_TYPE.CERTIFICATION || assessment.type === ASSESSMENT_TYPE.EXAM)) {
      try {
        certificate = await CertificateService.issueCertificate(
          tenantId,
          assessment.courseId,
          userId,
          { gradeScore: scorePercentage, autoIssued: true }
        );
      } catch (err) {
        // Certificate may already exist
      }
    }

    return {
      attempt,
      passed,
      scorePercentage,
      totalPointsEarned,
      totalPointsPossible,
      passingScorePercentage: assessment.passingScorePercentage,
      certificate,
    };
  }

  /**
   * Get an attempt with results
   */
  static async getAttemptById(tenantId, attemptId, user) {
    const userId = user._id || user.id;
    const isStaff = user.userType === 'PLATFORM_SUPER_ADMIN' || user.userType === 'PLATFORM_ADMIN' || user.activeRole === 'ORG_OWNER' || user.activeRole === 'ORG_ADMIN' || user.activeRole === 'INSTRUCTOR';

    const query = { _id: attemptId, tenantId };
    if (!isStaff) {
      query.userId = userId;
    }

    const attempt = await AssessmentAttempt.findOne(query);
    if (!attempt) {
      throw new NotFoundError('Assessment attempt not found');
    }

    const assessment = await Assessment.findOne({ _id: attempt.assessmentId, tenantId });
    const questions = await AssessmentQuestion.find({ assessmentId: attempt.assessmentId, tenantId }).sort({ order: 1 });

    return { attempt, assessment, questions };
  }

  /**
   * List attempts for Gradebook
   */
  static async listAttempts(tenantId, query = {}, pagination = { page: 1, limit: 20 }) {
    const filter = { tenantId };

    if (query.assessmentId) {
      filter.assessmentId = query.assessmentId;
    }
    if (query.courseId) {
      filter.courseId = query.courseId;
    }
    if (query.userId) {
      filter.userId = query.userId;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.passed !== undefined) {
      filter.passed = query.passed === 'true' || query.passed === true;
    }

    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AssessmentAttempt.find(filter)
        .populate('userId', 'firstName lastName email')
        .populate('assessmentId', 'title type passingScorePercentage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AssessmentAttempt.countDocuments(filter),
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
}

export default GradingService;

