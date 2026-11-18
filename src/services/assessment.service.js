import { Assessment } from '../models/Assessment.js';
import { AssessmentQuestion } from '../models/AssessmentQuestion.js';
import { NotFoundError, BadRequestError } from '../lib/errors.js';
import { ASSESSMENT_STATUS, ASSESSMENT_TYPE, QUESTION_TYPE } from '../constants/index.js';

export class AssessmentService {
  /**
   * Create a new Assessment (Quiz, Exam, Practice, or Certification)
   */
  static async createAssessment(tenantId, data, user) {
    if (!data.title || !data.title.trim()) {
      throw new BadRequestError('Assessment title is required');
    }

    const assessment = await Assessment.create({
      tenantId,
      title: data.title.trim(),
      description: data.description ? data.description.trim() : '',
      courseId: data.courseId || null,
      lessonId: data.lessonId || null,
      type: data.type || ASSESSMENT_TYPE.QUIZ,
      status: data.status || ASSESSMENT_STATUS.DRAFT,
      passingScorePercentage: data.passingScorePercentage !== undefined ? data.passingScorePercentage : 70,
      timeLimitMinutes: data.timeLimitMinutes || 0,
      maxAttempts: data.maxAttempts || 0,
      shuffleQuestions: Boolean(data.shuffleQuestions),
      shuffleOptions: Boolean(data.shuffleOptions),
      showCorrectAnswers: data.showCorrectAnswers || 'IMMEDIATE',
      createdBy: user?._id || user?.id || null,
    });

    return assessment;
  }

  /**
   * Get an assessment by ID with all its questions
   * @param {Boolean} options.learnerMode - If true, strips out correct answer flags and hidden test cases
   */
  static async getAssessmentById(tenantId, assessmentId, options = {}) {
    const assessment = await Assessment.findOne({ _id: assessmentId, tenantId });
    if (!assessment) {
      throw new NotFoundError('Assessment not found');
    }

    let questions = await AssessmentQuestion.find({ assessmentId, tenantId }).sort({ order: 1 });

    if (options.learnerMode) {
      questions = questions.map((q) => {
        const qObj = q.toObject();
        // Redact correct answer flags from options
        if (qObj.options && Array.isArray(qObj.options)) {
          qObj.options = qObj.options.map((opt) => ({
            id: opt.id,
            text: opt.text,
          }));
        }
        delete qObj.correctAnswers;
        delete qObj.explanation;
        if (qObj.testCases) {
          qObj.testCases = qObj.testCases.filter((tc) => !tc.isHidden);
        }
        return qObj;
      });
    }

    return { assessment, questions };
  }

  /**
   * List assessments with filtering & pagination
   */
  static async listAssessments(tenantId, query = {}, pagination = { page: 1, limit: 20 }) {
    const filter = { tenantId };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.type) {
      filter.type = query.type;
    }
    if (query.courseId) {
      filter.courseId = query.courseId;
    }
    if (query.lessonId) {
      filter.lessonId = query.lessonId;
    }
    if (query.search) {
      filter.title = { $regex: query.search.trim(), $options: 'i' };
    }

    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Assessment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Assessment.countDocuments(filter),
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
   * Update assessment metadata & settings
   */
  static async updateAssessment(tenantId, assessmentId, updateData, user) {
    const assessment = await Assessment.findOne({ _id: assessmentId, tenantId });
    if (!assessment) {
      throw new NotFoundError('Assessment not found');
    }

    const allowed = [
      'title',
      'description',
      'type',
      'status',
      'passingScorePercentage',
      'timeLimitMinutes',
      'maxAttempts',
      'shuffleQuestions',
      'shuffleOptions',
      'showCorrectAnswers',
      'courseId',
      'lessonId',
    ];

    allowed.forEach((field) => {
      if (updateData[field] !== undefined) {
        assessment[field] = updateData[field];
      }
    });

    assessment.updatedBy = user?._id || user?.id || null;
    await assessment.save();
    return assessment;
  }

  /**
   * Publish assessment
   */
  static async publishAssessment(tenantId, assessmentId) {
    const assessment = await Assessment.findOne({ _id: assessmentId, tenantId });
    if (!assessment) {
      throw new NotFoundError('Assessment not found');
    }

    const count = await AssessmentQuestion.countDocuments({ assessmentId, tenantId });
    if (count === 0) {
      throw new BadRequestError('Cannot publish an assessment with zero questions');
    }

    assessment.status = ASSESSMENT_STATUS.PUBLISHED;
    assessment.questionsCount = count;
    await assessment.save();

    return assessment;
  }

  /**
   * Delete assessment and all its questions
   */
  static async deleteAssessment(tenantId, assessmentId) {
    const assessment = await Assessment.findOne({ _id: assessmentId, tenantId });
    if (!assessment) {
      throw new NotFoundError('Assessment not found');
    }

    await Promise.all([
      Assessment.deleteOne({ _id: assessmentId, tenantId }),
      AssessmentQuestion.deleteMany({ assessmentId, tenantId }),
    ]);

    return { success: true, deletedAssessmentId: assessmentId };
  }

  /**
   * Add question to assessment
   */
  static async addQuestion(tenantId, assessmentId, questionData) {
    const assessment = await Assessment.findOne({ _id: assessmentId, tenantId });
    if (!assessment) {
      throw new NotFoundError('Assessment not found');
    }

    if (!questionData.prompt || !questionData.prompt.trim()) {
      throw new BadRequestError('Question prompt is required');
    }

    const highest = await AssessmentQuestion.findOne({ assessmentId, tenantId }).sort({ order: -1 });
    const nextOrder = highest ? highest.order + 1 : 1;

    // Default options for multiple choice if not provided
    let options = questionData.options || [];
    if (
      (questionData.questionType === QUESTION_TYPE.MULTIPLE_CHOICE ||
        questionData.questionType === QUESTION_TYPE.MULTIPLE_SELECT) &&
      options.length === 0
    ) {
      options = [
        { id: 'opt-1', text: 'Option A', isCorrect: true },
        { id: 'opt-2', text: 'Option B', isCorrect: false },
        { id: 'opt-3', text: 'Option C', isCorrect: false },
        { id: 'opt-4', text: 'Option D', isCorrect: false },
      ];
    } else if (questionData.questionType === QUESTION_TYPE.TRUE_FALSE && options.length === 0) {
      options = [
        { id: 'opt-true', text: 'True', isCorrect: true },
        { id: 'opt-false', text: 'False', isCorrect: false },
      ];
    }

    const question = await AssessmentQuestion.create({
      tenantId,
      assessmentId,
      order: nextOrder,
      questionType: questionData.questionType || QUESTION_TYPE.MULTIPLE_CHOICE,
      prompt: questionData.prompt.trim(),
      codeSnippet: questionData.codeSnippet || '',
      codeLanguage: questionData.codeLanguage || 'javascript',
      points: questionData.points || 1,
      options,
      correctAnswers: questionData.correctAnswers || [],
      explanation: questionData.explanation || '',
      testCases: questionData.testCases || [],
      difficulty: questionData.difficulty || 'INTERMEDIATE',
    });

    // Update assessment stats
    const allQuestions = await AssessmentQuestion.find({ assessmentId, tenantId });
    const totalPoints = allQuestions.reduce((sum, q) => sum + (q.points || 1), 0);

    assessment.questionsCount = allQuestions.length;
    assessment.totalPoints = totalPoints;
    await assessment.save();

    return question;
  }

  /**
   * Update individual question
   */
  static async updateQuestion(tenantId, assessmentId, questionId, questionData) {
    const question = await AssessmentQuestion.findOne({ _id: questionId, assessmentId, tenantId });
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    const allowed = [
      'prompt',
      'questionType',
      'codeSnippet',
      'codeLanguage',
      'points',
      'options',
      'correctAnswers',
      'explanation',
      'testCases',
      'difficulty',
    ];

    allowed.forEach((field) => {
      if (questionData[field] !== undefined) {
        question[field] = questionData[field];
      }
    });

    await question.save();

    // Recalculate total points
    const allQuestions = await AssessmentQuestion.find({ assessmentId, tenantId });
    const totalPoints = allQuestions.reduce((sum, q) => sum + (q.points || 1), 0);

    await Assessment.updateOne(
      { _id: assessmentId, tenantId },
      { questionsCount: allQuestions.length, totalPoints }
    );

    return question;
  }

  /**
   * Delete individual question and re-compact order
   */
  static async deleteQuestion(tenantId, assessmentId, questionId) {
    const question = await AssessmentQuestion.findOne({ _id: questionId, assessmentId, tenantId });
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    await AssessmentQuestion.deleteOne({ _id: questionId, assessmentId, tenantId });

    // Compact orders
    const remaining = await AssessmentQuestion.find({ assessmentId, tenantId }).sort({ order: 1 });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].order !== i + 1) {
        remaining[i].order = i + 1;
        await remaining[i].save();
      }
    }

    const totalPoints = remaining.reduce((sum, q) => sum + (q.points || 1), 0);
    await Assessment.updateOne(
      { _id: assessmentId, tenantId },
      { questionsCount: remaining.length, totalPoints }
    );

    return { success: true, deletedQuestionId: questionId, remainingCount: remaining.length };
  }

  /**
   * Reorder questions
   */
  static async reorderQuestions(tenantId, assessmentId, questionIdsOrder) {
    if (!Array.isArray(questionIdsOrder) || questionIdsOrder.length === 0) {
      throw new BadRequestError('questionIdsOrder must be a non-empty array of IDs');
    }

    const updateOps = questionIdsOrder.map((id, index) =>
      AssessmentQuestion.updateOne(
        { _id: id, assessmentId, tenantId },
        { order: index + 1 }
      )
    );

    await Promise.all(updateOps);
    return await AssessmentQuestion.find({ assessmentId, tenantId }).sort({ order: 1 });
  }
}

export default AssessmentService;

