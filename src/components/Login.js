import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Button, Box, Typography, Container, Alert, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import backgroundImage from '../assets/nlo-bg.jpg';
import citLogo from '../assets/CIT512.png';

const Login = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        'Admin@lotracker.com',
        password
      );
      navigate('/');
    } catch (error) {
      setError('Invalid password. Please try again.');
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-background" style={{ backgroundImage: `url(${backgroundImage})` }}></div>
      <Container component="main" maxWidth="xs">
        <Box className="login-box">
          <div className="logo-container">
            <div className="logo-circle">
              <img src={citLogo} alt="CIT-U Seal" className="cit-logo-img" />
            </div>
          </div>
          
          <Typography component="h1" variant="h5" className="login-title">
            MOA MONITORING SYSTEM
          </Typography>
          
          <Typography variant="subtitle1" className="login-subtitle">
            Networking and Linkages Office
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Enter Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              InputProps={{
                startAdornment: (
                  <i className="fas fa-lock" style={{ marginRight: '10px', color: '#800000' }}></i>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="login-button"
              disabled={loading}
              startIcon={loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sign-in-alt"></i>}
            >
              {loading ? 'Logging in...' : 'Login as Admin'}
            </Button>
          </Box>

          <Typography variant="body2" className="login-footer">
            <i className="fas fa-shield-alt"></i> Secure Access Only
          </Typography>
        </Box>
      </Container>
    </div>
  );
};

export default Login; 