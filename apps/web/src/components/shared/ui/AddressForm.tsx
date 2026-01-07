'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import Alert from '@mui/material/Alert';
import { Map, Marker, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';

import CustomTextField from './CustomTextField';

export interface AddressFormData {
  nickname?: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  link?: string;
  latitude?: number;
  longitude?: number;
}

interface AddressFormProps {
  data: AddressFormData;
  onChange: (data: AddressFormData) => void;
  required?: boolean;
}

// Helper component for Place Autocomplete on the street field
const PlaceAutocompleteInput = ({ 
    value, 
    onChange, 
    onPlaceSelect,
    required 
}: { 
    value: string, 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onPlaceSelect: (place: google.maps.places.Place) => void,
    required?: boolean
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const placesLib = useMapsLibrary('places');

    useEffect(() => {
        if (!placesLib || !containerRef.current) return;

        // Create the modern Place Autocomplete Element
        // Cast to any because @types/google.maps might not be updated for the "New" Places API components yet
        const autocompleteElement = new (placesLib as any).PlaceAutocompleteElement({
            types: ['address'],
        });

        // Add it to our container
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(autocompleteElement as unknown as Node);

        // Styling the web component to match MUI as closely as possible
        const style = document.createElement('style');
        style.textContent = `
            .map-autocomplete-container gmp-place-autocomplete {
                width: 100%;
            }
            .map-autocomplete-container input {
                width: 100%;
                padding: 12px;
                border: 1px solid rgba(0, 0, 0, 0.23);
                border-radius: 4px;
                font-family: inherit;
                font-size: 1rem;
            }
            .map-autocomplete-container input:focus {
                outline: none;
                border: 2px solid #1976d2;
                padding: 11px;
            }
        `;
        containerRef.current.appendChild(style);

        // Listen for the modern selection event
        const listener = (event: any) => {
            const place = event.placePrediction.toPlace();
            onPlaceSelect(place);
        };

        autocompleteElement.addEventListener('gmp-select', listener);

        return () => {
            autocompleteElement.removeEventListener('gmp-select', listener);
        };
    }, [placesLib, onPlaceSelect]);

    return (
        <Box className="map-autocomplete-container">
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Street Address (Search)
            </Typography>
            <div ref={containerRef} />
            {/* Hidden field to maintain "street" name for form state if needed, though we update via onPlaceSelect */}
            <input type="hidden" name="street" value={value} />
        </Box>
    );
};

// Helper component to control map pan/zoom
const MapUpdater = ({ center }: { center: { lat: number, lng: number } | null }) => {
    const map = useMap();
    useEffect(() => {
        if (map && center) {
            map.panTo(center);
            map.setZoom(17);
        }
    }, [map, center]);
    return null;
};

export default function AddressForm({ data, onChange, required = true }: AddressFormProps) {
  const geocodingLib = useMapsLibrary('geocoding');
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number, lng: number } | null>(
      data.latitude && data.longitude ? { lat: Number(data.latitude), lng: Number(data.longitude) } : null
  );

  // Sync map center if external coordinates change
  useEffect(() => {
    if (data.latitude && data.longitude) {
      setMapCenter({ lat: Number(data.latitude), lng: Number(data.longitude) });
    }
  }, [data.latitude, data.longitude]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({
      ...data,
      [name]: value,
    });
  };

  const handlePlaceSelect = useCallback(async (place: google.maps.places.Place) => {
    setLoading(true);
    try {
        // Fetch detailed fields using the modern Place API
        await place.fetchFields({
            fields: ['addressComponents', 'location', 'displayName', 'googleMapsURI']
        });

        const components = place.addressComponents;
        if (!components) return;

        let streetNumber = '';
        let route = '';
        let city = '';
        let province = '';
        let postalCode = '';
        let country = '';

        for (const component of components) {
            const types = component.types;
            if (types.includes('street_number')) streetNumber = component.longText ?? '';
            if (types.includes('route')) route = component.longText ?? '';
            if (types.includes('locality')) city = component.longText ?? '';
            if (types.includes('administrative_area_level_1')) province = component.shortText ?? '';
            if (types.includes('postal_code')) postalCode = component.longText ?? '';
            if (types.includes('country')) country = component.longText ?? '';
        }

        const lat = place.location?.lat() || (data.latitude ? Number(data.latitude) : undefined);
        const lng = place.location?.lng() || (data.longitude ? Number(data.longitude) : undefined);

        onChange({
            ...data,
            street: `${streetNumber} ${route}`.trim() || data.street,
            city: city || data.city,
            province: province || data.province,
            postalCode: postalCode || data.postalCode,
            country: country || data.country,
            latitude: lat ? Number(lat) : undefined,
            longitude: lng ? Number(lng) : undefined,
            link: (place as any).googleMapsURI || data.link
        });

        if (lat && lng) {
            setMapCenter({ lat: Number(lat), lng: Number(lng) });
        }
    } catch (error) {
        console.error("Error fetching place details", error);
    } finally {
        setLoading(false);
    }
  }, [data, onChange]);

  const handleGeocode = useCallback(async (isManual: boolean = false) => {
      if (!geocodingLib || !data.street || !data.city) return;

      setLoading(true);
      try {
          const geocoder = new geocodingLib.Geocoder();
          const addressString = [data.street, data.city, data.province, data.postalCode, data.country]
            .filter(Boolean)
            .join(', ');
          
          const res = await geocoder.geocode({ address: addressString });
          
          if (res.results && res.results.length > 0) {
              const location = res.results[0].geometry.location;
              const lat = location.lat();
              const lng = location.lng();
              
              // Generate a fallback link based on coordinates if a full Place object wasn't used
              const fallbackLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

              setMapCenter({ lat, lng });
              onChange({
                  ...data,
                  latitude: lat,
                  longitude: lng,
                  link: fallbackLink
              });
          }
      } catch (error) {
          console.error("Geocoding failed", error);
          if (isManual) {
            alert("Could not find this address. Please check the details or set the pin manually.");
          }
      } finally {
          setLoading(false);
      }
  }, [geocodingLib, data, onChange]);

  // Debounced auto-geocode (only if coordinates are missing)
  useEffect(() => {
    if (data.latitude && data.longitude) return;

    const timer = setTimeout(() => {
      if (data.street && data.city && !loading) {
        handleGeocode();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [data.street, data.city, data.province, data.postalCode, data.country]);

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          const newLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
          
          setMapCenter({ lat, lng });
          onChange({
              ...data,
              latitude: lat,
              longitude: lng,
              link: newLink
          });
      }
  };

  return (
    <Stack spacing={2}>
      <CustomTextField
        id="nickname"
        name="nickname"
        label="Address Nickname (Optional)"
        placeholder="e.g. Home, Work, Church"
        value={data.nickname || ''}
        onChange={handleChange}
      />

      <PlaceAutocompleteInput
        value={data.street}
        onChange={handleChange}
        onPlaceSelect={handlePlaceSelect}
        required={required}
      />

      {!data.latitude && !loading && (
        <Alert severity="info" sx={{ py: 0 }}>
          Search for an address or click "Locate on Map" to verify the location.
        </Alert>
      )}

      {/* Map Section */}
      <Box sx={{ mt: 2, border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ p: 1, bgcolor: 'background.default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" fontWeight="bold" sx={{ color: data.latitude ? 'success.main' : 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {data.latitude ? '✅ Location Verified' : '❌ Not Verified'}
              </Typography>
              <Button 
                  size="small" 
                  startIcon={loading ? <CircularProgress size={16} /> : <MyLocationIcon />}
                  onClick={() => handleGeocode(true)}
                  disabled={loading || !data.street}
              >
                  Locate on Map
              </Button>
          </Box>
          <Box sx={{ height: '250px', width: '100%', position: 'relative' }}>
              <Map
                  defaultCenter={mapCenter || { lat: -26.2041, lng: 28.0473 }} // Default JHB
                  defaultZoom={11}
                  gestureHandling={'greedy'}
                  disableDefaultUI={true}
                  mapId="ADDRESS_PREVIEW_MAP"
              >
                  {mapCenter && (
                      <>
                        <Marker 
                            position={mapCenter} 
                            draggable 
                            onDragEnd={handleMarkerDragEnd}
                        />
                        <MapUpdater center={mapCenter} />
                      </>
                  )}
              </Map>
          </Box>
          <Typography variant="caption" sx={{ display: 'block', p: 1, textAlign: 'center', color: 'text.secondary', bgcolor: 'background.paper' }}>
              Drag the red pin to adjust the exact location.
          </Typography>
      </Box>
    </Stack>
  );
}