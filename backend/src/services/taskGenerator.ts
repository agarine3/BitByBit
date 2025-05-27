import OpenAI from 'openai';
import { IGoal } from '../models/Goal';
import Task from '../models/Task';
import mongoose from 'mongoose';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateDailyTasks = async (goal: IGoal) => {
  try {
    // Calculate total days between start and end date
    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate total minutes available for the goal
    const totalMinutes = totalDays * (goal.dailyTime || 0);
    
    // Create prompt for GPT
    const prompt = `Create a detailed learning plan for the following goal:
    Title: ${goal.title}
    Description: ${goal.description}
    Total Time Available: ${totalMinutes} minutes over ${totalDays} days
    Daily Time Available: ${goal.dailyTime} minutes
    Difficulty Level: ${goal.difficulty}
    
    Generate a list of tasks that:
    1. Break down the goal into manageable daily tasks
    2. Consider the difficulty level and time constraints
    3. Progress from basic to advanced concepts
    4. Include specific learning objectives for each task
    
    Format the response as a JSON object with a "tasks" array containing task objects. Each task should have:
    - title: A clear, specific task title
    - description: Detailed description of what needs to be done
    - estimatedTime: Time in minutes (should not exceed daily time)
    - difficulty: 'easy', 'medium', or 'hard'
    - dueDate: The date this task should be completed by (YYYY-MM-DD format)`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a task planning assistant that creates detailed, actionable tasks for learning goals. Always return a JSON object with a 'tasks' array."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from GPT');
    }

    // Parse the response and validate the structure
    const parsedResponse = JSON.parse(response);
    if (!parsedResponse.tasks || !Array.isArray(parsedResponse.tasks)) {
      throw new Error('Invalid response format: missing tasks array');
    }

    // Create tasks in the database
    const savedTasks = await Task.insertMany(
      parsedResponse.tasks.map((task: any) => ({
        ...task,
        goalId: goal._id,
        status: 'pending',
        dueDate: new Date(task.dueDate)
      }))
    );

    // Update goal with task references
    goal.tasks = savedTasks.map(task => task._id as mongoose.Types.ObjectId);
    await goal.save();

    return savedTasks;
  } catch (error) {
    console.error('Error generating tasks:', error);
    throw error;
  }
}; 