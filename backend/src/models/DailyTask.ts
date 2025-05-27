import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyTask extends Document {
  goalId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'pending' | 'completed' | 'skipped';
  dueDate: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DailyTaskSchema = new Schema({
  goalId: { type: Schema.Types.ObjectId, ref: 'Goal', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  estimatedTime: { type: Number, required: true }, // in minutes
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'skipped'], default: 'pending' },
  dueDate: { type: Date, required: true },
  completedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model<IDailyTask>('DailyTask', DailyTaskSchema); 