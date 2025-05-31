import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './schema/schema';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:3000', // Frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-planner';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    // Start Apollo Server
    await server.start();
    
    // Apply Apollo middleware
    app.use('/graphql', expressMiddleware(server));
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Warning: OPENAI_API_KEY is not configured. Task generation will use mock data.');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 