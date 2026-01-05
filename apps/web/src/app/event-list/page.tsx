'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { useRouter } from 'next/navigation';

import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import CustomTable, { Column } from '@/components/shared/ui/CustomTable';
import CustomDialog from '@/components/shared/ui/CustomDialog';
import CustomTextField from '@/components/shared/ui/CustomTextField';
import SubmitButton from '@/components/shared/ui/SubmitButton';
import CancelButton from '@/components/shared/ui/CancelButton';
import ErrorMessage from '@/components/shared/ui/ErrorMessage';
import InfoMessage from '@/components/shared/ui/InfoMessage';
import AddressForm, { AddressFormData } from '@/components/shared/ui/AddressForm';
import { eventService } from '@/features/events/services/eventService';
import { Event } from '@/features/events/types';

interface Group {
  id: number;
  name: string;
}

const columns: Column<Event>[] = [
  { id: 'date', label: 'Date', sortable: true, width: 120 },
  { id: 'startTime', label: 'Time', width: 150 },
  { id: 'name', label: 'Event Name', sortable: true },
  { id: 'groupId', label: 'Group', sortable: true },
  { id: 'address', label: 'Location' },
  { id: 'actions', label: 'Actions', align: 'right', width: 150 },
];

const defaultAddress: AddressFormData = {
  street: '',
  city: '',
  province: '',
  postalCode: '',
  country: '',
  link: '',
};

export default function EventListPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    groupId: '',
    isRecurring: false,
    address: { ...defaultAddress },
  });

  const [sortConfig, setSortConfig] = useState<{ key: keyof Event | 'actions'; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'asc',
  });

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const data = await eventService.getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events', error);
      setPageError('Unable to load events. Please ensure you are signed in.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAdminGroups = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups?adminOnly=true`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups);
      }
    } catch (error) {
      console.error('Failed to fetch groups', error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchAdminGroups();
  }, [fetchEvents, fetchAdminGroups]);

  const handleSort = (columnId: keyof Event | 'actions') => {
    const isAsc = sortConfig.key === columnId && sortConfig.direction === 'asc';
    setSortConfig({ key: columnId, direction: isAsc ? 'desc' : 'asc' });
  };

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (sortConfig.key === 'groupId') {
        const valA = a.group?.name || '';
        const valB = b.group?.name || '';
        return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      const key = sortConfig.key as keyof Event;
      const valA = a[key];
      const valB = b[key];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }

      return 0;
    });
  }, [events, sortConfig]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name || !formData.date || !formData.startTime || !formData.endTime || !formData.groupId) {
      setError('Please fill in all required event details');
      return;
    }
    const { street, city, province, postalCode, country } = formData.address;
    if (!street || !city || !province || !postalCode || !country) {
      setError('Please fill in all required address details');
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine date and time for backend
      const submitData = {
        ...formData,
        groupId: Number(formData.groupId),
        startTime: `${formData.date}T${formData.startTime}`,
        endTime: `${formData.date}T${formData.endTime}`,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        const newEvent = await res.json();
        router.push(`/event-details?id=${newEvent.id}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Failed to create event', error);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <PageContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <PageHeading>Upcoming Events</PageHeading>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsDialogOpen(true)}
        >
          Create Event
        </Button>
      </Box>

      <ErrorMessage message={pageError} />

      <CustomTable
        columns={columns}
        data={sortedEvents}
        isLoading={isLoading}
        sortConfig={sortConfig}
        onSort={handleSort}
        emptyMessage="No upcoming events found for your groups."
        renderCell={(event, column) => {
          if (column.id === 'date') {
            return <Typography variant="body2">{formatDate(event.date)}</Typography>;
          }
          if (column.id === 'startTime') {
            return (
              <Typography variant="body2">
                {formatTime(event.startTime)} - {formatTime(event.endTime)}
              </Typography>
            );
          }
          if (column.id === 'name') {
            return (
              <Box>
                <Typography variant="body2" fontWeight="bold">{event.name}</Typography>
                {event.description && (
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 200 }}>
                    {event.description}
                  </Typography>
                )}
              </Box>
            );
          }
          if (column.id === 'groupId') {
            return <Typography variant="body2">{event.group?.name || '-'}</Typography>;
          }
          if (column.id === 'address') {
            return <Typography variant="body2">{event.address?.city || event.address?.street || '-'}</Typography>;
          }
          if (column.id === 'actions') {
            return (
              <Button
                size="small"
                variant="outlined"
                startIcon={<InfoIcon />}
                onClick={() => router.push(`/event-details?id=${event.realId || event.id}&date=${new Date(event.date).toISOString().split('T')[0]}`)}
              >
                Details
              </Button>
            );
          }
          return null;
        }}
      />

      {/* Create Event Dialog */}
      <CustomDialog
        open={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setError(null); }}
        title="Create New Event"
        component="form"
        onSubmit={handleCreateEvent}
        maxWidth="md"
        fullWidth
        actions={
          <>
            <CancelButton onClick={() => { setIsDialogOpen(false); setError(null); }}>Cancel</CancelButton>
            <SubmitButton isSubmitting={isSubmitting} disabled={groups.length === 0}>Create Event</SubmitButton>
          </>
        }
      >
        <ErrorMessage message={error} />
        {groups.length === 0 && (
          <InfoMessage message="You must be an admin of at least one group to create an event." />
        )}
        
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <CustomTextField
              id="name"
              label="Event Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{ flex: 2 }}
            />
            <CustomTextField
              id="groupId"
              label="Target Group"
              select
              value={formData.groupId}
              onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
              required
              disabled={groups.length === 0}
              sx={{ flex: 1 }}
            >
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </CustomTextField>
          </Stack>

          <CustomTextField
            id="description"
            label="Description"
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body2">Is Recurring (Weekly)</Typography>
              </Box>
            }
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <CustomTextField
              id="date"
              label="Event Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <CustomTextField
              id="startTime"
              label="Start Time"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <CustomTextField
              id="endTime"
              label="End Time"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>

          <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>Location Details</Typography>
          
          <AddressForm
            data={formData.address}
            onChange={(address) => setFormData({ ...formData, address })}
          />
        </Stack>
      </CustomDialog>
    </PageContainer>
  );
}
