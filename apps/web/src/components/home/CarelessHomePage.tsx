'use client';
import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from '../shared-theme/AppTheme';
import CarelessAppBar from './components/CarelessAppBar';
import CarelessHero from './components/CarelessHero';
import Footer from '../shared/Footer';

export default function CarelessHomePage(props: { disableCustomTheme?: boolean }) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <CarelessAppBar />
      <CarelessHero />
      <Footer />
    </AppTheme>
  );
}
