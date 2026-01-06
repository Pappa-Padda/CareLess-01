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
import { useRouter } from 'next/navigation';

import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LinkIcon from '@mui/icons-material/Link';
import PendingIcon from '@mui/icons-material/Pending';

import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import ErrorMessage from '@/components/shared/ui/ErrorMessage';
import InfoMessage from '@/components/shared/ui/InfoMessage';
import { useAuth } from '@/context/AuthContext';
import {
  liftService,
  DashboardItem,
  DashboardAllocationItem,
  DashboardRequestItem,
} from '@/features/lifts/liftService';
import { formatTime } from '@/utils/time';
import { getImageUrl } from '@/utils/images';

export default function MyLiftsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rides, setRides] = useState<DashboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingItems, setProcessingItems] = useState<Record<string, boolean>>({});

  const fetchDashboard = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await liftService.getPassengerDashboard();
      setRides(data.rides);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      setError('Failed to load your lifts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleConfirmSeat = async (allocationItem: DashboardAllocationItem) => {
    if (processingItems[allocationItem.id]) return;

    setProcessingItems(prev => ({ ...prev, [allocationItem.id]: true }));
    try {
      await liftService.confirmAllocation(allocationItem.allocationId);
      // Optimistically update
      setRides(prevRides =>
        prevRides.map(item =>
          item.id === allocationItem.id && item.type === 'allocation'
            ? { ...item, isConfirmed: true, status: 'CONFIRMED' }
            : item
        )
      );
    } catch (err) {
      console.error('Failed to confirm seat:', err);
      setError('Failed to confirm seat. Please try again.');
    } finally {
      setProcessingItems(prev => ({ ...prev, [allocationItem.id]: false }));
    }
  };

  const handleDeclineSeat = async (allocationItem: DashboardAllocationItem) => {
    if (processingItems[allocationItem.id]) return;

    if (!confirm('Are you sure you want to decline this ride? This action cannot be undone.')) {
      return;
    }

    setProcessingItems(prev => ({ ...prev, [allocationItem.id]: true }));
    try {
      await liftService.declineAllocation(allocationItem.allocationId);
      // Optimistically remove
      setRides(prevRides => prevRides.filter(item => item.id !== allocationItem.id));
    } catch (err) {
      console.error('Failed to decline seat:', err);
      setError('Failed to decline seat. Please try again.');
    } finally {
      setProcessingItems(prev => ({ ...prev, [allocationItem.id]: false }));
    }
  };

  const handleCancelRequest = async (requestItem: DashboardRequestItem) => {
    if (processingItems[requestItem.id]) return;

    if (!confirm('Are you sure you want to cancel this lift request?')) {
      return;
    }

    setProcessingItems(prev => ({ ...prev, [requestItem.id]: true }));
    try {
      await liftService.deleteRequest(requestItem.requestId, requestItem.date); // Request ID is LiftRequest.id
      // Optimistically remove
      setRides(prevRides => prevRides.filter(item => item.id !== requestItem.id));
    } catch (err) {
      console.error('Failed to cancel request:', err);
      setError('Failed to cancel request. Please try again.');
    } finally {
      setProcessingItems(prev => ({ ...prev, [requestItem.id]: false }));
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
        <InfoMessage message="Please sign in to view your lifts." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeading>My Lifts</PageHeading>
      <ErrorMessage message={error} onClose={() => setError(null)} />

      {isLoading ? (
        <InfoMessage message="Loading your lifts..." />
      ) : rides.length === 0 ? (
        <InfoMessage
          message="You have no upcoming rides or pending requests."
          action={
            <Button variant="contained" onClick={() => router.push('/event-list')}>
              Find Rides
            </Button>
          }
        />
      ) : (
        <Stack spacing={3} sx={{ mt: 3 }}>
          {rides.map(item => (
            <Paper key={item.id} variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar 
                        src={getImageUrl(item.event.group.profilePicture)}
                        alt={item.event.group.name}
                        sx={{ width: 40, height: 40 }}
                    >
                        {item.event.group.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>
                            {item.event.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {item.event.group.name}
                        </Typography>
                    </Box>
                </Stack>
                <Chip
                  label={item.status === 'PENDING' ? 'Pending Request' : (item.isConfirmed ? 'Confirmed' : 'Assigned')}
                  color={item.status === 'PENDING' ? 'warning' : (item.isConfirmed ? 'success' : 'info')}
                  size="small"
                />
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {formatDate(item.date)} from {formatTime(item.event.startTime)} to {formatTime(item.event.endTime)}
              </Typography>

              {item.type === 'allocation' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">Ride Details</Typography>
                  <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                    <Avatar src={getImageUrl(item.driver.profilePicture)} sx={{ width: 24, height: 24 }}>
                        <PersonIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="body2">{item.driver.name}</Typography>
                    {item.driver.phoneNumber && (
                        <Tooltip title={`Call ${item.driver.name}`}>
                            <IconButton href={`tel:${item.driver.phoneNumber}`} size="small" color="primary">
                                <PhoneIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                    <DirectionsCarIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {item.car.make} {item.car.model} ({item.car.licensePlate}) - {item.car.seatCapacity} seats
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      Pickup at {item.pickup.address.street}, {item.pickup.address.city} at {formatTime(item.pickup.time)}
                    </Typography>
                    {item.pickup.address.link && (
                        <Tooltip title={item.pickup.address.link}>
                            <IconButton
                                component="a"
                                href={item.pickup.address.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                color="primary"
                                size="small"
                            >
                                <LinkIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                  </Stack>

                  <Stack direction="row" spacing={1} mt={2}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleConfirmSeat(item)}
                      disabled={item.isConfirmed || processingItems[item.id]}
                    >
                      {item.isConfirmed ? 'Seat Confirmed' : 'Confirm Seat'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => handleDeclineSeat(item)}
                      disabled={item.isConfirmed || processingItems[item.id]}
                    >
                      Decline
                    </Button>
                  </Stack>
                </Box>
              )}

              {item.type === 'request' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">Request Details</Typography>
                  <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                    <PendingIcon fontSize="small" color="action" />
                    <Typography variant="body2">Waiting for driver assignment.</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} mt={2}>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => handleCancelRequest(item)}
                      disabled={processingItems[item.id]}
                    >
                      Cancel Request
                    </Button>
                  </Stack>
                </Box>
              )}
            </Paper>
          ))}
        </Stack>
      )}
    </PageContainer>
  );
}
