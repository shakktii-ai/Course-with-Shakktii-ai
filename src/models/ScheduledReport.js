import mongoose from 'mongoose';
import { REPORT_TYPE, REPORT_SCHEDULE, REPORT_FORMAT } from '../constants/index.js';

const scheduledReportSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    academyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Academy',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    reportType: {
      type: String,
      enum: Object.values(REPORT_TYPE),
      required: true,
      index: true,
    },
    schedule: {
      type: String,
      enum: Object.values(REPORT_SCHEDULE),
      default: REPORT_SCHEDULE.WEEKLY,
    },
    format: {
      type: String,
      enum: Object.values(REPORT_FORMAT),
      default: REPORT_FORMAT.CSV,
    },
    recipients: {
      type: [String],
      default: [],
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED'],
      default: 'ACTIVE',
      index: true,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    nextRunAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

scheduledReportSchema.index({ tenantId: 1, status: 1 });
scheduledReportSchema.index({ nextRunAt: 1, status: 1 });

const ScheduledReport =
  mongoose.models.ScheduledReport ||
  mongoose.model('ScheduledReport', scheduledReportSchema);

export default ScheduledReport;
export { ScheduledReport };

