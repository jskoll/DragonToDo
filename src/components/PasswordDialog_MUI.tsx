import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  Security,
} from '@mui/icons-material';

interface PasswordDialogProps {
  open: boolean;
  mode: 'encrypt' | 'decrypt';
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

const PasswordDialog: React.FC<PasswordDialogProps> = ({
  open,
  mode,
  onSubmit,
  onCancel,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    if (mode === 'encrypt') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
    }

    onSubmit(password);
    handleClose();
  };

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setError('');
    setShowPassword(false);
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backdropFilter: 'blur(10px)',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {mode === 'encrypt' ? <Security /> : <Lock />}
        {mode === 'encrypt' ? 'Set Encryption Password' : 'Enter Password'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {mode === 'encrypt'
              ? 'Set a strong password to encrypt your todo file. This password will be required to open the file in the future.'
              : 'Enter the password to decrypt this file.'
            }
          </Typography>

          <TextField
            autoFocus
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            error={!!error}
            helperText={error}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {mode === 'encrypt' && (
            <TextField
              fullWidth
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              error={!!error && error.includes('match')}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          {mode === 'encrypt' && (
            <Typography variant="caption" color="text.secondary">
              💡 Tips for a strong password:
              <br />
              • Use at least 8 characters
              <br />
              • Mix uppercase, lowercase, numbers, and symbols
              <br />
              • Avoid common words or personal information
              <br />
              • Consider using a password manager
            </Typography>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!password || (mode === 'encrypt' && !confirmPassword)}
        >
          {mode === 'encrypt' ? 'Encrypt File' : 'Decrypt'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordDialog;