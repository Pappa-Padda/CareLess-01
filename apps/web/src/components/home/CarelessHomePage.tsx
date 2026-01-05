'use client';
import * as React from 'react';
import CarelessAppBar from './components/CarelessAppBar';
import CarelessHero from './components/CarelessHero';
import Footer from '../shared/Footer';

export default function CarelessHomePage() {
  return (
    <>
      <CarelessAppBar />
      <CarelessHero />
      <Footer />
    </>
  );
}
