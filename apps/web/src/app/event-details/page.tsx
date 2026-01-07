'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import MapIcon from '@mui/icons-material/Map';
import CircularProgress from '@mui/material/CircularProgress';

import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import ErrorMessage from '@/components/shared/ui/ErrorMessage';
import InfoMessage from '@/components/shared/ui/InfoMessage';
import { eventService } from '@/features/events/services/eventService';
import { Event } from '@/features/events/types';

function EventDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get('id');

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayDate = searchParams.get('date');

  const fetchEventDetails = useCallback(async () => {
    if (!eventId) {
      setError('No event ID provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await eventService.getEventById(Number(eventId));
      
      // Override date if an occurrence date was passed in URL
      if (displayDate) {
        const occDate = new Date(displayDate);
        // Sync times from the original event but use the occurrence date
        const startTime = new Date(occDate);
        const originalStart = new Date(data.startTime);
        startTime.setHours(originalStart.getHours(), originalStart.getMinutes());

        const endTime = new Date(occDate);
        const originalEnd = new Date(data.endTime);
        endTime.setHours(originalEnd.getHours(), originalEnd.getMinutes());

        data.date = occDate.toISOString();
        data.startTime = startTime.toISOString();
        data.endTime = endTime.toISOString();
      }

      setEvent(data);
    } catch (err) {
      console.error('Failed to fetch event details', err);
      const message = err instanceof Error ? err.message : 'Failed to load event details';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, displayDate]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <ErrorMessage message={error} />
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.back()}
          sx={{ alignSelf: 'flex-start' }}
        >
          Go Back
        </Button>
      </Stack>
    );
  }

  if (!event) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], { 
      weekday: 'long', 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.back()}
          variant="text"
        >
          Back to List
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ p: 4 }}>
        <Grid container spacing={4}>
          {/* Header Info */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <PageHeading sx={{ mb: 1 }}>{event.name}</PageHeading>
                {event.isRecurring && (
                  <InfoMessage 
                    message="This is a weekly recurring event." 
                    sx={{ mb: 0, py: 0.5, px: 1.5, width: 'fit-content' }} 
                  />
                )}
              </Box>
              <Paper 
                elevation={0} 
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white', 
                  px: 2, 
                  py: 1, 
                  borderRadius: 2,
                  textAlign: 'center'
                }}
              >
                <Typography variant="h5" fontWeight="bold">
                  {new Date(event.date).getDate()}
                </Typography>
                <Typography variant="caption" sx={{ textTransform: 'uppercase' }}>
                  {new Date(event.date).toLocaleString([], { month: 'short' })}
                </Typography>
              </Paper>
            </Box>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider />
          </Grid>

          {/* Details Column */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Description
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {event.description || 'No description provided for this event.'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Community
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GroupIcon color="action" />
                  <Typography variant="body1">{event.group?.name}</Typography>
                </Box>
              </Box>
            </Stack>
          </Grid>

          {/* Logistics Column */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: 'background.default' }}>
              <Stack spacing={2.5}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <EventIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">Date</Typography>
                    <Typography variant="body2" color="text.secondary">{formatDate(event.date)}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <AccessTimeIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">Time</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <LocationOnIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">Location</Typography>
                    {event.address?.nickname && (
                        <Typography variant="body2" fontWeight="bold" color="primary.main">
                            {event.address.nickname}
                        </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {event.address?.street}, {event.address?.city}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {event.address?.province}, {event.address?.postalCode}
                    </Typography>
                    {event.address?.link && (
                      <Button
                        size="small"
                        startIcon={<MapIcon />}
                        href={event.address.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ mt: 1 }}
                      >
                        Open Maps
                      </Button>
                    )}
                  </Box>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Future Sections Placeholder */}
      <Paper variant="outlined" sx={{ p: 4, borderStyle: 'dashed', textAlign: 'center' }}>
        <Typography color="text.secondary">
          Additional features coming soon: Driver availability, Lift requests, and Confirmation details.
        </Typography>
      </Paper>
    </Stack>
  );
}

export default function EventDetailsPage() {
  return (
    <PageContainer>
      <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}>
        <EventDetailsContent />
      </Suspense>
    </PageContainer>
  );
}
