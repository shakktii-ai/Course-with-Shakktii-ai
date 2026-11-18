/**
 * AI Academy - Student Autonomous Course & Quiz Auto-Generator API
 * POST /api/v1/learn/auto-generate
 *
 * Fully autonomous pipeline: Student uploads a document or provides a topic.
 * The system automatically extracts knowledge, generates curriculum,
 * creates modular lessons, auto-publishes, builds quizzes, and auto-enrolls the student.
 * Completely replaces manual instructor portal workflows.
 */

import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { AICourseGeneratorService } from '@/services/ai-course-generator.service';
import { TenantService } from '@/services/tenant.service';
import { HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

const autoPilotSchema = {
  title: { type: 'string', required: true, minLength: 2, maxLength: 200 },
  documentContent: { type: 'string' },
  documentName: { type: 'string' },
  difficulty: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], default: 'INTERMEDIATE' },
  numModules: { type: 'any' },
  numLessons: { type: 'any' },
  targetAudience: { type: 'string' },
};

export async function POST(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, autoPilotSchema, { throwOnError: true });

    const result = await AICourseGeneratorService.autoPilotStudentCourse(
      tenantId,
      sanitized,
      user._id
    );

    return successResponse(result, result.message, HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'StudentAutoPilotCourse');
  }
}

