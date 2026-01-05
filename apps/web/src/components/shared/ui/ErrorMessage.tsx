'use client';

import React from 'react';
import Alert, { AlertProps } from '@mui/material/Alert';

interface ErrorMessageProps extends Omit<AlertProps, 'severity' | 'variant'> {
  message: React.ReactNode;
}

export default function ErrorMessage({ message, sx, ...props }: ErrorMessageProps) {
  if (!message) return null;
  
  return (
    <Alert 
      severity="error" 
      variant="filled"
      sx={{ 
        width: '100%',
        mb: 2,
        ...sx 
      }} 
      {...props}
    >
      {message}
    </Alert>
  );
}
