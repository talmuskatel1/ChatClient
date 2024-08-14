import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Snackbar } from '@mui/material';
import { API } from '../services/api';
import { setSessionUserId, setSessionItem } from '../utils/sessionUtils';
import axios from 'axios';

const SignUp: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    try {
      const response = await API.post('/users/signup', { username, password });
      const userId = response.data.userId;
      setSessionUserId(userId);
      setSessionItem('username', username);
      // Only set profile picture if it exists
      if (response.data.profilePictureUrl) {
        setSessionItem('profilePicture', response.data.profilePictureUrl);
      }
      navigate('/chat');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Sign up failed. Please try again.');
        console.error('Signup error:', error.response?.data);
      } else {
        setError('An unexpected error occurred. Please try again.');
        console.error('Unexpected signup error:', error);
      }
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Paper elevation={3} sx={{ padding: 4, width: 300 }}>
        <Typography variant="h5" gutterBottom>Sign Up</Typography>
        <TextField
          fullWidth
          margin="normal"
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Box mt={2}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSignUp} 
            fullWidth
          >
            Sign Up
          </Button>
        </Box>
        <Box mt={1}>
          <Button 
            variant="text" 
            onClick={() => navigate('/login')} 
            fullWidth
          >
            Already have an account? Log in
          </Button>
        </Box>
      </Paper>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        message={error}
      />
    </Box>
  );
};

export default SignUp;