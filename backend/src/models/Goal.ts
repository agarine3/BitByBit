import mongoose, { Schema, Document } from 'mongoose';

export interface IGoal extends Document {
  title: string;
  description: string;
  currentLevel: string;
  specificAreas: string[];
  dailyTime: number;
  startDate: Date;
  endDate: Date;
  tasks: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
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
  currentLevel: {
    type: String,
    required: true
  },
  specificAreas: {
    type: [String],
    required: true,
    default: []
  },
  dailyTime: {
    type: Number,
    required: true,
    min: 15,
    max: 240
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
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