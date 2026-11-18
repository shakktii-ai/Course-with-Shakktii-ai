import mongoose from 'mongoose';
import { QUESTION_TYPE, DIFFICULTY_LEVEL } from '../constants/index.js';

const assessmentQuestionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      default: 1,
    },
    questionType: {
      type: String,
      enum: Object.values(QUESTION_TYPE),
      default: QUESTION_TYPE.MULTIPLE_CHOICE,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      default: '',
      trim: true,
    },
    codeSnippet: {
      type: String,
      default: '',
    },
    codeLanguage: {
      type: String,
      default: 'javascript',
    },
    points: {
      type: Number,
      default: 1,
      min: 1,
    },
    options: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
        isCorrect: { type: Boolean, default: false },
        explanation: { type: String, default: '' },
      },
    ],
    correctAnswers: [
      {
        type: String,
        trim: true,
      },
    ],
    explanation: {
      type: String,
      default: '',
    },
    testCases: [
      {
        input: { type: String, default: '' },
        expectedOutput: { type: String, default: '' },
        isHidden: { type: Boolean, default: false },
      },
    ],
    difficulty: {
      type: String,
      enum: Object.values(DIFFICULTY_LEVEL),
      default: DIFFICULTY_LEVEL.INTERMEDIATE,
    },
  },
  {
    timestamps: true,
  }
);

assessmentQuestionSchema.index({ tenantId: 1, assessmentId: 1, order: 1 });

const AssessmentQuestion =
  mongoose.models.AssessmentQuestion ||
  mongoose.model('AssessmentQuestion', assessmentQuestionSchema);

export default AssessmentQuestion;
export { AssessmentQuestion };

