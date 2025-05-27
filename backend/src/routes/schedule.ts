import express from 'express';
import Task from '../models/Task';

const router = express.Router();

// Get recent tasks
router.get('/recent', async (req, res) => {
  try {
    console.log('Fetching recent tasks...');
    const tasks = await Task.find()
      .sort({ date: 1 })
      .limit(10);
    console.log(`Found ${tasks.length} recent tasks`);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching recent tasks:', error);
    res.status(500).json({ 
      message: 'Error fetching recent tasks', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get tasks for a specific date
router.get('/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const tasks = await Task.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).sort({ order: 1 });

    res.json({
      date: req.params.date,
      tasks,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedule', error });
  }
});

// Update task completion status
router.patch('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { completed: req.body.completed },
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: 'Error updating task', error });
  }
});

export default router; 