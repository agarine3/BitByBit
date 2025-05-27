import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          AI Planner
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/create-goal"
          >
            Create Goal
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/calendar"
          >
            Calendar
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 