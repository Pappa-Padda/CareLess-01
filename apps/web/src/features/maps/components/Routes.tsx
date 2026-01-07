'use client';

import { useEffect, useRef } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

type LocationInput = string | { lat: number; lng: number };

interface Leg {
  distanceMeters?: number;
  duration?: string;
  startLocation?: { latLng: { latitude: number, longitude: number } };
  endLocation?: { latLng: { latitude: number, longitude: number } };
}

interface RouteInfo {
  distanceMeters?: number;
  duration?: string;
  legs?: Leg[];
  optimizedIntermediateWaypointIndex?: number[];
  polyline: { encodedPolyline: string };
}

interface RoutesProps {
  origin: LocationInput;
  destination: LocationInput;
  waypoints?: string[]; // Intermediates are usually addresses or place IDs, but can also be latLng. Keeping string for now for simplicity of array prop.
  onRouteCalculated?: (route: RouteInfo) => void;
  onError?: (error: { code?: string; message?: string }) => void;
  apiKey: string;
}

interface RoutesApiRequest {
  origin: ReturnType<typeof formatLocation>;
  destination: ReturnType<typeof formatLocation>;
  travelMode: 'DRIVE';
  routingPreference: 'TRAFFIC_AWARE';
  computeAlternativeRoutes: boolean;
  intermediates?: { address: string; via: boolean }[];
  optimizeWaypointOrder?: boolean;
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
  
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const fetchIdRef = useRef<number>(0);

  // Helper to clear existing map artifacts
  const clearMap = () => {
    if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
        routePolylineRef.current = null;
    }
    markersRef.current.forEach(m => {
        m.map = null;
    });
    markersRef.current = [];
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => clearMap();
  }, []);

  useEffect(() => {
    if (!map || !geometryLib || !markerLib || !origin || !destination || !apiKey) return;

    const currentFetchId = ++fetchIdRef.current;

    const fetchAndRenderRoute = async () => {
        // 1. Clear map artifacts synchronously before starting fetch
        clearMap();

        try {
            // Construct Routes API Request
            const body: RoutesApiRequest = {
                origin: formatLocation(origin),
                destination: formatLocation(destination),
                travelMode: 'DRIVE',
                routingPreference: 'TRAFFIC_AWARE',
                computeAlternativeRoutes: false
            };

            if (waypoints && waypoints.length > 0) {
                body.intermediates = waypoints.map(wp => ({ address: wp, via: false }));
                body.optimizeWaypointOrder = true;
            }

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
                throw new Error(errData.error?.message || `Routes API failed: ${response.status}`);
            }

            const data = await response.json();
            
            // Check if this fetch is still the latest one
            if (currentFetchId !== fetchIdRef.current) return;

            if (!data.routes || data.routes.length === 0) {
                throw new Error('No routes found');
            }

            const route = data.routes[0];

            // 2. Draw Polyline
            const path = geometryLib.encoding.decodePath(route.polyline.encodedPolyline);
            
            const newPolyline = new google.maps.Polyline({
                path,
                geodesic: true,
                strokeColor: '#1a73e8', // Google Blue
                strokeOpacity: 1.0,
                strokeWeight: 5,
                map: map
            });
            routePolylineRef.current = newPolyline;

            // 3. Set Markers
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
                route.legs.forEach((leg: Leg, index: number) => {
                    if (index < (route.legs?.length || 0) - 1) { 
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
            markersRef.current = newMarkers;

            // 4. Fit Bounds
            const bounds = new google.maps.LatLngBounds();
            path.forEach(p => bounds.extend(p));
            map.fitBounds(bounds);

            // 5. Callback
            if (onRouteCalculated) {
                onRouteCalculated(route);
            }

        } catch (err: unknown) {
            if (currentFetchId !== fetchIdRef.current) return;
            console.error('Routes API Error:', err);
            if (onError) {
                onError({ message: err instanceof Error ? err.message : 'Unknown error' });
            }
        }
    };

    fetchAndRenderRoute();
  }, [map, geometryLib, markerLib, origin, destination, waypoints, apiKey, onRouteCalculated, onError]);

  return null;
}
