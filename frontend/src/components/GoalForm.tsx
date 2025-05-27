import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  Snackbar,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface GoalFormData {
  title: string;
  description: string;
  dailyTime: number;
  startDate: Date | null;
  endDate: Date | null;
  difficulty: string;
}

const GoalForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    dailyTime: 60,
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 7 days from now
    difficulty: 'medium',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Validate dates
      if (!formData.startDate || !formData.endDate) {
        throw new Error('Please select both start and end dates');
      }

      if (formData.endDate < formData.startDate) {
        throw new Error('End date cannot be before start date');
      }

      // Validate other fields
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }

      if (formData.dailyTime < 1) {
        throw new Error('Daily time available must be at least 1 minute');
      }

      // Format the data for the API
      const goalData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        dailyTime: Number(formData.dailyTime),
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        difficulty: formData.difficulty,
      };

      console.log('Sending goal data:', goalData);

      // First check if the server is available
      try {
        await axios.get('http://localhost:3001/health');
      } catch (error) {
        throw new Error('Cannot connect to the server. Please make sure the backend server is running.');
      }

      const response = await axios.post('http://localhost:3001/api/goals', goalData, {
        timeout: 5000, // 5 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Goal created:', response.data);
      
      // Show success message
      setSuccess('Goal created successfully! Redirecting to dashboard...');
      
      // Wait a moment before redirecting
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error creating goal:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          setError('Request timed out. Please try again.');
        } else if (!error.response) {
          setError('Cannot connect to the server. Please make sure the backend server is running.');
        } else {
          setError(error.response.data.message || 'Failed to create goal');
        }
      } else {
        setError(error instanceof Error ? error.message : 'Failed to create goal');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    setFormData(prev => ({
      ...prev,
      difficulty: e.target.value,
    }));
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create New Goal
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="title"
              label="Goal Title"
              value={formData.title}
              onChange={handleChange}
              required
              fullWidth
              error={!!error && error.includes('Title')}
              helperText={error && error.includes('Title') ? error : ''}
            />
            
            <TextField
              name="description"
              label="Goal Description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              required
              fullWidth
              error={!!error && error.includes('Description')}
              helperText={error && error.includes('Description') ? error : ''}
            />

            <TextField
              name="dailyTime"
              label="Daily Time Available (minutes)"
              type="number"
              value={formData.dailyTime}
              onChange={handleChange}
              required
              fullWidth
              inputProps={{ min: 1 }}
              error={!!error && error.includes('Daily time')}
              helperText={error && error.includes('Daily time') ? error : ''}
            />

            <DatePicker
              label="Start Date"
              value={formData.startDate}
              onChange={(newValue) => setFormData(prev => ({ ...prev, startDate: newValue }))}
              slotProps={{
                textField: {
                  error: !!error && error.includes('start date'),
                  helperText: error && error.includes('start date') ? error : '',
                },
              }}
            />

            <DatePicker
              label="End Date"
              value={formData.endDate}
              onChange={(newValue) => setFormData(prev => ({ ...prev, endDate: newValue }))}
              slotProps={{
                textField: {
                  error: !!error && error.includes('end date'),
                  helperText: error && error.includes('end date') ? error : '',
                },
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleSelectChange}
                label="Difficulty Level"
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Goal Plan'}
            </Button>
          </Box>
        </form>
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={2000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Container> 
  );
};

export default GoalForm; 