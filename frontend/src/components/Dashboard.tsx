import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

interface DailyTask {
  _id: string;
  title: string;
  description: string;
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'pending' | 'completed' | 'skipped';
  dueDate: string;
  completedAt?: string;
}

interface Goal {
  _id: string;
  title: string;
  description: string;
  progress: number;
  dailyTime: number;
  startDate: string;
  endDate: string;
  difficulty: string;
  tasks?: DailyTask[];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingTasks, setGeneratingTasks] = useState<{ [key: string]: boolean }>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:3001/api/goals');
      console.log('Fetched goals:', response.data);
      setGoals(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateTasks = async (goalId: string) => {
    try {
      setGeneratingTasks(prev => ({ ...prev, [goalId]: true }));
      const response = await axios.post(`http://localhost:3001/api/goals/${goalId}/generate-tasks`);
      
      // Update the goals state with the new tasks
      setGoals(prevGoals => 
        prevGoals.map(goal => 
          goal._id === goalId 
            ? { ...goal, tasks: response.data }
            : goal
        )
      );
    } catch (error) {
      console.error('Error generating tasks:', error);
      setError('Failed to generate tasks. Please try again.');
    } finally {
      setGeneratingTasks(prev => ({ ...prev, [goalId]: false }));
    }
  };

  const updateTaskStatus = async (taskId: string, status: 'completed' | 'skipped') => {
    try {
      const response = await axios.patch(`http://localhost:3001/api/goals/tasks/${taskId}`, {
        status
      });
      
      // Update the goals state with the new task status
      setGoals(prevGoals => 
        prevGoals.map(goal => ({
          ...goal,
          tasks: goal.tasks?.map(task => 
            task._id === taskId ? response.data : task
          )
        }))
      );
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/create-goal')}
          >
            Create New Goal
          </Button>
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2, bgcolor: 'error.light' }}>
              <Typography color="error">{error}</Typography>
            </Paper>
          </Grid>
        )}

        {goals.map((goal) => (
          <Grid item xs={12} key={goal._id}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                {goal.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {goal.description}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Chip 
                  icon={<ClockCircleOutlined />}
                  label={`Daily Time: ${goal.dailyTime} minutes`}
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label={`Difficulty: ${goal.difficulty}`}
                  color={getDifficultyColor(goal.difficulty)}
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label={`Timeline: ${new Date(goal.startDate).toLocaleDateString()} - ${new Date(goal.endDate).toLocaleDateString()}`}
                />
              </Box>

              <Typography variant="h6" gutterBottom>
                Daily Tasks
              </Typography>
              
              {goal.tasks && goal.tasks.length > 0 ? (
                <List>
                  {goal.tasks.map((task) => (
                    <ListItem
                      key={task._id}
                      secondaryAction={
                        task.status === 'pending' && (
                          <Box>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => updateTaskStatus(task._id, 'completed')}
                              sx={{ mr: 1 }}
                            >
                              Complete
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => updateTaskStatus(task._id, 'skipped')}
                            >
                              Skip
                            </Button>
                          </Box>
                        )
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              sx={{
                                textDecoration: task.status !== 'pending' ? 'line-through' : 'none',
                                color: task.status !== 'pending' ? 'text.secondary' : 'text.primary'
                              }}
                            >
                              {task.title}
                            </Typography>
                            <Chip
                              label={task.difficulty}
                              size="small"
                              color={getDifficultyColor(task.difficulty)}
                            />
                            <Chip
                              icon={<ClockCircleOutlined />}
                              label={`${task.estimatedTime} min`}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={task.description}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography color="text.secondary" gutterBottom>
                    No tasks available.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => generateTasks(goal._id)}
                    disabled={generatingTasks[goal._id]}
                  >
                    {generatingTasks[goal._id] ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Generating Tasks...
                      </>
                    ) : (
                      'Generate Tasks'
                    )}
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Dashboard; 