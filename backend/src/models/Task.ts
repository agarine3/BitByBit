import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  estimatedTime: number;
  status: 'pending' | 'completed' | 'skipped';
  dueDate: Date;
  completedAt?: Date;
  goalId: mongoose.Types.ObjectId;
  successCriteria: string[];
  prerequisites: string[];
  notes?: string;
  dailyFocus: string;
  resources?: string[];
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    estimatedTime: {
      type: Number,
      required: true,
      default: 60, // Default to 60 minutes (1 hour)
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'skipped'],
      default: 'pending',
    },
    dueDate: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
    },
    goalId: {
      type: Schema.Types.ObjectId,
      ref: 'Goal',
      required: true,
    },
    successCriteria: {
      type: [String],
      required: true,
      default: [],
    },
    prerequisites: {
      type: [String],
      required: true,
      default: [],
    },
    notes: {
      type: String,
    },
    dailyFocus: {
      type: String,
      required: true,
      description: 'The specific topic or concept to focus on for this daily task',
    },
    resources: {
      type: [String],
      description: 'Links to relevant resources, articles, or practice problems',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITask>('Task', TaskSchema); 