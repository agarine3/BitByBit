# BitByBit

Big goals made easier

## About

BitByBit is an AI-powered goal planning and task management application that helps break down big goals into manageable daily tasks. It uses OpenAI's GPT models to generate personalized task plans based on your goals, available time, and difficulty level.

## Features

- Create and manage learning goals
- AI-powered task generation
- Daily task scheduling
- Progress tracking
- Customizable difficulty levels
- Time-based planning

## Tech Stack

- Frontend: React with TypeScript
- Backend: Node.js with Express and TypeScript
- Database: MongoDB
- AI: OpenAI GPT-3.5 Turbo
- Authentication: JWT

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the backend directory
   - Add your OpenAI API key and MongoDB URI

4. Start the development servers:
   ```bash
   # Start backend
   cd backend
   npm run dev

   # Start frontend
   cd frontend
   npm run dev
   ```

## Environment Variables

Required environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `MONGODB_URI`: Your MongoDB connection string

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
