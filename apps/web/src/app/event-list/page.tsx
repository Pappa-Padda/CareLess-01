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
import ButtonGroup from '@mui/material/ButtonGroup';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
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
import CarSelectionDialog from '@/features/lifts/components/CarSelectionDialog';

import { eventService } from '@/features/events/services/eventService';
import { carService } from '@/features/cars/carService';
import { liftService } from '@/features/lifts/liftService';
import { Event } from '@/features/events/types';
import { Car } from '@/features/cars/types';
import { useAuth } from '@/context/AuthContext';
import { formatTime } from '@/utils/time';
import { getImageUrl } from '@/utils/images';

interface Group {
  id: number;
  name: string;
}

const columns: Column<Event>[] = [
  { id: 'date', label: 'Date', sortable: true, width: 120 },
  { id: 'startTime', label: 'Time', width: 150 },
  { id: 'name', label: 'Event Name', sortable: true },
  { id: 'address', label: 'Location' },
  { id: 'actions', label: 'Actions', align: 'right', width: 320 },
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
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  
  // Lifts Logic
  const [cars, setCars] = useState<Car[]>([]);
  const [eventStatus, setEventStatus] = useState<Record<string, 'offered' | 'requested' | null>>({}); // Key is virtual ID (string)
  const [processingEvents, setProcessingEvents] = useState<Record<string, boolean>>({});
  
  // Car Selection Dialog
  const [carDialogOpen, setCarDialogOpen] = useState(false);
  const [selectedEventForOffer, setSelectedEventForOffer] = useState<{ id: number, date: string } | null>(null);

  // Create Event Dialog State
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

  const sortedAndGroupedEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
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

    // Group by groupId
    return sorted.reduce((acc, event) => {
      const groupId = event.groupId;
      if (!acc[groupId]) {
        acc[groupId] = {
          groupName: event.group?.name || 'Unassigned',
          groupProfilePicture: event.group?.profilePicture,
          events: [],
        };
      }
      acc[groupId].events.push(event);
      return acc;
    }, {} as Record<string, { groupName: string; groupProfilePicture?: string; events: Event[] }>);
  }, [events, sortConfig]);

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

  const fetchUserData = useCallback(async () => {
    if (!user) return;
    
    try {
        const getVirtualId = (eventId: number, dateStr: string) => {
             const d = new Date(dateStr).toISOString().split('T')[0];
             return `${eventId}_${d}`;
        };

        if (user.isDriver) {
            const { cars } = await carService.getCars();
            setCars(cars);
            
            const { offers } = await liftService.getMyOffers();
            setEventStatus(prev => {
                const newStatus = { ...prev };
                offers.forEach(o => {
                    const vid = getVirtualId(o.eventId, o.date);
                    newStatus[vid] = 'offered';
                });
                return newStatus;
            });
        }

        const { requests } = await liftService.getMyRequests();
         setEventStatus(prev => {
            const newStatus = { ...prev };
            requests.forEach(r => {
                const vid = getVirtualId(r.eventId, r.date);
                newStatus[vid] = 'requested';
            });
            return newStatus;
        });

    } catch (err) {
        console.error('Failed to fetch user lift data', err);
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();
    fetchAdminGroups();
  }, [fetchEvents, fetchAdminGroups]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleSort = (columnId: keyof Event | 'actions') => {
    const isAsc = sortConfig.key === columnId && sortConfig.direction === 'asc';
    setSortConfig({ key: columnId, direction: isAsc ? 'desc' : 'asc' });
  };

  const handleRequestLift = async (event: Event) => {
    const virtualId = String(event.id);
    if (processingEvents[virtualId]) return;

    const realId = event.realId || Number(event.id); 
    const dateStr = new Date(event.date).toISOString().split('T')[0];
    const currentStatus = eventStatus[virtualId];
    
    setProcessingEvents(prev => ({ ...prev, [virtualId]: true }));
    
    // Optimistic Update
    const newStatus = currentStatus === 'requested' ? null : 'requested';
    setEventStatus(prev => ({ ...prev, [virtualId]: newStatus }));

    try {
        if (currentStatus === 'requested') {
            await liftService.deleteRequest(realId, dateStr);
        } else {
            await liftService.createRequest(realId, dateStr);
        }
    } catch (err) {
        console.error('Failed to toggle lift request', err);
        alert('Failed to update request. Please try again.');
        // Revert
        setEventStatus(prev => ({ ...prev, [virtualId]: currentStatus }));
    } finally {
        setProcessingEvents(prev => ({ ...prev, [virtualId]: false }));
    }
  };

  const createOffer = async (realId: number, dateStr: string, virtualId: string, car: Car) => {
    if (processingEvents[virtualId]) return;
    setProcessingEvents(prev => ({ ...prev, [virtualId]: true }));

    // Optimistic
    setEventStatus(prev => ({ ...prev, [virtualId]: 'offered' }));
    setCarDialogOpen(false);
    setSelectedEventForOffer(null);

    try {
        await liftService.createOffer(realId, dateStr, car.id);
    } catch (err) {
        console.error(err);
        alert('Failed to create offer');
        setEventStatus(prev => ({ ...prev, [virtualId]: null }));
    } finally {
        setProcessingEvents(prev => ({ ...prev, [virtualId]: false }));
    }
  };

  const handleOfferLiftClick = (event: Event) => {
    const virtualId = String(event.id);
    const realId = event.realId || Number(event.id);
    const dateStr = new Date(event.date).toISOString().split('T')[0];
    const currentStatus = eventStatus[virtualId];
    
    if (currentStatus === 'offered') {
        if (confirm('Do you want to cancel your lift offer?')) {
             if (processingEvents[virtualId]) return;
             setProcessingEvents(prev => ({ ...prev, [virtualId]: true }));
             
             // Optimistic
             setEventStatus(prev => ({ ...prev, [virtualId]: null }));

             liftService.deleteOffer(realId, dateStr)
                .catch(err => {
                    console.error(err);
                    alert('Failed to cancel offer');
                    setEventStatus(prev => ({ ...prev, [virtualId]: 'offered' }));
                })
                .finally(() => {
                    setProcessingEvents(prev => ({ ...prev, [virtualId]: false }));
                });
        }
        return;
    }

    if (cars.length === 0) return; 

    const defaultCar = cars.find(c => c.isDefault);

    if (defaultCar) {
        createOffer(realId, dateStr, virtualId, defaultCar);
    } else if (cars.length === 1) {
        createOffer(realId, dateStr, virtualId, cars[0]);
    } else {
        setSelectedEventForOffer({ id: realId, date: dateStr });
        setCarDialogOpen(true);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

      {isLoading ? <InfoMessage message="Loading events..." /> : (
        <Stack spacing={4}>
          {Object.entries(sortedAndGroupedEvents).map(([groupId, groupData]) => (
            <Paper key={groupId} variant="outlined">
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Avatar 
                    src={getImageUrl(groupData.groupProfilePicture)}
                    alt={groupData.groupName}
                    sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}
                >
                    {groupData.groupName.charAt(0)}
                </Avatar>
                <Typography variant="h6">{groupData.groupName}</Typography>
              </Box>
              <CustomTable
                columns={columns}
                data={groupData.events}
                isLoading={false} // Parent handles loading
                sortConfig={sortConfig}
                onSort={handleSort}
                emptyMessage="No upcoming events for this group."
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
                  if (column.id === 'address') {
                    const addr = event.address;
                    if (!addr) return '-';
                    return (
                        <Box>
                            <Typography variant="body2">{addr.nickname || addr.city}</Typography>
                            {addr.nickname && <Typography variant="caption" color="text.secondary">{addr.street}</Typography>}
                        </Box>
                    );
                  }
                  if (column.id === 'actions') {
                    const virtualId = String(event.id);
                    const status = eventStatus[virtualId];
                    const isOffered = status === 'offered';
                    const isRequested = status === 'requested';
                    const isProcessing = processingEvents[virtualId];

                    return (
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                         <ButtonGroup size="small" variant="outlined" aria-label="event actions">
                            <Button 
                                color={isOffered ? "success" : "primary"}
                                variant={isOffered ? "contained" : "outlined"}
                                disabled={(!user?.isDriver && !isOffered) || isRequested || isProcessing}
                                onClick={() => handleOfferLiftClick(event)}
                            >
                                Offer Lift
                            </Button>
                            <Button 
                                color={isRequested ? "secondary" : "primary"}
                                variant={isRequested ? "contained" : "outlined"}
                                disabled={(isOffered && !isRequested) || isProcessing}
                                onClick={() => handleRequestLift(event)}
                            >
                                Request Lift
                            </Button>
                         </ButtonGroup>
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<InfoIcon />}
                          onClick={() => router.push(`/event-details?id=${event.realId || event.id}&date=${new Date(event.date).toISOString().split('T')[0]}`)}
                        >
                          Details
                        </Button>
                      </Stack>
                    );
                  }
                  return null;
                }}
              />
            </Paper>
          ))}
          {Object.keys(sortedAndGroupedEvents).length === 0 && !isLoading && (
            <InfoMessage message="No upcoming events found for your groups." />
          )}
        </Stack>
      )}

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

      {/* Car Selection Dialog */}
      <CarSelectionDialog
        open={carDialogOpen}
        onClose={() => { setCarDialogOpen(false); setSelectedEventForOffer(null); }}
        cars={cars}
        onSelect={(car) => {
            if (selectedEventForOffer) {
                // Reconstruct virtual ID for UI update
                const virtualId = `${selectedEventForOffer.id}_${selectedEventForOffer.date}`; 
                createOffer(selectedEventForOffer.id, selectedEventForOffer.date, virtualId, car);
            }
        }}
      />
    </PageContainer>
  );
}
