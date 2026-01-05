'use client';
import React, { useEffect, useState } from 'react';
import { Container, Typography, Button, Box, Alert, Snackbar } from '@mui/material';
import { Add } from '@mui/icons-material';
import EventManagementTable from '@/features/events/components/EventManagementTable';
import EventFormDialog from '@/features/events/components/EventFormDialog';
import { eventService } from '@/features/events/services/eventService';
import { CreateEventDTO, Event, UpdateEventDTO } from '@/features/events/types';

export default function EventManagementPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const data = await eventService.getEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load events');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = () => {
    setSelectedEvent(undefined);
    setOpenDialog(true);
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.deleteEvent(id);
        fetchEvents();
      } catch (err) {
          console.error(err);
        setError('Failed to delete event');
      }
    }
  };

  const handleSubmit = async (data: CreateEventDTO | UpdateEventDTO) => {
    try {
      if ('id' in data) {
        await eventService.updateEvent(data.id, data);
      } else {
        await eventService.createEvent(data);
      }
      fetchEvents();
      setOpenDialog(false);
    } catch (err) {
        console.error(err);
      setError('Failed to save event');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Event Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
        >
          Add Event
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <EventManagementTable
        events={events}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <EventFormDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSubmit}
        initialData={selectedEvent}
      />
    </Container>
  );
}
