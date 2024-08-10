import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Snackbar } from '@mui/material';
import { API } from '../services/api';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await API.post('/users/login', { username, password });
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('profilePicture', response.data.profilePictureUrl);
      navigate('/chat');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Paper elevation={3} sx={{ padding: 4, width: 300 }}>
        <Typography variant="h5" gutterBottom>Login</Typography>
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
            onClick={handleLogin} 
            fullWidth
          >
            Log In
          </Button>
        </Box>
        <Box mt={1}>
          <Button 
            variant="text" 
            onClick={() => navigate('/signup')} 
            fullWidth
          >
            Don't have an account? Sign up
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
export default Login;