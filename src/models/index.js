export { Permission } from './Permission.js';
export { Role } from './Role.js';
export { PlatformUser } from './PlatformUser.js';
export { User } from './User.js';
export { UserRole } from './UserRole.js';
export { Session } from './Session.js';
export { PasswordResetToken } from './PasswordResetToken.js';
export { EmailVerificationToken } from './EmailVerificationToken.js';
export { AuditLog } from './AuditLog.js';

// Phase 02 Multi-tenant Models
export { Organization } from './Organization.js';
export { Academy } from './Academy.js';
export { OrganizationMembership } from './OrganizationMembership.js';
export { Department } from './Department.js';
export { Group } from './Group.js';
export { Invitation } from './Invitation.js';
export { AcademySettings } from './AcademySettings.js';
export { DomainMapping } from './DomainMapping.js';
export { OrganizationAuditLog } from './OrganizationAuditLog.js';

// Phase 03 LMS Models
export { default as CourseCategory } from './CourseCategory.js';
export { Course } from './Course.js';
export { Module } from './Module.js';
export { Lesson } from './Lesson.js';
export { LessonBlock } from './LessonBlock.js';
export { default as CourseVersion } from './CourseVersion.js';
export { default as Enrollment } from './Enrollment.js';
export { default as LessonProgress } from './LessonProgress.js';
export { default as CourseProgress } from './CourseProgress.js';
export { default as LearningPath } from './LearningPath.js';
export { default as Bookmark } from './Bookmark.js';
export { default as LearnerNote } from './LearnerNote.js';
export { default as CoursePrerequisite } from './CoursePrerequisite.js';

// Phase 04 AI Course Studio & Source Models
export { default as SourceDocument } from './SourceDocument.js';
export { default as SourceDocumentVersion } from './SourceDocumentVersion.js';
export { default as DocumentChunk } from './DocumentChunk.js';
export { default as SourceReference } from './SourceReference.js';
export { default as DocumentProcessingJob } from './DocumentProcessingJob.js';
export { default as AIGenerationJob } from './AIGenerationJob.js';
export { default as AIGenerationVersion } from './AIGenerationVersion.js';
export { default as AIReview } from './AIReview.js';
export { default as AIReviewComment } from './AIReviewComment.js';
export { default as AIProviderConfiguration } from './AIProviderConfiguration.js';
export { default as AIUsageRecord } from './AIUsageRecord.js';
export { default as CourseSourceMapping } from './CourseSourceMapping.js';

// Phase 05 Video Studio & Media Pipeline Models
export { VideoProject } from './VideoProject.js';
export { VideoScene } from './VideoScene.js';
export { VoiceProfile } from './VoiceProfile.js';
export { VideoRenderingJob } from './VideoRenderingJob.js';
export { MediaAsset } from './MediaAsset.js';
export { VideoClipBreakdown } from './VideoClipBreakdown.js';

// Phase 06 Assessments, Quizzes & Certification Models
export { Assessment } from './Assessment.js';
export { AssessmentQuestion } from './AssessmentQuestion.js';
export { AssessmentAttempt } from './AssessmentAttempt.js';
export { Certificate } from './Certificate.js';

// Phase 07 AI Tutor & Interactive Learning Companion Models
export { TutorConversation } from './TutorConversation.js';
export { TutorMessage } from './TutorMessage.js';
export { TutorFeedback } from './TutorFeedback.js';
export { TutorConfusionTopic } from './TutorConfusionTopic.js';
export { LearnerKnowledgeProfile } from './LearnerKnowledgeProfile.js';

// Phase 08 Analytics, Reporting & Platform Administration Models
export { OrganizationSubscription } from './OrganizationSubscription.js';
export { ScheduledReport } from './ScheduledReport.js';
export { GeneratedReport } from './GeneratedReport.js';
export { PlatformMetricSnapshot } from './PlatformMetricSnapshot.js';
