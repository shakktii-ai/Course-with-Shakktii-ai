/**
 * AI Academy - Learner Notes API
 * GET /api/v1/learn/notes
 * POST /api/v1/learn/notes
 * DELETE /api/v1/learn/notes
 */
import { successResponse, handleApiError } from '@/lib/response';
import { validate } from '@/lib/validation';
import { authenticateRequest } from '@/lib/auth-guard';
import { LearnerFeaturesService } from '@/services/learner-features.service';
import { TenantService } from '@/services/tenant.service';
import { HTTP_STATUS } from '@/constants';

export const dynamic = 'force-dynamic';

const noteSchema = {
  courseId: { type: 'string', required: true },
  lessonId: { type: 'string', required: true },
  content: { type: 'string', required: true, maxLength: 5000 },
  videoTimestamp: { type: 'number' },
};

export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const lessonId = searchParams.get('lessonId');

    const notes = await LearnerFeaturesService.getNotes(tenantId, user._id, courseId, lessonId);
    return successResponse(notes, 'Notes retrieved successfully');
  } catch (error) {
    return handleApiError(error, 'GetNotes');
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const body = await request.json().catch(() => ({}));
    const { sanitized } = validate(body, noteSchema, { throwOnError: true });

    const note = await LearnerFeaturesService.createNote(
      tenantId,
      user._id,
      sanitized.courseId,
      sanitized.lessonId,
      sanitized.content,
      sanitized.videoTimestamp
    );

    return successResponse(note, 'Note saved', HTTP_STATUS.CREATED);
  } catch (error) {
    return handleApiError(error, 'CreateNote');
  }
}

export async function DELETE(request) {
  try {
    const user = await authenticateRequest(request);
    const tenantId = await TenantService.resolveTenant(request, user);

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    const result = await LearnerFeaturesService.deleteNote(tenantId, user._id, noteId);
    return successResponse(result, 'Note deleted');
  } catch (error) {
    return handleApiError(error, 'DeleteNote');
  }
}

