import OpenAI from 'openai';
import { IGoal } from '../models/Goal';
import Task from '../models/Task';
import Goal from '../models/Goal';
import dayjs from 'dayjs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateDailyTasks = async (goal: IGoal) => {
  try {
    const startDate = dayjs(goal.startDate);
    const endDate = dayjs(goal.endDate);
    const totalDays = endDate.diff(startDate, 'days');
    
    const prompt = `Create a daily practice plan for the following goal. Return ONLY a valid JSON object with a "tasks" array:

Goal Title: ${goal.title}
Description: ${goal.description}
Current Level: ${goal.currentLevel}
Specific Areas to Focus On: ${goal.specificAreas}
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

Generate ${totalDays} tasks, one for each day between ${startDate.format('YYYY-MM-DD')} and ${endDate.format('YYYY-MM-DD')}.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a task planning assistant. Always respond with valid JSON only, no markdown or other formatting. The response should be a single JSON object with a 'tasks' array."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Clean the response to ensure it's valid JSON
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanContent);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', cleanContent);
      throw new Error('Invalid JSON response from OpenAI');
    }
    
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
        dailyFocus: task.dailyFocus || 'General Practice',
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