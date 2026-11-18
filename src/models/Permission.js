import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
      enum: [
        'ORGANIZATION',
        'USER',
        'ACADEMY',
        'COURSE',
        'LESSON',
        'AI',
        'VIDEO',
        'ASSESSMENT',
        'CERTIFICATE',
        'ANALYTICS',
        'BILLING',
        'SETTINGS',
        'AUDIT',
      ],
    },
    isSystem: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Permission = mongoose.models.Permission || mongoose.model('Permission', permissionSchema);
export default Permission;

