'use client';
import * as React from 'react';
import Typography from '@mui/material/Typography';
import ColorModeSelect from '../../shared-theme/ColorModeSelect';
import SitemarkIcon from '../SitemarkIcon';
import { AuthContainer, AuthCard } from './styles';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AuthLayout({ children, title }: AuthLayoutProps) {
  return (
    <AuthContainer direction="column" justifyContent="space-between">
      <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
      <AuthCard variant="outlined">
        <SitemarkIcon />
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
        >
          {title}
        </Typography>
        {children}
      </AuthCard>
    </AuthContainer>
  );
}
