import express from 'express';
import Goal from '../models/Goal';
import { generateTasks } from '../services/ai';
import { generateDailyTasks } from '../services/taskGenerator';
import DailyTask from '../models/DailyTask';
import { Request, Response } from 'express';
import Task from '../models/Task';
import mongoose from 'mongoose';

const router = express.Router();

// Get all goals
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all goals...');
    const goals = await Goal.find()
      .populate({
        path: 'tasks',
        model: 'Task',
        options: { sort: { dueDate: 1 } }
      })
      .sort({ createdAt: -1 });
    console.log(`Found ${goals.length} goals`);
    res.json(goals);
  } catch (error) {
    console.error('Error in GET /goals:', error);
    res.status(500).json({ 
      message: 'Error fetching goals', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a new goal
router.post('/', async (req, res) => {
  try {
    console.log('Received goal data:', req.body);
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'dailyTime', 'startDate', 'endDate', 'difficulty'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({ 
        message: 'Missing required fields', 
        missingFields 
      });
    }

    // Create the goal
    const goal = new Goal({
      title: req.body.title,
      description: req.body.description,
      dailyTime: req.body.dailyTime,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      difficulty: req.body.difficulty,
      progress: 0,
      tasks: []
    });

    await goal.save();
    console.log('Goal saved successfully:', goal._id);

    // Generate daily tasks using GPT
    try {
      console.log('Generating daily tasks for goal:', goal._id);
      const tasks = await generateDailyTasks(goal);
      console.log('Generated tasks:', tasks);
      
      // Populate tasks before sending response
      const populatedGoal = await Goal.findById(goal._id).populate('tasks');
      if (!populatedGoal) {
        throw new Error('Failed to find populated goal');
      }
      
      res.status(201).json({
        ...populatedGoal.toObject(),
        message: 'Goal created successfully with daily tasks.'
      });
    } catch (aiError) {
      console.error('AI task generation failed:', aiError);
      res.status(201).json({
        ...goal.toObject(),
        message: 'Goal created successfully, but task generation failed.'
      });
    }
  } catch (error) {
    console.error('Error creating goal:', error);
    if (error instanceof Error) {
      res.status(400).json({ 
        message: 'Error creating goal', 
        error: error.message 
      });
    } else {
      res.status(400).json({ 
        message: 'Error creating goal', 
        error: 'Unknown error occurred' 
      });
    }
  }
});

// Update a goal
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating goal:', req.params.id);
    const goal = await Goal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!goal) {
      console.log('Goal not found:', req.params.id);
      return res.status(404).json({ message: 'Goal not found' });
    }
    console.log('Goal updated successfully:', goal._id);
    res.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(400).json({ 
      message: 'Error updating goal', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a goal
router.delete('/:id', async (req, res) => {
  try {
    console.log('Deleting goal:', req.params.id);
    const goal = await Goal.findByIdAndDelete(req.params.id);
    if (!goal) {
      console.log('Goal not found:', req.params.id);
      return res.status(404).json({ message: 'Goal not found' });
    }
    console.log('Goal deleted successfully:', req.params.id);
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(400).json({ 
      message: 'Error deleting goal', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate daily tasks for a goal
router.post('/:id/generate-tasks', async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const tasks = await generateDailyTasks(goal);
    res.json(tasks);
  } catch (error) {
    console.error('Error generating tasks:', error);
    res.status(500).json({ message: 'Failed to generate tasks' });
  }
});

// Get daily tasks for a goal
router.get('/:id/tasks', async (req, res) => {
  try {
    const tasks = await DailyTask.find({ goalId: req.params.id })
      .sort({ dueDate: 1 });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// Update task status
router.patch('/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!status || !['completed', 'skipped'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be either "completed" or "skipped"' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
    }

    await task.save();
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Generate tasks for existing goals
router.post('/generate-tasks', async (req, res) => {
  try {
    console.log('Starting task generation for existing goals...');
    const goals = await Goal.find({});
    console.log(`Found ${goals.length} total goals`);
    
    const goalsWithoutTasks = goals.filter(goal => !goal.tasks || goal.tasks.length === 0);
    console.log(`Found ${goalsWithoutTasks.length} goals without tasks`);
    
    console.log('Goals without tasks:', goalsWithoutTasks.map(g => ({
      id: g._id,
      title: g.title,
      dailyTime: g.dailyTime,
      dailyTimeAvailable: g.dailyTimeAvailable
    })));

    const results = await Promise.all(
      goalsWithoutTasks.map(async (goal) => {
        try {
          console.log(`Generating tasks for goal ${goal._id} (${goal.title})...`);
          const tasks = await generateDailyTasks(goal);
          console.log(`Generated ${tasks.length} tasks for goal ${goal._id}`);
          return {
            goalId: goal._id,
            success: true,
            tasksCount: tasks.length
          };
        } catch (error) {
          console.error(`Failed to generate tasks for goal ${goal._id}:`, error);
          return {
            goalId: goal._id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    res.json({
      message: 'Task generation completed',
      results
    });
  } catch (error) {
    console.error('Error generating tasks for goals:', error);
    res.status(500).json({
      message: 'Failed to generate tasks',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 