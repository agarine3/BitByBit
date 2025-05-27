import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import axios from 'axios';

interface Task {
  _id: string;
  title: string;
  description: string;
  date: string;
  completed: boolean;
}

const Calendar: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/tasks');
        setTasks(response.data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, []);

  const groupTasksByDate = () => {
    const grouped: { [key: string]: Task[] } = {};
    tasks.forEach(task => {
      const date = new Date(task.date).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(task);
    });
    return grouped;
  };

  const groupedTasks = groupTasksByDate();

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Your Study Schedule
        </Typography>
        {Object.entries(groupedTasks).map(([date, dateTasks]) => (
          <Box key={date} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {date}
            </Typography>
            <List>
              {dateTasks.map((task, index) => (
                <React.Fragment key={task._id}>
                  <ListItem>
                    <ListItemText
                      primary={task.title}
                      secondary={task.description}
                    />
                  </ListItem>
                  {index < dateTasks.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        ))}
      </Paper>
    </Container>
  );
};

export default Calendar; 