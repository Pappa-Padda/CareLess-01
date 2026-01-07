'use client';

import { useEffect, useState } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

type LocationInput = string | { lat: number; lng: number };

interface RoutesProps {
  origin: LocationInput;
  destination: LocationInput;
  waypoints?: string[]; // Intermediates are usually addresses or place IDs, but can also be latLng. Keeping string for now for simplicity of array prop.
  onRouteCalculated?: (route: any) => void;
  onError?: (error: any) => void;
  apiKey: string;
}

const formatLocation = (input: LocationInput) => {
    if (typeof input === 'string') {
        return { address: input };
    }
    return {
        location: {
            latLng: {
                latitude: input.lat,
                longitude: input.lng
            }
        }
    };
};

export default function Routes({ 
  origin, 
  destination, 
  waypoints = [], 
  onRouteCalculated,
  onError,
  apiKey
}: RoutesProps) {
  const map = useMap();
  const geometryLib = useMapsLibrary('geometry');
  const markerLib = useMapsLibrary('marker');
  const [routePolyline, setRoutePolyline] = useState<google.maps.Polyline | null>(null);
  const [markers, setMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (routePolyline) routePolyline.setMap(null);
      markers.forEach(m => m.map = null);
    };
  }, [routePolyline, markers]);

  useEffect(() => {
    if (!map || !geometryLib || !markerLib || !origin || !destination || !apiKey) return;

    const fetchAndRenderRoute = async () => {
        try {
            // Construct Routes API Request
            const body = {
                origin: formatLocation(origin),
                destination: formatLocation(destination),
                intermediates: waypoints.map(wp => ({ address: wp, via: false })),
                travelMode: 'DRIVE',
                optimizeWaypointOrder: true,
                routingPreference: 'TRAFFIC_AWARE',
                computeAlternativeRoutes: false
            };

            const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs,routes.optimizedIntermediateWaypointIndex'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'Routes API request failed');
            }

            const data = await response.json();
            
            if (!data.routes || data.routes.length === 0) {
                throw new Error('No routes found');
            }

            const route = data.routes[0];

            // 1. Draw Polyline
            if (routePolyline) routePolyline.setMap(null);
            const path = geometryLib.encoding.decodePath(route.polyline.encodedPolyline);
            
            const newPolyline = new google.maps.Polyline({
                path,
                geodesic: true,
                strokeColor: '#1a73e8', // Google Blue
                strokeOpacity: 1.0,
                strokeWeight: 5,
                map: map
            });
            setRoutePolyline(newPolyline);

            // 2. Clear & Set Markers
            markers.forEach(m => m.map = null);
            const newMarkers: google.maps.marker.AdvancedMarkerElement[] = [];

            // Start Marker
            if (path.length > 0) {
                newMarkers.push(new markerLib.AdvancedMarkerElement({
                    position: path[0],
                    map: map,
                    title: 'Start'
                }));
            }

            // End Marker
            if (path.length > 0) {
                newMarkers.push(new markerLib.AdvancedMarkerElement({
                    position: path[path.length - 1],
                    map: map,
                    title: 'End'
                }));
            }

            // Intermediate Markers
            if (route.legs) {
                route.legs.forEach((leg: any, index: number) => {
                    if (index < route.legs.length - 1) { 
                        const legEnd = leg.endLocation?.latLng;
                        if (legEnd) {
                             newMarkers.push(new markerLib.AdvancedMarkerElement({
                                position: { lat: legEnd.latitude, lng: legEnd.longitude },
                                map: map,
                                title: `Stop ${index + 1}`
                            }));
                        }
                    }
                });
            }

            setMarkers(newMarkers);

            // 3. Fit Bounds
            const bounds = new google.maps.LatLngBounds();
            path.forEach(p => bounds.extend(p));
            map.fitBounds(bounds);

            // 4. Callback
            if (onRouteCalculated) {
                onRouteCalculated(route);
            }

        } catch (err: any) {
            console.error('Routes API Error:', err);
            if (onError) onError(err);
        }
    };

    fetchAndRenderRoute();
  }, [map, geometryLib, markerLib, JSON.stringify(origin), JSON.stringify(destination), JSON.stringify(waypoints), apiKey]);

  return null;
}
