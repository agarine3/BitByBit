import { gql } from 'graphql-tag';
import { IGoal } from '../models/Goal';
import { ITask } from '../models/Task';
import { generateDailyTasks } from '../services/taskGenerator';
import { Model } from 'mongoose';

// Get the Mongoose models
const Goal = require('../models/Goal').default;
const Task = require('../models/Task').default;

// Define types for resolver parameters
interface GoalInput {
  title: string;
  description: string;
  currentLevel: string;
  specificAreas: string[];
  dailyTime: number;
  startDate: string;
  endDate: string;
}

interface UpdateGoalInput extends Partial<GoalInput> {
  id: string;
}

export const typeDefs = gql`
  type Task {
    id: ID!
    title: String!
    description: String
    estimatedTime: Int
    status: String!
    dueDate: String!
    completedAt: String
    goalId: ID!
    successCriteria: [String]
    prerequisites: [String]
    notes: String
    dailyFocus: String
    resources: [String]
  }

  type Goal {
    id: ID!
    title: String!
    description: String!
    currentLevel: String!
    specificAreas: [String]!
    dailyTime: Int!
    startDate: String!
    endDate: String!
    tasks: [Task]
  }

  type Query {
    goals: [Goal]
    goal(id: ID!): Goal
    tasks(goalId: ID!): [Task]
    recentTasks: [Task]
    tasksByDate(date: String!): [Task]
  }

  type Mutation {
    createGoal(
      title: String!
      description: String!
      currentLevel: String!
      specificAreas: [String]!
      dailyTime: Int!
      startDate: String!
      endDate: String!
    ): Goal
    
    updateGoal(
      id: ID!
      title: String
      description: String
      currentLevel: String
      specificAreas: [String]
      dailyTime: Int
      startDate: String
      endDate: String
    ): Goal
    
    deleteGoal(id: ID!): Boolean
    
    updateTaskStatus(
      taskId: ID!
      status: String!
    ): Task
    
    generateTasks(goalId: ID!): Goal
  }
`;

export const resolvers = {
  Query: {
    goals: async () => {
      return await Goal.find().populate('tasks');
    },
    goal: async (_: unknown, { id }: { id: string }) => {
      return await Goal.findById(id).populate('tasks');
    },
    tasks: async (_: unknown, { goalId }: { goalId: string }) => {
      return await Task.find({ goalId }).sort({ dueDate: 1 });
    },
    recentTasks: async () => {
      return await Task.find().sort({ date: 1 }).limit(10);
    },
    tasksByDate: async (_: unknown, { date }: { date: string }) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      return await Task.find({
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }).sort({ order: 1 });
    },
  },
  
  Mutation: {
    createGoal: async (_: unknown, goalData: GoalInput) => {
      const goal = new Goal(goalData);
      await goal.save();
      
      try {
        const tasks = await generateDailyTasks(goal);
        return await Goal.findById(goal._id).populate('tasks');
      } catch (error) {
        console.error('AI task generation failed:', error);
        return goal;
      }
    },
    
    updateGoal: async (_: unknown, { id, ...updates }: UpdateGoalInput) => {
      return await Goal.findByIdAndUpdate(id, updates, { new: true }).populate('tasks');
    },
    
    deleteGoal: async (_: unknown, { id }: { id: string }) => {
      const goal = await Goal.findById(id);
      if (!goal) return false;
      
      await Task.deleteMany({ goalId: goal._id });
      await goal.deleteOne();
      return true;
    },
    
    updateTaskStatus: async (_: unknown, { taskId, status }: { taskId: string; status: string }) => {
      const task = await Task.findById(taskId);
      if (!task) throw new Error('Task not found');
      
      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date().toISOString();
      } else {
        task.completedAt = undefined;
      }
      
      await task.save();
      return task;
    },
    
    generateTasks: async (_: unknown, { goalId }: { goalId: string }) => {
      const goal = await Goal.findById(goalId);
      if (!goal) throw new Error('Goal not found');
      
      await Task.deleteMany({ goalId: goal._id });
      await generateDailyTasks(goal);
      
      return await Goal.findById(goalId).populate('tasks');
    },
  },
}; 