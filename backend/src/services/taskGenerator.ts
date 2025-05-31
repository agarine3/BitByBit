import dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';
import { IGoal } from '../models/Goal';
import Task from '../models/Task';
import Goal from '../models/Goal';
import dayjs from 'dayjs';

let openai: OpenAI | null = null;

// Initialize OpenAI only if API key is available
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.warn('OpenAI initialization failed:', error);
  }
} else {
  console.log('OpenAI API key not found. Will use mock task generation.');
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateTasksWithRetry = async (prompt: string, maxRetries = 3, initialDelay = 2000) => {
  let retries = 0;
  let delay = initialDelay;

  while (retries < maxRetries) {
    try {
      const response = await openai?.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a task planning assistant. Always respond with valid JSON only, no markdown or other formatting. The response should be a single JSON object with a 'tasks' array. Each task must be a complete object with all required fields."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const content = response?.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Clean the response to ensure it's valid JSON
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      try {
        const parsed = JSON.parse(cleanContent);
        if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
          console.error('Invalid response structure:', parsed);
          throw new Error('Response missing tasks array');
        }
        return parsed;
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', cleanContent);
        console.error('Parse error:', parseError);
        throw new Error('Invalid JSON response from OpenAI');
      }
    } catch (error: any) {
      if (error?.status === 429) {
        // Rate limit hit, wait and retry
        const retryAfter = parseInt(error.headers?.['retry-after'] || '2', 10) * 1000;
        console.log(`Rate limit hit. Waiting ${retryAfter}ms before retry ${retries + 1}/${maxRetries}`);
        await sleep(retryAfter);
        retries++;
        delay *= 2; // Exponential backoff
      } else {
        console.error('Error in generateTasksWithRetry:', error);
        throw error;
      }
    }
  }
  throw new Error('Max retries reached');
};

export const generateDailyTasks = async (goal: IGoal) => {
  try {
    const startDate = dayjs(goal.startDate);
    const endDate = dayjs(goal.endDate);
    const totalDays = endDate.diff(startDate, 'days');

    // If OpenAI is not available, generate mock tasks
    if (!openai) {
      console.log('Using mock task generation (OpenAI not configured)');
      const mockTasks = Array.from({ length: totalDays }, (_, index) => ({
        title: `Practice Session ${index + 1}`,
        description: `Daily practice for ${goal.title}`,
        estimatedTime: goal.dailyTime,
        status: 'pending',
        dueDate: startDate.add(index, 'day').toDate(),
        successCriteria: ['Complete all exercises', 'Review concepts'],
        prerequisites: [],
        notes: 'Focus on consistent practice',
        dailyFocus: goal.specificAreas.join(', '),
        resources: [],
        goalId: goal._id
      }));

      const savedTasks = await Task.insertMany(mockTasks);
      await Goal.findByIdAndUpdate(goal._id, {
        $push: { tasks: { $each: savedTasks.map(task => task._id) } }
      });
      return savedTasks;
    }
    
    const prompt = `Create a daily practice plan for the following goal. Return ONLY a valid JSON object with a "tasks" array:

Goal Title: ${goal.title}
Description: ${goal.description}
Current Level: ${goal.currentLevel}
Specific Areas to Focus On: ${goal.specificAreas.join(', ')}
Daily Practice Time: ${goal.dailyTime} minutes
Total Days Available: ${totalDays} days

Each task in the tasks array should have these exact fields:
{
  "title": "string",
  "description": "string",
  "estimatedTime": number,
  "status": "pending",
  "successCriteria": ["string"],
  "prerequisites": ["string"],
  "notes": "string",
  "dailyFocus": "string",
  "resources": ["string"]
}

Generate ${totalDays} tasks, one for each day between ${startDate.format('YYYY-MM-DD')} and ${endDate.format('YYYY-MM-DD')}.
Make sure each task object is complete and valid JSON.`;

    const parsedResponse = await generateTasksWithRetry(prompt);
    
    if (!Array.isArray(parsedResponse.tasks)) {
      throw new Error('Invalid response format: tasks array not found');
    }

    // Create tasks for each day
    const tasks = Array.from({ length: totalDays }, (_, index) => {
      const task = parsedResponse.tasks[index % parsedResponse.tasks.length];
      return {
        title: task.title || 'Untitled Task',
        description: task.description || '',
        estimatedTime: task.estimatedTime || goal.dailyTime,
        status: 'pending',
        dueDate: startDate.add(index, 'day').toDate(),
        successCriteria: Array.isArray(task.successCriteria) ? task.successCriteria : [],
        prerequisites: Array.isArray(task.prerequisites) ? task.prerequisites : [],
        notes: task.notes || '',
        dailyFocus: task.dailyFocus || goal.specificAreas.join(', '),
        resources: Array.isArray(task.resources) ? task.resources : [],
        goalId: goal._id
      };
    });

    // Save tasks to database
    const savedTasks = await Task.insertMany(tasks);
    
    // Update goal with task references
    await Goal.findByIdAndUpdate(goal._id, {
      $push: { tasks: { $each: savedTasks.map(task => task._id) } }
    });

    return savedTasks;
  } catch (error) {
    console.error('Error generating tasks:', error);
    throw error;
  }
}; 