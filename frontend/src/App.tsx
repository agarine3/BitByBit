import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

// Components
import Navbar from './components/Navbar.tsx';
import GoalForm from './components/GoalForm.tsx';
import Calendar from './components/Calendar.tsx';
import Dashboard from './components/Dashboard.tsx';

// Create Apollo Client
const client = new ApolloClient({
  uri: 'http://localhost:3001/graphql',
  cache: new InMemoryCache(),
});

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  return (
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          <Router future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}>
            <Navbar />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create-goal" element={<GoalForm />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </LocalizationProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}

export default App; 