import OpenAI from 'openai';
import { IGoal } from '../models/Goal';
import DailyTask, { IDailyTask } from '../models/DailyTask';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateTasks(goal: IGoal) {
  const prompt = `Create a detailed plan for the following goal:
    Title: ${goal.title}
    Description: ${goal.description}
    Daily Time: ${goal.dailyTime} minutes
    Timeline: ${goal.startDate.toISOString().split('T')[0]} to ${goal.endDate.toISOString().split('T')[0]}

    Generate a structured plan that includes:
    1. Weekly milestones
    2. Daily tasks breakdown
    3. Progress tracking metrics
    4. Success criteria

    Format the response as a JSON object with:
    - weeklyMilestones: array of milestone objects
    - dailyTasks: array of task objects
    - metrics: array of metric objects
    - successCriteria: array of criteria strings`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error generating tasks:', error);
    throw new Error('Failed to generate tasks');
  }
}

export async function generateDailyTasks(goal: IGoal) {
  const prompt = `Create a series of daily tasks for the following goal:
    Title: ${goal.title}
    Description: ${goal.description}
    Daily Time: ${goal.dailyTime} minutes
    Timeline: ${goal.startDate.toISOString().split('T')[0]} to ${goal.endDate.toISOString().split('T')[0]}

    Generate 5 daily tasks that:
    1. Are specific and actionable
    2. Match the daily time commitment
    3. Progress in difficulty
    4. Help achieve the overall goal
    5. Include estimated time for each task

    Format the response as a JSON array of tasks, each with:
    - title: string
    - description: string
    - estimatedTime: number (in minutes)
    - difficulty: "easy" | "medium" | "hard"
    - dueDate: string (YYYY-MM-DD)`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from GPT');
    }

    const response = JSON.parse(content);
    const tasks = response.tasks.map((task: any) => ({
      goalId: goal._id,
      title: task.title,
      description: task.description,
      estimatedTime: task.estimatedTime,
      difficulty: task.difficulty,
      dueDate: new Date(task.dueDate),
      status: 'pending'
    }));

    return await DailyTask.insertMany(tasks);
  } catch (error) {
    console.error('Error generating tasks:', error);
    throw new Error('Failed to generate daily tasks');
  }
} 