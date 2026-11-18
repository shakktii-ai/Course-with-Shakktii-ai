import mongoose from 'mongoose';
import { REPORT_TYPE, REPORT_FORMAT } from '../constants/index.js';

const generatedReportSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    scheduledReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScheduledReport',
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    reportType: {
      type: String,
      enum: Object.values(REPORT_TYPE),
      required: true,
      index: true,
    },
    format: {
      type: String,
      enum: Object.values(REPORT_FORMAT),
      default: REPORT_FORMAT.CSV,
    },
    recordCount: {
      type: Number,
      default: 0,
    },
    data: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'FAILED'],
      default: 'COMPLETED',
    },
  },
  {
    timestamps: true,
  }
);

generatedReportSchema.index({ tenantId: 1, createdAt: -1 });

const GeneratedReport =
  mongoose.models.GeneratedReport ||
  mongoose.model('GeneratedReport', generatedReportSchema);

export default GeneratedReport;
export { GeneratedReport };

