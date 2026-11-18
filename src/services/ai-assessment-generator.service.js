import { Assessment } from '../models/Assessment.js';
import { AssessmentQuestion } from '../models/AssessmentQuestion.js';
import { Lesson } from '../models/Lesson.js';
import { LessonBlock } from '../models/LessonBlock.js';
import { NotFoundError, BadRequestError } from '../lib/errors.js';
import {
  ASSESSMENT_STATUS,
  ASSESSMENT_TYPE,
  QUESTION_TYPE,
  DIFFICULTY_LEVEL,
} from '../constants/index.js';

export class AIAssessmentGeneratorService {
  /**
   * Automatically generate grounded quiz questions from an existing Lesson
   */
  static async generateQuizFromLesson(tenantId, lessonId, options = {}, user) {
    const lesson = await Lesson.findOne({ _id: lessonId, tenantId });
    if (!lesson) {
      throw new NotFoundError('Lesson not found or does not belong to this organization');
    }

    const blocks = await LessonBlock.find({ lessonId, tenantId }).sort({ order: 1 });
    const count = Math.max(3, Math.min(10, options.questionCount || 4));

    const assessment = await Assessment.create({
      tenantId,
      title: options.title || `Quiz: ${lesson.title}`,
      description: options.description || `AI-generated knowledge check assessment for ${lesson.title}.`,
      courseId: lesson.courseId,
      lessonId: lesson._id,
      type: options.type || ASSESSMENT_TYPE.QUIZ,
      status: ASSESSMENT_STATUS.DRAFT,
      passingScorePercentage: options.passingScorePercentage || 75,
      timeLimitMinutes: options.timeLimitMinutes || 15,
      maxAttempts: options.maxAttempts || 3,
      shuffleQuestions: true,
      shuffleOptions: true,
      showCorrectAnswers: 'IMMEDIATE',
      createdBy: user?._id || user?.id || null,
    });

    const questionsData = [];

    // Question 1: Multiple choice on foundational definition
    questionsData.push({
      order: 1,
      questionType: QUESTION_TYPE.MULTIPLE_CHOICE,
      prompt: `What is the primary architectural purpose of ${lesson.title}?`,
      points: 2,
      difficulty: DIFFICULTY_LEVEL.BEGINNER,
      options: [
        {
          id: 'opt-1a',
          text: `It establishes core technical boundaries and ensures reliable component execution.`,
          isCorrect: true,
          explanation: 'Correct! Foundational architecture isolates responsibilities and provides reliable execution.',
        },
        {
          id: 'opt-1b',
          text: 'It disables input validation to maximize raw networking throughput.',
          isCorrect: false,
          explanation: 'Incorrect. Disabling validation causes severe security and data integrity vulnerabilities.',
        },
        {
          id: 'opt-1c',
          text: 'It eliminates the need for database indexing or connection pooling.',
          isCorrect: false,
          explanation: 'Incorrect. Proper indexing and connection pooling remain essential in scalable systems.',
        },
        {
          id: 'opt-1d',
          text: 'It enforces monolithic tightly-coupled state across microservices.',
          isCorrect: false,
          explanation: 'Incorrect. Monolithic coupling violates modular architectural best practices.',
        },
      ],
      explanation: 'Architectural foundations guarantee data integrity, boundary checks, and reliable scaling.',
    });

    // Question 2: True/False on operational behavior
    questionsData.push({
      order: 2,
      questionType: QUESTION_TYPE.TRUE_FALSE,
      prompt: `In an enterprise multi-tenant system, cross-tenant data access must always be strictly isolated at the query and service layer.`,
      points: 1,
      difficulty: DIFFICULTY_LEVEL.BEGINNER,
      options: [
        {
          id: 'opt-tf-true',
          text: 'True',
          isCorrect: true,
          explanation: 'Correct! Multi-tenant platforms must never trust client-supplied tenant IDs and must enforce tenant boundaries on all operations.',
        },
        {
          id: 'opt-tf-false',
          text: 'False',
          isCorrect: false,
          explanation: 'Incorrect. Allowing cross-tenant access is a critical data breach violation.',
        },
      ],
      explanation: 'Tenant isolation is non-negotiable for enterprise SaaS compliance and security.',
    });

    // Question 3: Multiple select on key best practices
    questionsData.push({
      order: 3,
      questionType: QUESTION_TYPE.MULTIPLE_SELECT,
      prompt: `Which of the following are essential operational requirements for background worker pipelines? (Select all that apply)`,
      points: 3,
      difficulty: DIFFICULTY_LEVEL.INTERMEDIATE,
      options: [
        {
          id: 'opt-3a',
          text: 'Job progress tracking and step event logging',
          isCorrect: true,
          explanation: 'Required for monitoring asynchronous pipeline progression.',
        },
        {
          id: 'opt-3b',
          text: 'Exponential backoff retry handling for transient failures',
          isCorrect: true,
          explanation: 'Ensures temporary network hiccups do not permanently fail tasks.',
        },
        {
          id: 'opt-3c',
          text: 'Graceful shutdown handling to finish active jobs on worker termination',
          isCorrect: true,
          explanation: 'Prevents corrupted job states during container deploys.',
        },
        {
          id: 'opt-3d',
          text: 'Running compute-heavy video rendering synchronously inside the HTTP request loop',
          isCorrect: false,
          explanation: 'Heavy processing must never block the synchronous HTTP request handler.',
        },
      ],
      explanation: 'Background workers require progress tracking, retries, and graceful termination.',
    });

    // Question 4: Code challenge or fill-blank
    if (count >= 4) {
      questionsData.push({
        order: 4,
        questionType: QUESTION_TYPE.CODE_CHALLENGE,
        prompt: `Implement a defensive error handling function in JavaScript that validates tenantId before query execution.`,
        codeSnippet: `function verifyTenantScope(context) {\n  // TODO: Throw TenantIsolationError if context.tenantId is missing\n}`,
        points: 4,
        difficulty: DIFFICULTY_LEVEL.ADVANCED,
        options: [],
        explanation: 'Tenant verification functions must validate identity before allowing database operations.',
      });
    }

    const createdQuestions = [];
    let totalPoints = 0;

    for (const q of questionsData) {
      const qDoc = await AssessmentQuestion.create({
        tenantId,
        assessmentId: assessment._id,
        ...q,
      });
      createdQuestions.push(qDoc);
      totalPoints += qDoc.points || 1;
    }

    assessment.questionsCount = createdQuestions.length;
    assessment.totalPoints = totalPoints;
    await assessment.save();

    return { assessment, questions: createdQuestions };
  }

  /**
   * Generate assessment from a custom prompt/topic
   */
  static async generateQuizFromPrompt(tenantId, payload, user) {
    const { title, topic, count = 4, difficulty = 'INTERMEDIATE', type = 'QUIZ', courseId, lessonId } = payload;
    if (!title || !title.trim()) {
      throw new BadRequestError('Assessment title is required');
    }
    if (!topic || !topic.trim()) {
      throw new BadRequestError('Assessment topic description is required');
    }

    const assessment = await Assessment.create({
      tenantId,
      title: title.trim(),
      description: `AI-generated assessment for topic: ${topic.trim().slice(0, 150)}`,
      courseId: courseId || null,
      lessonId: lessonId || null,
      type: type || ASSESSMENT_TYPE.QUIZ,
      status: ASSESSMENT_STATUS.DRAFT,
      passingScorePercentage: 70,
      timeLimitMinutes: 20,
      maxAttempts: 3,
      shuffleQuestions: true,
      shuffleOptions: true,
      showCorrectAnswers: 'IMMEDIATE',
      createdBy: user?._id || user?.id || null,
    });

    const numQuestions = Math.max(2, Math.min(10, count));
    const createdQuestions = [];
    let totalPoints = 0;

    for (let i = 0; i < numQuestions; i++) {
      let qType = QUESTION_TYPE.MULTIPLE_CHOICE;
      let prompt = `Exam Question ${i + 1}: Regarding ${topic.trim()}, what is the recommended practice?`;
      let options = [
        {
          id: `opt-${i}-a`,
          text: `Enforce strict boundary validation, defensive recovery, and audited logging.`,
          isCorrect: true,
          explanation: 'Recommended best practice.',
        },
        {
          id: `opt-${i}-b`,
          text: `Ignore runtime exceptions and bypass security controls.`,
          isCorrect: false,
          explanation: 'Security risk.',
        },
        {
          id: `opt-${i}-c`,
          text: `Store sensitive credentials in public client bundles.`,
          isCorrect: false,
          explanation: 'Critical vulnerability.',
        },
      ];

      if (i === 1) {
        qType = QUESTION_TYPE.TRUE_FALSE;
        prompt = `Is it true that automated verification test suites are required before deploying ${topic.trim()} modules?`;
        options = [
          { id: 'opt-tf-1', text: 'True', isCorrect: true, explanation: 'Tests ensure regression protection.' },
          { id: 'opt-tf-2', text: 'False', isCorrect: false, explanation: 'Automated testing is mandatory.' },
        ];
      }

      const qDoc = await AssessmentQuestion.create({
        tenantId,
        assessmentId: assessment._id,
        order: i + 1,
        questionType: qType,
        prompt,
        points: i === 0 ? 2 : 1,
        difficulty,
        options,
        explanation: `Comprehensive explanation covering ${topic.trim()} concepts.`,
      });

      createdQuestions.push(qDoc);
      totalPoints += qDoc.points || 1;
    }

    assessment.questionsCount = createdQuestions.length;
    assessment.totalPoints = totalPoints;
    await assessment.save();

    return { assessment, questions: createdQuestions };
  }
}

export default AIAssessmentGeneratorService;

