'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import CircularProgress from '@mui/material/CircularProgress';
import { APIProvider, Map, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useSearchParams, useRouter } from 'next/navigation';

import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import InfoMessage from '@/components/shared/ui/InfoMessage';
import CustomSelect from '@/components/shared/ui/CustomSelect';
import ErrorMessage from '@/components/shared/ui/ErrorMessage';
import Routes from '@/features/maps/components/Routes';
import MapController from '@/features/maps/components/MapController';

import { useAuth } from '@/context/AuthContext';
import { liftService, DriverDashboardOffer } from '@/features/lifts/liftService';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface RouteStep {
  label: string;
  address: string;
  time?: string;
  distance?: string;
  location?: { lat: number; lng: number };
}

function RouteViewContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const geocodingLib = useMapsLibrary('geocoding');
  
  const [offers, setOffers] = useState<DriverDashboardOffer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<number | ''>('');
  const [defaultAddress, setDefaultAddress] = useState<string | null>(null);
  const [originLocation, setOriginLocation] = useState<{ lat: number; lng: number } | string | null>(null);
  
  // Map State
  const [initialCenter, setInitialCenter] = useState<{ lat: number, lng: number }>({ lat: -26.2041, lng: 28.0473 });
  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number } | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(11);
  
  const [loading, setLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState<google.maps.DirectionsRoute | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Helper to save coordinates back to the database
  const saveCoordinates = async (addressId: number, lat: number, lng: number) => {
    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/addresses/${addressId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: lat, longitude: lng }),
            credentials: 'include',
        });
    } catch (err) {
        console.error('Failed to save geocoded coordinates', err);
    }
  };

  // Fetch Data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
        try {
            setLoading(true);
            setMapError(null);
            // 1. Fetch Offers
            const dashboardData = await liftService.getDriverDashboard();
            setOffers(dashboardData.offers);

            // 2. Fetch User Addresses to find default
            const addrRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/addresses`, {
                credentials: 'include',
            });
            if (addrRes.ok) {
                const addresses = await addrRes.json();
                const def = addresses.find((a: any) => a.isDefault) || addresses[0];
                if (def) {
                    const addrString = `${def.street}, ${def.city}, ${def.postalCode}`;
                    setDefaultAddress(addrString);
                    
                    if (def.latitude && def.longitude) {
                        const center = { 
                            lat: parseFloat(def.latitude), 
                            lng: parseFloat(def.longitude) 
                        };
                        setInitialCenter(center);
                        setMapCenter(center); 
                        setMapZoom(13);
                        setOriginLocation(center);
                    } else if (geocodingLib) {
                        // LAZY GEOCODE: Address exists but no coords
                        const geocoder = new geocodingLib.Geocoder();
                        const geoRes = await geocoder.geocode({ address: addrString });
                        if (geoRes.results && geoRes.results.length > 0) {
                            const loc = geoRes.results[0].geometry.location;
                            const coords = { lat: loc.lat(), lng: loc.lng() };
                            
                            setInitialCenter(coords);
                            setMapCenter(coords);
                            setMapZoom(13);
                            setOriginLocation(coords);

                            // Save for next time
                            saveCoordinates(def.id, coords.lat, coords.lng);
                        } else {
                            setOriginLocation(addrString);
                        }
                    } else {
                        setOriginLocation(addrString);
                    }
                }
            }

            // 3. Set Selected Offer from URL or Default
            const paramId = searchParams.get('offerId');
            if (paramId) {
                setSelectedOfferId(Number(paramId));
            } else if (dashboardData.offers.length > 0) {
                setSelectedOfferId(dashboardData.offers[0].id);
            }

        } catch (err) {
            console.error('Failed to load route data', err);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [user, searchParams, geocodingLib]);

  const selectedOffer = useMemo(() => 
    offers.find(o => o.id === Number(selectedOfferId)), 
  [offers, selectedOfferId]);

  const handleOfferChange = (e: any) => {
      const newId = e.target.value;
      setSelectedOfferId(newId);
      router.replace(`/route?offerId=${newId}`);
      setRouteInfo(null);
      setMapError(null);
  };

  const handleMapError = (error: any) => {
      console.error("Map Error Callback:", error);
      if (error?.code === 'REQUEST_DENIED') {
          setMapError("Google Maps Directions API is not enabled for this API Key. Please enable both 'Directions API' and 'Routes API' in Google Cloud Console.");
      } else if (error?.code === 'ZERO_RESULTS') {
          setMapError("No route could be found between these locations.");
      } else {
          setMapError("Failed to calculate route. Please try again.");
      }
  };

  const handleStepClick = (step: RouteStep) => {
      if (step.location) {
          setMapCenter(step.location);
          setMapZoom(16); // Zoom in close
      }
  };

  const formatAddress = (addr: any) => {
      if (!addr) return '';
      return `${addr.street}, ${addr.city}, ${addr.postalCode}`;
  };

  const waypoints = useMemo(() => {
      if (!selectedOffer) return [];
      return selectedOffer.passengers.map(p => formatAddress(p.pickup.address));
  }, [selectedOffer]);

  const steps: RouteStep[] = useMemo(() => {
      if (!selectedOffer || !defaultAddress || !routeInfo) return [];
      
      const info = routeInfo as any;
      const indices: number[] = info.optimizedIntermediateWaypointIndex || 
                                selectedOffer.passengers.map((_, i) => i);
      
      const orderedWaypoints = indices.map(index => selectedOffer.passengers[index]);
      
      const result: RouteStep[] = [];

      // 1. Start
      // Routes API leg[0].startLocation
      let startLoc = mapCenter || initialCenter; // Fallback
      if (info.legs && info.legs.length > 0 && info.legs[0].startLocation?.latLng) {
          startLoc = {
              lat: info.legs[0].startLocation.latLng.latitude,
              lng: info.legs[0].startLocation.latLng.longitude
          };
      }

      result.push({
          label: 'Start: Your Location',
          address: defaultAddress,
          time: 'Departure',
          location: startLoc
      });

      // 2. Pickups
      orderedWaypoints.forEach((p, i) => {
          const leg = info.legs ? info.legs[i] : null;
          let dist = '';
          let dur = '';
          let loc = undefined;

          if (leg) {
              const meters = leg.distanceMeters;
              const seconds = parseInt(leg.duration?.replace('s', '') || '0');
              dist = meters ? `${(meters / 1000).toFixed(1)} km` : '';
              dur = seconds ? `${Math.round(seconds / 60)} mins` : '';
              
              // End of this leg is the stop
              if (leg.endLocation?.latLng) {
                  loc = {
                      lat: leg.endLocation.latLng.latitude,
                      lng: leg.endLocation.latLng.longitude
                  };
              }
          }

          result.push({
              label: `Pickup: ${p.name}`,
              address: formatAddress(p.pickup.address),
              distance: dist,
              time: dur,
              location: loc
          });
      });

      // 3. Destination
      const lastLeg = info.legs ? info.legs[info.legs.length - 1] : null;
      let endDist = '';
      let endDur = '';
      let endLoc = undefined;
      if (lastLeg) {
          const meters = lastLeg.distanceMeters;
          const seconds = parseInt(lastLeg.duration?.replace('s', '') || '0');
          endDist = meters ? `${(meters / 1000).toFixed(1)} km` : '';
          endDur = seconds ? `${Math.round(seconds / 60)} mins` : '';
          if (lastLeg.endLocation?.latLng) {
              endLoc = {
                  lat: lastLeg.endLocation.latLng.latitude,
                  lng: lastLeg.endLocation.latLng.longitude
              };
          }
      }

      result.push({
          label: `Event: ${selectedOffer.event.name}`,
          address: formatAddress(selectedOffer.event.address),
          distance: endDist,
          time: endDur,
          location: endLoc
      });

      return result;
  }, [selectedOffer, defaultAddress, routeInfo]);


  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
    return (
      <PageContainer>
        <PageHeading>Route View</PageHeading>
        <InfoMessage 
          message="Google Maps API key is missing. Please configure it in your environment variables." 
        />
      </PageContainer>
    );
  }

  if (loading) {
      return (
          <PageContainer>
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
              </Box>
          </PageContainer>
      );
  }

  if (!user?.isDriver) {
      return (
          <PageContainer>
              <InfoMessage message="You must be a registered driver to view routes." />
          </PageContainer>
      );
  }

  return (
    <PageContainer>
      <PageHeading>Route View</PageHeading>
      
      {/* Top Selection */}
      <Box sx={{ mt: 3, mb: 3 }}>
          <CustomSelect
            label="Select Lift / Event"
            value={selectedOfferId}
            onChange={handleOfferChange}
            sx={{ maxWidth: 400 }}
          >
              {offers.map(offer => (
                  <MenuItem key={offer.id} value={offer.id}>
                      {new Date(offer.date).toLocaleDateString()} - {offer.event.name}
                  </MenuItem>
              ))}
          </CustomSelect>
      </Box>

      {!selectedOffer ? (
          <InfoMessage message="No active lift offers found. Create a lift offer to see your route." />
      ) : !defaultAddress ? (
          <InfoMessage message="Please set a default address in your profile to calculate the route start point." />
      ) : (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
            {/* Map Container */}
            <Paper 
                variant="outlined" 
                sx={{ 
                height: '600px', 
                width: '100%',
                flex: 2,
                overflow: 'hidden',
                position: 'relative'
                }}
            >
                <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                <Map
                    defaultCenter={initialCenter}
                    defaultZoom={11}
                    gestureHandling={'greedy'}
                    disableDefaultUI={false}
                    mapId="DEMO_MAP_ID"
                >
                    <MapController center={mapCenter} zoom={mapZoom} />
                    <Routes 
                        apiKey={GOOGLE_MAPS_API_KEY}
                        origin={originLocation || defaultAddress}
                        destination={formatAddress(selectedOffer.event.address)}
                        waypoints={waypoints}
                        onRouteCalculated={setRouteInfo}
                        onError={handleMapError}
                    />
                </Map>
                </APIProvider>
            </Paper>

            {/* Route Details Sidebar */}
            <Paper variant="outlined" sx={{ width: '100%', flex: 1, p: 3, minHeight: '600px' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Itinerary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {mapError ? (
                    <ErrorMessage message={mapError} />
                ) : !routeInfo ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <Box>
                        <Box sx={{ mb: 3, bgcolor: 'primary.light', p: 2, borderRadius: 1, color: 'primary.contrastText' }}>
                            <Typography variant="subtitle2" fontWeight="bold">Total Trip</Typography>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2">Distance: {Math.round(((routeInfo as any).distanceMeters || 0) / 1000)} km</Typography>
                                <Typography variant="body2">
                                    Duration: ~{Math.round(parseInt((routeInfo as any).duration?.replace('s','') || '0') / 60)} mins
                                </Typography>
                            </Stack>
                        </Box>

                        <Stepper orientation="vertical" activeStep={-1}>
                            {steps.map((step, index) => (
                                <Step key={index} expanded>
                                    <StepLabel 
                                        onClick={() => handleStepClick(step)}
                                        sx={{ 
                                            cursor: 'pointer', 
                                            '&:hover': { bgcolor: 'action.hover', borderRadius: 1 } 
                                        }}
                                    >
                                        <Typography fontWeight="bold">{step.label}</Typography>
                                    </StepLabel>
                                    <StepContent>
                                        <Typography variant="body2" color="text.secondary">{step.address}</Typography>
                                        {step.distance && (
                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'primary.main' }}>
                                                + {step.distance} ({step.time})
                                            </Typography>
                                        )}
                                    </StepContent>
                                </Step>
                            ))}
                        </Stepper>
                    </Box>
                )}
            </Paper>
        </Stack>
      )}
    </PageContainer>
  );
}

export default function RouteViewPage() {
  return (
    <Suspense fallback={
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        </PageContainer>
    }>
        <RouteViewContent />
    </Suspense>
  );
}
