/**
 * AI Academy - Complete Lesson API
 * POST /api/v1/lessons/[id]/complete
 */
import { successResponse, handleApiError } from '@/lib/response';
import { authenticateRequest } from '@/lib/auth-guard';
import { ProgressService } from '@/services/progress.service';
import { TenantService } from '@/services/tenant.service';
import Lesson from '@/models/Lesson';
import { NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);
    const { id } = await params;

    const lesson = await Lesson.findOne({ _id: id, tenantId });
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    const body = await request.json().catch(() => ({}));
    const timeSpentSeconds = parseInt(body.timeSpentSeconds || 0, 10);

    const result = await ProgressService.markLessonComplete(
      tenantId,
      user._id,
      lesson.courseId,
      id,
      timeSpentSeconds
    );

    return successResponse(result, 'Lesson progress updated successfully');
  } catch (error) {
    return handleApiError(error, 'CompleteLesson');
  }
}

