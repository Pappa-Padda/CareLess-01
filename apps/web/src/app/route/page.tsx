'use client';

import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { APIProvider, Map } from '@vis.gl/react-google-maps';

import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import InfoMessage from '@/components/shared/ui/InfoMessage';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function RouteViewPage() {
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
    return (
      <PageContainer>
        <PageHeading>Route View</PageHeading>
        <InfoMessage 
          message="Google Maps API key is missing or not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file." 
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeading>Route View</PageHeading>
      
      <Paper 
        variant="outlined" 
        sx={{ 
          mt: 3, 
          height: 'calc(100vh - 250px)', 
          minHeight: '400px',
          width: '100%',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            defaultCenter={{ lat: -26.2041, lng: 28.0473 }} // Default to Johannesburg
            defaultZoom={11}
            gestureHandling={'greedy'}
            disableDefaultUI={false}
          />
        </APIProvider>
      </Paper>
    </PageContainer>
  );
}
