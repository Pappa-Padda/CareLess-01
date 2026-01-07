'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import PersonIcon from '@mui/icons-material/Person';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SaveIcon from '@mui/icons-material/Save';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ChatIcon from '@mui/icons-material/Chat';

import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import ErrorMessage from '@/components/shared/ui/ErrorMessage';
import InfoMessage from '@/components/shared/ui/InfoMessage';
import CustomSelect from '@/components/shared/ui/CustomSelect';
import { allocationService, AllocationPassenger, AllocationOffer } from '@/features/allocation/allocationService';
import AllocationMessageDialog from '@/features/allocation/AllocationMessageDialog';
import { getImageUrl } from '@/utils/images';

export default function AllocationConsolePage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | ''>('');
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | ''>('');
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Staged State
  const [unassigned, setUnassigned] = useState<AllocationPassenger[]>([]);
  const [offers, setOffers] = useState<AllocationOffer[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Message Dialog State
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedOfferForMessage, setSelectedOfferForMessage] = useState<AllocationOffer | null>(null);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const data = await allocationService.getAdminGroups();
        setGroups(data.groups);
        if (data.groups.length > 0) {
          setSelectedGroup(data.groups[0].id);
        }
      } catch (err) {
        setError('Failed to load admin groups');
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      const fetchEvents = async () => {
        try {
          const data = await allocationService.getEvents(Number(selectedGroup));
          setEvents(data.events);
          if (data.events.length > 0) {
              setSelectedEvent(data.events[0].id);
          } else {
              setSelectedEvent('');
          }
          setUnassigned([]);
          setOffers([]);
        } catch (err) {
          setError('Failed to load events');
        }
      };
      fetchEvents();
    }
  }, [selectedGroup]);

  const loadEventData = useCallback(async (eventId: number) => {
    setDataLoading(true);
    try {
      const data = await allocationService.getAllocationData(eventId);
      setUnassigned(data.unassigned);
      setOffers(data.offers);
      setHasChanges(false);
    } catch (err) {
      setError('Failed to load allocation data');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadEventData(Number(selectedEvent));
    }
  }, [selectedEvent, loadEventData]);

  const handleManualAssign = (passenger: AllocationPassenger, offerId: number) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;
    
    if (offer.passengers.length >= offer.totalSeats) {
        alert('This car is already full!');
        return;
    }

    setUnassigned(prev => prev.filter(p => p.id !== passenger.id));
    setOffers(prev => prev.map(o => {
      if (o.id === offerId) {
        return {
          ...o,
          passengers: [...o.passengers, { 
              id: passenger.passengerId, 
              name: passenger.name,
              // Default/empty for newly assigned until saved/reloaded
              pickupTime: undefined,
              pickupAddress: undefined
            }]
        };
      }
      return o;
    }));
    setHasChanges(true);
  };

  const handleRemovePassenger = (passengerId: number, offerId: number) => {
    const offer = offers.find(o => o.id === offerId);
    const passenger = offer?.passengers.find(p => p.id === passengerId);
    
    if (!offer || !passenger) return;

    // Remove from offer
    setOffers(prev => prev.map(o => {
      if (o.id === offerId) {
        return {
          ...o,
          passengers: o.passengers.filter(p => p.id !== passengerId)
        };
      }
      return o;
    }));

    // Add back to unassigned
    // We construct the AllocationPassenger object from the removed passenger data
    // Note: We might be missing profilePicture if it wasn't preserved, but name/id are key.
    // Ideally we should have full objects, but for now this fixes the logic error.
    const restoredPassenger: AllocationPassenger = {
        id: Math.random(), // Temporary ID for list key until reload
        passengerId: passenger.id,
        name: passenger.name,
        profilePicture: null // Cannot recover this without fuller state, but functional for re-assign
    };
    
    setUnassigned(prev => [...prev, restoredPassenger]);
    setHasChanges(true);
  };

  const handleAutoAssign = () => {
    let localUnassigned = [...unassigned];
    let localOffers = offers.map(o => ({ ...o, passengers: [...o.passengers] }));
    let totalSeats = localOffers.reduce((sum, o) => sum + (o.totalSeats - o.passengers.length), 0);

    if (localUnassigned.length > totalSeats) {
        setError(`Not enough seats! ${localUnassigned.length - totalSeats} passengers will remain unassigned.`);
    }

    localOffers.forEach(offer => {
        const space = offer.totalSeats - offer.passengers.length;
        if (space > 0 && localUnassigned.length > 0) {
            const toAssign = localUnassigned.splice(0, space);
            offer.passengers.push(...toAssign.map(p => ({ 
                id: p.passengerId, 
                name: p.name,
                pickupTime: undefined,
                pickupAddress: undefined
            })));
        }
    });

    setUnassigned(localUnassigned);
    setOffers(localOffers);
    setHasChanges(true);
  };

  const handleClearAllocations = async () => {
    if (!confirm('Are you sure you want to clear ALL allocations for this event? This action cannot be undone.')) {
        return;
    }
    setLoading(true);
    try {
        await allocationService.clearAllocations(Number(selectedEvent));
        setSuccess('All allocations cleared successfully!');
        loadEventData(Number(selectedEvent));
    } catch (err: any) {
        setError(err.message || 'Failed to clear allocations');
    } finally {
        setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const assignments = offers.flatMap(o => 
        o.passengers.map(p => ({ passengerId: p.id, liftOfferId: o.id }))
      );
      
      await allocationService.commitAssignments(Number(selectedEvent), assignments);
      setSuccess('Assignments saved successfully!');
      setHasChanges(false);
      loadEventData(Number(selectedEvent));
    } catch (err: any) {
      setError(err.message || 'Failed to save assignments');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get event details
  const currentEvent = events.find(e => e.id === selectedEvent);

  return (
    <PageContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageHeading>Allocation Console</PageHeading>
        {selectedEvent && (
            <Button 
                variant="outlined" 
                color="error" 
                startIcon={<RemoveCircleOutlineIcon />}
                onClick={handleClearAllocations}
            >
                Clear All Allocations
            </Button>
        )}
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
            <CustomSelect
                label="Select Group"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value as number)}
            >
                {groups.map(g => (
                    <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                ))}
            </CustomSelect>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
            <CustomSelect
                label="Select Event"
                value={selectedEvent}
                disabled={!selectedGroup}
                onChange={(e) => setSelectedEvent(e.target.value as number)}
            >
                {events.map(e => (
                    <MenuItem key={e.id} value={e.id}>
                        {new Date(e.date).toLocaleDateString()} - {e.name}
                    </MenuItem>
                ))}
            </CustomSelect>
        </Grid>
      </Grid>

      <ErrorMessage message={error} onClose={() => setError(null)} />
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {!selectedEvent ? (
          <InfoMessage message="Select a group and an event to start allocating passengers." />
      ) : dataLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
      ) : (
        <>
            <Grid container spacing={3}>
                {/* Unassigned Passengers */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper 
                        sx={{ 
                            p: 2, 
                            height: '100%', 
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                            borderRadius: 2
                        }} 
                        variant="outlined"
                    >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="h6" fontWeight="bold">
                                Unassigned ({unassigned.length})
                            </Typography>
                            <Button 
                                variant="contained" 
                                size="small" 
                                startIcon={<AutoFixHighIcon />}
                                onClick={handleAutoAssign}
                                disabled={unassigned.length === 0}
                            >
                                Auto Allocate
                            </Button>
                        </Stack>
                        <Divider sx={{ mb: 2 }} />
                        <Stack spacing={1.5}>
                            {unassigned.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                    All passengers assigned!
                                </Typography>
                            ) : (
                                unassigned.map(p => (
                                    <Paper key={p.id} sx={{ p: 1.5, borderRadius: 1 }} variant="outlined">
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Avatar src={getImageUrl(p.profilePicture)} sx={{ width: 32, height: 32 }}>
                                                <PersonIcon fontSize="small" />
                                            </Avatar>
                                            <Typography variant="body2" fontWeight="medium" sx={{ flexGrow: 1 }}>
                                                {p.name}
                                            </Typography>
                                            <FormControl size="small" sx={{ minWidth: 100 }}>
                                                <InputLabel sx={{ fontSize: '0.7rem' }}>Assign</InputLabel>
                                                <Select
                                                    label="Assign"
                                                    value=""
                                                    onChange={(e) => handleManualAssign(p, Number(e.target.value))}
                                                    sx={{ fontSize: '0.75rem' }}
                                                >
                                                    {offers.filter(o => o.passengers.length < o.totalSeats).map(o => (
                                                        <MenuItem key={o.id} value={o.id} sx={{ fontSize: '0.75rem' }}>
                                                            {o.driverName}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Stack>
                                    </Paper>
                                ))
                            )}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Drivers / Offers */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Stack spacing={2}>
                        {offers.length === 0 ? (
                            <InfoMessage message="No lift offers found for this event." />
                        ) : (
                            offers.map(offer => (
                                <Paper key={offer.id} sx={{ p: 2, borderRadius: 2 }} variant="outlined">
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                        <Avatar src={getImageUrl(offer.driverProfilePicture)}>
                                            <PersonIcon />
                                        </Avatar>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {offer.driverName}
                                                </Typography>
                                                <Tooltip title="Generate WhatsApp Message">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => {
                                                            setSelectedOfferForMessage(offer);
                                                            setMessageDialogOpen(true);
                                                        }}
                                                    >
                                                        <ChatIcon fontSize="small" color="primary" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                            <Typography variant="caption" color="text.secondary">
                                                {offer.carInfo} • {offer.totalSeats} Seats
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="h6" color={offer.passengers.length >= offer.totalSeats ? 'error.main' : 'primary.main'}>
                                                {offer.passengers.length} / {offer.totalSeats}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">Occupied</Typography>
                                        </Box>
                                    </Stack>
                                    <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {offer.passengers.map(p => (
                                            <Chip 
                                                key={p.id}
                                                label={p.name}
                                                onDelete={() => handleRemovePassenger(p.id, offer.id)}
                                                size="small"
                                                color="primary"
                                                variant="filled"
                                            />
                                        ))}
                                        {Array.from({ length: Math.max(0, offer.totalSeats - offer.passengers.length) }).map((_, i) => (
                                            <Chip 
                                                key={`empty-${i}`}
                                                label="Empty"
                                                variant="outlined"
                                                size="small"
                                                disabled
                                                icon={<DirectionsCarIcon fontSize="small" />}
                                            />
                                        ))}
                                    </Box>
                                </Paper>
                            ))
                        )}
                    </Stack>
                </Grid>
            </Grid>

            {/* Bottom Actions */}
            {hasChanges && (
                <Box sx={{ mt: 4, p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        size="large"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={loading}
                        sx={{ minWidth: 250 }}
                    >
                        {loading ? 'Saving...' : 'Confirm & Save Assignments'}
                    </Button>
                </Box>
            )}

            <AllocationMessageDialog 
                open={messageDialogOpen}
                onClose={() => setMessageDialogOpen(false)}
                offer={selectedOfferForMessage}
                eventName={currentEvent?.name || ''}
                eventDate={currentEvent?.date || ''}
            />
        </>
      )}
    </PageContainer>
  );
}
