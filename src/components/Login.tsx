import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Snackbar } from '@mui/material';
import { API } from '../services/api';
import { setSessionUserId, setSessionItem} from '../utils/sessionUtils';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await API.post('/users/login', { username, password });
      const userId = response.data.userId;
      const profilePictureUrl = response.data.profilePictureUrl;
      setSessionUserId(userId);
      setSessionItem('profilePicture', profilePictureUrl);
      navigate('/chat');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <Box className="login-container">
      <Paper elevation={3} className="login-paper">
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
        <Box className="login-button-container">
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleLogin} 
            fullWidth
          >
            Log In
          </Button>
        </Box>
        <Box className="signup-link-container">
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