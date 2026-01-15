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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';

import PersonIcon from '@mui/icons-material/Person';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SaveIcon from '@mui/icons-material/Save';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ChatIcon from '@mui/icons-material/Chat';

import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import ErrorMessage from '@/components/shared/ui/ErrorMessage';
import InfoMessage from '@/components/shared/ui/InfoMessage';
import CustomSelect from '@/components/shared/ui/CustomSelect';
import { allocationService, AllocationPassenger, AllocationOffer, Group, Event } from '@/features/allocation/allocationService';
import CustomDialog from '@/components/shared/ui/CustomDialog';
import SubmitButton from '@/components/shared/ui/SubmitButton';
import CancelButton from '@/components/shared/ui/CancelButton';
import { groupService, PickupPoint } from '@/features/groups/groupService';
import AllocationMessageDialog from '@/features/allocation/AllocationMessageDialog';
import { getImageUrl } from '@/utils/images';

// Extend local state types to include tracking of new assignments
interface LocalAssignedPassenger {
    id: number;
    name: string;
    pickupTime?: string;
    pickupAddress?: string;
    pickupPointId?: number; // New field for tracking selection
    defaultAddressNickname?: string;
    location?: { lat: number; lng: number } | null;
    isSaved?: boolean;
}

interface LocalAllocationOffer extends Omit<AllocationOffer, 'passengers'> {
    passengers: LocalAssignedPassenger[];
    totalDistance?: string;
}

function AllocationContent() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | ''>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | ''>('');
  
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Staged State
  const [unassigned, setUnassigned] = useState<AllocationPassenger[]>([]);
  const [offers, setOffers] = useState<LocalAllocationOffer[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Message Dialog State
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedOfferForMessage, setSelectedOfferForMessage] = useState<LocalAllocationOffer | null>(null);

  // Distance Calculation
  const routesLib = useMapsLibrary('routes');
  const [offerDistances, setOfferDistances] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!routesLib || !selectedEvent || offers.length === 0) return;

    const calculateDistances = async () => {
      const service = new routesLib.DistanceMatrixService();
      const newDistances: Record<number, string> = { ...offerDistances };
      let changed = false;

      for (const offer of offers) {
        if (!offer.driverLocation) continue;
        
        // Unique destinations for this offer
        const destinations: google.maps.LatLngLiteral[] = [];
        const seenLocations = new Set<string>();

        offer.passengers.forEach(p => {
          let loc: { lat: number, lng: number } | null = null;
          if (p.pickupPointId) {
            const point = pickupPoints.find(pp => pp.id === p.pickupPointId);
            if (point && point.address.latitude && point.address.longitude) {
              loc = { lat: Number(point.address.latitude), lng: Number(point.address.longitude) };
            }
          } else if (p.location) {
            loc = p.location;
          }

          if (loc) {
            const key = `${loc.lat},${loc.lng}`;
            if (!seenLocations.has(key)) {
              seenLocations.add(key);
              destinations.push(loc);
            }
          }
        });

        if (destinations.length === 0) {
          if (newDistances[offer.id] !== '0 km') {
            newDistances[offer.id] = '0 km';
            changed = true;
          }
          continue;
        }

        try {
          const response = await service.getDistanceMatrix({
            origins: [offer.driverLocation],
            destinations: destinations,
            travelMode: google.maps.TravelMode.DRIVING,
          });

          if (response.rows[0]) {
            let totalMeters = 0;
            response.rows[0].elements.forEach(el => {
              if (el.status === 'OK') {
                totalMeters += el.distance.value;
              }
            });
            const distanceStr = `${(totalMeters / 1000).toFixed(1)} km`;
            if (newDistances[offer.id] !== distanceStr) {
              newDistances[offer.id] = distanceStr;
              changed = true;
            }
          }
        } catch (err) {
          // Silent catch
        }
      }

      if (changed) {
        setOfferDistances(newDistances);
      }
    };

    calculateDistances();
  }, [offers, routesLib, selectedEvent, pickupPoints]);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const data = await allocationService.getAdminGroups();
        setGroups(data.groups);
        if (data.groups.length > 0) {
          setSelectedGroup(data.groups[0].id);
        }
      } catch {
        setError('Failed to load admin groups');
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      const fetchGroupData = async () => {
        try {
          const [eventsData, pickupsData] = await Promise.all([
            allocationService.getEvents(Number(selectedGroup)),
            groupService.getPickupPoints(Number(selectedGroup))
          ]);
          
          setEvents(eventsData.events);
          setPickupPoints(pickupsData.pickups);

          if (eventsData.events.length > 0) {
              setSelectedEvent(eventsData.events[0].id);
          } else {
              setSelectedEvent('');
          }
          setUnassigned([]);
          setOffers([]);
        } catch {
          setError('Failed to load group data');
        }
      };
      fetchGroupData();
    }
  }, [selectedGroup]);

  const loadEventData = useCallback(async (eventId: number) => {
    setDataLoading(true);
    try {
      const data = await allocationService.getAllocationData(eventId);
      setUnassigned(data.unassigned);
      
      // Mark loaded offers as saved
      const savedOffers = data.offers.map(o => ({
        ...o,
        passengers: o.passengers.map(p => ({ ...p, isSaved: true }))
      }));
      
      setOffers(savedOffers);
      setHasChanges(false);
    } catch {
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

  // Trigger Assignment Flow
  const initiateAssignment = (passenger: AllocationPassenger, offerId: number) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;
    
    if (offer.passengers.length >= offer.totalSeats) {
        alert('This car is already full!');
        return;
    }

    confirmAssignment(passenger, offerId, undefined);
  };

  const confirmAssignment = (
      passenger: AllocationPassenger, 
      offerId: number, 
      pickupPointId?: number
  ) => {
    setUnassigned(prev => prev.filter(p => p.id !== passenger.id));
    setOffers(prev => prev.map(o => {
      if (o.id === offerId) {
        // Resolve address display for UI feedback
        let displayAddress = 'Default / Home';
        if (pickupPointId) {
            const point = pickupPoints.find(p => p.id === pickupPointId);
            if (point) displayAddress = point.address.nickname || point.address.street;
        }

        return {
          ...o,
          passengers: [...o.passengers, { 
              id: passenger.passengerId, 
              name: passenger.name,
              pickupPointId: pickupPointId,
              pickupAddress: displayAddress,
              defaultAddressNickname: passenger.defaultAddressNickname || 'Home',
              location: passenger.location,
              isSaved: false
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

    const restoredPassenger: AllocationPassenger = {
        id: Math.random(), 
        passengerId: passenger.id,
        name: passenger.name,
        profilePicture: null 
    };
    
    setUnassigned(prev => [...prev, restoredPassenger]);
    setHasChanges(true);
  };

  const handlePassengerPickupChange = (offerId: number, passengerId: number, pointId: number | '') => {
    const point = pickupPoints.find(p => p.id === Number(pointId));
    const displayAddress = point ? (point.address.nickname || point.address.street) : 'Default / Home';

    setOffers(prev => prev.map(o => {
      if (o.id === offerId) {
        return {
          ...o,
          passengers: o.passengers.map(p => {
            if (p.id === passengerId) {
                return {
                    ...p,
                    pickupPointId: pointId ? Number(pointId) : undefined,
                    pickupAddress: displayAddress
                };
            }
            return p;
          })
        };
      }
      return o;
    }));
    setHasChanges(true);
  };

  const handleAutoAssign = () => {
    const localUnassigned = [...unassigned];
    const localOffers = offers.map(o => ({ ...o, passengers: [...o.passengers] }));
    
    localOffers.forEach(offer => {
        const space = offer.totalSeats - offer.passengers.length;
        if (space > 0 && localUnassigned.length > 0) {
            const toAssign = localUnassigned.splice(0, space);
            offer.passengers.push(...toAssign.map(p => ({ 
                id: p.passengerId, 
                name: p.name,
                // Auto assign uses default
                pickupAddress: 'Default / Home'
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
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to clear allocations';
        setError(message);
    } finally {
        setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const assignments = offers.flatMap(o => 
        o.passengers.map(p => ({ 
            passengerId: p.id, 
            liftOfferId: o.id, 
            pickupPointId: p.pickupPointId 
        }))
      );
      
      await allocationService.commitAssignments(Number(selectedEvent), assignments);
      setSuccess('Assignments saved successfully!');
      setHasChanges(false);
      loadEventData(Number(selectedEvent));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save assignments';
      setError(message);
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
                                                    onChange={(e) => initiateAssignment(p, Number(e.target.value))}
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
                                                {offerDistances[offer.id] && (
                                                    <Chip 
                                                        label={offerDistances[offer.id]} 
                                                        size="small" 
                                                        color="info" 
                                                        variant="outlined" 
                                                        sx={{ height: 20, fontSize: '0.65rem' }}
                                                    />
                                                )}
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
                                    
                                    <Stack spacing={2}>
                                        {offer.passengers.map(p => (
                                            <Stack 
                                                key={p.id} 
                                                direction={{ xs: 'column', sm: 'row' }} 
                                                spacing={1} 
                                                alignItems={{ xs: 'stretch', sm: 'center' }}
                                                sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}
                                            >
                                                <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 120 }}>
                                                    {p.name}
                                                </Typography>
                                                
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <CustomSelect
                                                        label="Pickup Location"
                                                        value={p.pickupPointId || ''}
                                                        onChange={(e) => handlePassengerPickupChange(offer.id, p.id, e.target.value as number | '')}
                                                        size="small"
                                                        fullWidth
                                                        disabled={p.isSaved}
                                                    >
                                                        <MenuItem value="">
                                                            <em>{p.defaultAddressNickname || 'Home'} (Default)</em>
                                                        </MenuItem>
                                                        {pickupPoints.map(point => (
                                                            <MenuItem key={point.id} value={point.id}>
                                                                {point.address.nickname ? `${point.address.nickname} - ${point.address.street}` : point.address.street} {point.time ? `(${new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}
                                                            </MenuItem>
                                                        ))}
                                                    </CustomSelect>
                                                </Box>

                                                <IconButton 
                                                    size="small" 
                                                    color="error"
                                                    onClick={() => handleRemovePassenger(p.id, offer.id)}
                                                    title="Remove Passenger"
                                                >
                                                    <RemoveCircleOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        ))}

                                        {Array.from({ length: Math.max(0, offer.totalSeats - offer.passengers.length) }).map((_, i) => (
                                            <Stack 
                                                key={`empty-${i}`}
                                                direction="row" 
                                                alignItems="center" 
                                                spacing={2}
                                                sx={{ p: 1, border: '1px dashed', borderColor: 'text.disabled', borderRadius: 1 }}
                                            >
                                                <DirectionsCarIcon color="disabled" fontSize="small" />
                                                <Typography variant="body2" color="text.secondary">
                                                    Empty Seat
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
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
                        {loading ? 'Saving...' : 'Save assignments'}
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

export default function AllocationConsolePage() {
    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
            <AllocationContent />
        </APIProvider>
    );
}