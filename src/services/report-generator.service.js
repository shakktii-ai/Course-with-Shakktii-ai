import ScheduledReport from '../models/ScheduledReport.js';
import GeneratedReport from '../models/GeneratedReport.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import CourseProgress from '../models/CourseProgress.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import AIUsageRecord from '../models/AIUsageRecord.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { BaseService } from './base.service.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';
import { REPORT_TYPE, REPORT_FORMAT, REPORT_SCHEDULE } from '../constants/index.js';

export class ReportGeneratorService extends BaseService {
  constructor() {
    super(GeneratedReport);
  }

  /**
   * Module 08.5: Instant Report Generation (CSV or JSON)
   */
  static async generateReport(tenantId, options = {}) {
    if (!tenantId) throw new BadRequestError('Tenant ID is required');

    const {
      reportType = REPORT_TYPE.LEARNER_PROGRESS,
      format = REPORT_FORMAT.CSV,
      filters = {},
      userId = null,
      title = `${reportType} Report`,
    } = options;

    let rows = [];

    switch (reportType) {
      case REPORT_TYPE.LEARNER_PROGRESS: {
        const enrollments = await Enrollment.find({ tenantId, ...filters })
          .populate('userId', 'name email')
          .populate('courseId', 'title slug')
          .lean();

        rows = await Promise.all(
          enrollments.map(async (enr) => {
            const progress = await CourseProgress.findOne({
              tenantId,
              userId: enr.userId?._id,
              courseId: enr.courseId?._id,
            }).lean();

            return {
              LearnerName: enr.userId?.name || 'Unknown',
              Email: enr.userId?.email || 'N/A',
              CourseTitle: enr.courseId?.title || 'Unknown',
              Status: enr.status,
              PercentComplete: `${progress?.percentComplete || 0}%`,
              CompletedLessons: progress?.completedLessons || 0,
              TotalLessons: progress?.totalLessons || 0,
              EnrolledDate: enr.createdAt ? new Date(enr.createdAt).toISOString() : '',
            };
          })
        );
        break;
      }

      case REPORT_TYPE.COURSE_COMPLETION: {
        const courses = await Course.find({ tenantId, ...filters })
          .populate('instructorId', 'name')
          .lean();

        rows = await Promise.all(
          courses.map(async (course) => {
            const [enrolled, completed] = await Promise.all([
              Enrollment.countDocuments({ tenantId, courseId: course._id }),
              Enrollment.countDocuments({ tenantId, courseId: course._id, status: 'COMPLETED' }),
            ]);

            const rate = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0;

            return {
              CourseTitle: course.title,
              Instructor: course.instructorId?.name || 'Unassigned',
              TotalEnrolled: enrolled,
              CompletedStudents: completed,
              CompletionRate: `${rate}%`,
              Status: course.status,
              PublishedDate: course.publishedAt ? new Date(course.publishedAt).toISOString() : 'Draft',
            };
          })
        );
        break;
      }

      case REPORT_TYPE.ASSESSMENT_RESULTS: {
        const attempts = await AssessmentAttempt.find({ tenantId, ...filters })
          .populate('userId', 'name email')
          .populate('assessmentId', 'title')
          .sort({ createdAt: -1 })
          .limit(500)
          .lean();

        rows = attempts.map((att) => ({
          LearnerName: att.userId?.name || 'Unknown',
          Email: att.userId?.email || 'N/A',
          AssessmentTitle: att.assessmentId?.title || 'Assessment',
          ScorePercentage: `${att.scorePercentage || 0}%`,
          Passed: att.passed ? 'YES' : 'NO',
          AttemptNumber: att.attemptNumber || 1,
          SubmittedAt: att.createdAt ? new Date(att.createdAt).toISOString() : '',
        }));
        break;
      }

      case REPORT_TYPE.AI_USAGE: {
        const usages = await AIUsageRecord.find({ tenantId, ...filters })
          .populate('userId', 'name')
          .sort({ createdAt: -1 })
          .limit(500)
          .lean();

        rows = usages.map((u) => ({
          UserName: u.userId?.name || 'System',
          TaskType: u.taskType,
          Provider: u.provider,
          Model: u.model || 'default',
          InputTokens: u.inputTokens || 0,
          OutputTokens: u.outputTokens || 0,
          TotalTokens: u.totalTokens || 0,
          Timestamp: u.createdAt ? new Date(u.createdAt).toISOString() : '',
        }));
        break;
      }

      case REPORT_TYPE.AUDIT_LOGS: {
        const logs = await AuditLog.find({ tenantId, ...filters })
          .populate('userId', 'name email')
          .sort({ createdAt: -1 })
          .limit(500)
          .lean();

        rows = logs.map((log) => ({
          Action: log.action,
          UserName: log.userId?.name || 'System',
          IPAddress: log.ipAddress || 'Internal',
          Resource: log.resourceType || '',
          Status: log.status || 'SUCCESS',
          Timestamp: log.createdAt ? new Date(log.createdAt).toISOString() : '',
        }));
        break;
      }

      default:
        throw new BadRequestError(`Unsupported report type: ${reportType}`);
    }

    // Format output
    let outputContent = '';
    if (format === REPORT_FORMAT.CSV) {
      outputContent = this.formatAsCsv(rows);
    } else {
      outputContent = JSON.stringify(rows, null, 2);
    }

    // Persist GeneratedReport
    const generated = await GeneratedReport.create({
      tenantId,
      createdBy: userId,
      title,
      reportType,
      format,
      recordCount: rows.length,
      data: outputContent,
      fileSize: Buffer.byteLength(outputContent, 'utf8'),
      status: 'COMPLETED',
    });

    return {
      reportId: generated._id,
      title: generated.title,
      reportType,
      format,
      recordCount: rows.length,
      content: outputContent,
      fileSize: generated.fileSize,
      createdAt: generated.createdAt,
    };
  }

  /**
   * RFC 4180 CSV Formatter with escaping
   */
  static formatAsCsv(rows = []) {
    if (rows.length === 0) return 'No records found\n';

    const headers = Object.keys(rows[0]);
    const headerLine = headers.join(',');

    const lines = rows.map((row) =>
      headers
        .map((header) => {
          const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        })
        .join(',')
    );

    return [headerLine, ...lines].join('\n');
  }

  /**
   * Module 08.5: Schedule a Recurring Report
   */
  static async createScheduledReport(tenantId, userId, data = {}) {
    if (!data.title || !data.reportType) {
      throw new BadRequestError('Title and reportType are required');
    }

    const schedule = data.schedule || REPORT_SCHEDULE.WEEKLY;
    const nextRun = new Date();
    if (schedule === REPORT_SCHEDULE.DAILY) nextRun.setDate(nextRun.getDate() + 1);
    else if (schedule === REPORT_SCHEDULE.WEEKLY) nextRun.setDate(nextRun.getDate() + 7);
    else nextRun.setDate(nextRun.getDate() + 30);

    const scheduled = await ScheduledReport.create({
      tenantId,
      createdBy: userId,
      title: data.title.trim(),
      reportType: data.reportType,
      schedule,
      format: data.format || REPORT_FORMAT.CSV,
      recipients: data.recipients || [],
      filters: data.filters || {},
      nextRunAt: nextRun,
    });

    return scheduled;
  }

  /**
   * List scheduled reports for tenant
   */
  static async listScheduledReports(tenantId) {
    const list = await ScheduledReport.find({ tenantId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .lean();
    return list;
  }

  /**
   * Delete scheduled report
   */
  static async deleteScheduledReport(tenantId, reportId) {
    const deleted = await ScheduledReport.findOneAndDelete({ _id: reportId, tenantId });
    if (!deleted) throw new NotFoundError('Scheduled report not found');
    return deleted;
  }

  /**
   * Execute scheduled report now
   */
  static async executeScheduledReport(tenantId, reportId) {
    const scheduled = await ScheduledReport.findOne({ _id: reportId, tenantId });
    if (!scheduled) throw new NotFoundError('Scheduled report not found');

    const generated = await this.generateReport(tenantId, {
      reportType: scheduled.reportType,
      format: scheduled.format,
      filters: scheduled.filters,
      title: `${scheduled.title} (Scheduled)`,
    });

    // Compute next run
    const nextRun = new Date();
    if (scheduled.schedule === REPORT_SCHEDULE.DAILY) nextRun.setDate(nextRun.getDate() + 1);
    else if (scheduled.schedule === REPORT_SCHEDULE.WEEKLY) nextRun.setDate(nextRun.getDate() + 7);
    else nextRun.setDate(nextRun.getDate() + 30);

    scheduled.lastRunAt = new Date();
    scheduled.nextRunAt = nextRun;
    await scheduled.save();

    return {
      scheduledReport: scheduled,
      generatedReport: generated,
    };
  }
}

export default ReportGeneratorService;

