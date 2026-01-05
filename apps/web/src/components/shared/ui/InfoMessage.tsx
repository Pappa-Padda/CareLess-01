'use client';

import React from 'react';
import Alert, { AlertProps } from '@mui/material/Alert';

interface InfoMessageProps extends Omit<AlertProps, 'severity' | 'variant'> {
  message: React.ReactNode;
}

export default function InfoMessage({ message, sx, ...props }: InfoMessageProps) {
  if (!message) return null;

  return (
    <Alert 
      severity="warning" 
      variant="filled"
      sx={{ 
        width: '100%',
        mb: 2,
        color: 'white', // Ensure text is readable on yellow/orange
        ...sx 
      }} 
      {...props}
    >
      {message}
    </Alert>
  );
}
