'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import CarelessAppBar from './components/CarelessAppBar';
import CarelessHero from './components/CarelessHero';
import Footer from '../shared/Footer';

export default function CarelessHomePage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CarelessAppBar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <CarelessHero />
      </Box>
      <Footer />
    </Box>
  );
}
