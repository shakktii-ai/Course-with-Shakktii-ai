import mongoose from 'mongoose';

const coursePrerequisiteSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    prerequisiteCourseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    isMandatory: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

coursePrerequisiteSchema.index({ tenantId: 1, courseId: 1, prerequisiteCourseId: 1 }, { unique: true });

const CoursePrerequisite = mongoose.models.CoursePrerequisite || mongoose.model('CoursePrerequisite', coursePrerequisiteSchema);

export default CoursePrerequisite;

