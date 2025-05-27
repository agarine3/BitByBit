import mongoose, { Schema, Document } from 'mongoose';

export interface IGoal extends Document {
  title: string;
  description: string;
  dailyTime: number;
  dailyTimeAvailable?: number;
  startDate: Date;
  endDate: Date;
  difficulty: string;
  progress: number;
  tasks: mongoose.Types.ObjectId[];
}

const GoalSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  dailyTime: {
    type: Number,
    required: true,
    min: 1,
    alias: 'dailyTimeAvailable'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tasks: [{
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

GoalSchema.virtual('dailyTimeAvailable').get(function() {
  return this.dailyTime;
});

export default mongoose.model<IGoal>('Goal', GoalSchema); 