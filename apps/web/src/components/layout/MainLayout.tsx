'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import { useAuth } from '@/context/AuthContext';
import CarelessSidebar from '../shared/sidebar/CarelessSidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
     return <>{children}</>; 
  }

  if (user) {
    return (
      <Box sx={{ display: 'flex' }}>
        <CarelessSidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
           {children}
        </Box>
      </Box>
    );
  }

  return <>{children}</>;
}
