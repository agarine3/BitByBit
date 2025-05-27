# AI Planner

An intelligent goal planning and task breakdown tool that helps you achieve your goals by creating personalized daily schedules.

## Features

- Create and manage long-term goals
- AI-powered task breakdown
- Daily schedule generation based on available time
- Calendar integration
- Progress tracking

## Tech Stack

- Frontend: React with TypeScript
- Backend: Node.js/Express
- Database: MongoDB
- AI Integration: OpenAI API

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```
3. Create a `.env` file in the backend directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   MONGODB_URI=your_mongodb_uri
   ```
4. Start the development servers:
   ```bash
   npm start
   ```

## Project Structure

- `/frontend` - React frontend application
- `/backend` - Node.js/Express backend server
- `/docs` - Documentation and API specifications 