import mongoose from 'mongoose';
import { CERTIFICATE_STATUS } from '../constants/index.js';

const certificateSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    courseTitle: {
      type: String,
      required: true,
      trim: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    gradeScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    skillsLearned: [
      {
        type: String,
        trim: true,
      },
    ],
    issueDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(CERTIFICATE_STATUS),
      default: CERTIFICATE_STATUS.ISSUED,
      index: true,
    },
    revocationReason: {
      type: String,
      default: '',
      trim: true,
    },
    qrCodeData: {
      type: String,
      default: '',
    },
    pdfUrl: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

certificateSchema.index({ tenantId: 1, userId: 1, courseId: 1 });
certificateSchema.index({ tenantId: 1, status: 1 });

const Certificate =
  mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);

export default Certificate;
export { Certificate };
