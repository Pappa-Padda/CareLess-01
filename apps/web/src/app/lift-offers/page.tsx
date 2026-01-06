'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import { useRouter } from 'next/navigation';

import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneIcon from '@mui/icons-material/Phone';
import MapIcon from '@mui/icons-material/Map';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LinkIcon from '@mui/icons-material/Link';

import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import ErrorMessage from '@/components/shared/ui/ErrorMessage';
import InfoMessage from '@/components/shared/ui/InfoMessage';
import { useAuth } from '@/context/AuthContext';
import { liftService, DriverDashboardOffer } from '@/features/lifts/liftService';
import { formatTime } from '@/utils/time';
import { getImageUrl } from '@/utils/images';

export default function MyLiftOffersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [offers, setOffers] = useState<DriverDashboardOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await liftService.getDriverDashboard();
      setOffers(data.offers);
    } catch (err) {
      console.error('Failed to fetch driver dashboard:', err);
      setError('Failed to load your lift offers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleDeleteOffer = async (offer: DriverDashboardOffer) => {
    if (!confirm('Are you sure you want to cancel this lift offer? This will remove all assigned passengers.')) {
      return;
    }

    try {
      await liftService.deleteOffer(offer.event.id, offer.date);
      setOffers(prev => prev.filter(o => o.id !== offer.id));
    } catch (err) {
      console.error('Failed to delete offer:', err);
      setError('Failed to cancel offer. Please try again.');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  if (!user) {
    return (
      <PageContainer>
        <InfoMessage message="Please sign in to view your lift offers." />
      </PageContainer>
    );
  }

  if (!user.isDriver) {
    return (
        <PageContainer>
            <InfoMessage 
                message="You are not registered as a driver. Register a car to start offering lifts." 
                action={
                    <Button variant="contained" onClick={() => router.push('/cars')}>
                        Register Car
                    </Button>
                }
            />
        </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageHeading>My Lift Offers</PageHeading>
        <Button 
            variant="outlined" 
            startIcon={<EventIcon />}
            onClick={() => router.push('/event-list')}
        >
            Find Events
        </Button>
      </Box>

      <ErrorMessage message={error} onClose={() => setError(null)} />

      {isLoading ? (
        <InfoMessage message="Loading your offers..." />
      ) : offers.length === 0 ? (
        <InfoMessage
          message="You have no upcoming lift offers."
          action={
            <Button variant="contained" onClick={() => router.push('/event-list')}>
              Offer a Lift
            </Button>
          }
        />
      ) : (
        <Stack spacing={4}>
          {offers.map(offer => (
            <Paper key={offer.id} variant="outlined" sx={{ overflow: 'hidden' }}>
              {/* Header */}
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar 
                            src={getImageUrl(offer.event.group.profilePicture)}
                            alt={offer.event.group.name}
                            sx={{ width: 40, height: 40 }}
                        >
                            {offer.event.group.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>
                                {offer.event.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {offer.event.group.name} • {formatDate(offer.date)}
                            </Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="View Route Map">
                            <IconButton color="primary" onClick={() => router.push(`/route?offerId=${offer.id}`)}>
                                <MapIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel Offer">
                            <IconButton color="error" onClick={() => handleDeleteOffer(offer)}>
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>
              </Box>

              <Grid container>
                {/* Left Column: Car & Info */}
                <Grid size={{ xs: 12, md: 4 }} sx={{ p: 2, borderRight: { md: '1px solid' }, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>LOGISTICS</Typography>
                    
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DirectionsCarIcon color="action" fontSize="small" />
                            <Box>
                                <Typography variant="body2" fontWeight="bold">
                                    {offer.car.make} {offer.car.model}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {offer.car.licensePlate}
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon color="action" fontSize="small" />
                            <Typography variant="body2">
                                Event: {formatTime(offer.event.startTime)} - {formatTime(offer.event.endTime)}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon color="action" fontSize="small" />
                            <Typography variant="body2">
                                Seats: {offer.passengers.length} / {offer.passengers.length + offer.availableSeats} filled
                            </Typography>
                        </Box>
                        
                        {offer.notes && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, bgcolor: 'info.lighter', p: 1, borderRadius: 1 }}>
                                <InfoIcon color="info" fontSize="small" sx={{ mt: 0.2 }} />
                                <Typography variant="caption">{offer.notes}</Typography>
                            </Box>
                        )}
                    </Stack>
                </Grid>

                {/* Right Column: Passengers */}
                <Grid size={{ xs: 12, md: 8 }} sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        PASSENGERS ({offer.passengers.length})
                    </Typography>

                    {offer.passengers.length === 0 ? (
                        <Box sx={{ py: 4, textAlign: 'center', opacity: 0.6 }}>
                            <Typography variant="body2">No passengers assigned yet.</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            {offer.passengers.map(p => (
                                <Paper key={p.id} variant="outlined" sx={{ p: 1.5, position: 'relative' }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar src={getImageUrl(p.profilePicture)} sx={{ width: 48, height: 48 }}>
                                            <PersonIcon />
                                        </Avatar>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Typography variant="body1" fontWeight="bold">{p.name}</Typography>
                                                {p.isConfirmed ? (
                                                    <Tooltip title="Passenger Confirmed">
                                                        <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                                                    </Tooltip>
                                                ) : (
                                                    <Chip label="Pending Confirmation" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                                                )}
                                            </Stack>
                                            
                                            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                                                <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    Pickup at {formatTime(p.pickup.time)}: {p.pickup.address.street}, {p.pickup.address.city}
                                                </Typography>
                                                {p.pickup.address.link && (
                                                    <IconButton 
                                                        size="small" 
                                                        component="a" 
                                                        href={p.pickup.address.link} 
                                                        target="_blank"
                                                        sx={{ p: 0 }}
                                                    >
                                                        <LinkIcon sx={{ fontSize: 14 }} color="primary" />
                                                    </IconButton>
                                                )}
                                            </Stack>
                                        </Box>
                                        <Box>
                                            {p.phoneNumber && (
                                                <Tooltip title={`Call ${p.name}`}>
                                                    <IconButton 
                                                        color="primary" 
                                                        component="a" 
                                                        href={`tel:${p.phoneNumber}`}
                                                        size="small"
                                                        sx={{ bgcolor: alpha('#1976d2', 0.1) }}
                                                    >
                                                        <PhoneIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>
      )}
    </PageContainer>
  );
}

function alpha(color: string, opacity: number) {
    // Simple mock for alpha since we don't have the MUI one easily here
    return color + Math.round(opacity * 255).toString(16).padStart(2, '0');
}
