'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { RouteInfo, Leg } from '../hooks/useRouteCalculation';

type LocationInput = string | { lat: number; lng: number };

interface RoutesProps {
  origin: LocationInput;
  destination: LocationInput;
  waypoints?: string[]; // Intermediates are usually addresses or place IDs, but can also be latLng. Keeping string for now for simplicity of array prop.
  onRouteCalculated?: (route: RouteInfo) => void;
  onError?: (error: { code?: string; message?: string }) => void;
  apiKey: string;
  route?: RouteInfo | null; // Optional pre-calculated route
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
  apiKey,
  route: preCalculatedRoute
}: RoutesProps) {
  const map = useMap();
  const geometryLib = useMapsLibrary('geometry');
  const markerLib = useMapsLibrary('marker');
  
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const fetchIdRef = useRef<number>(0);

  // Refs for callbacks to avoid effect dependencies
  const onRouteCalculatedRef = useRef(onRouteCalculated);
  const onErrorRef = useRef(onError);

  useEffect(() => {
      onRouteCalculatedRef.current = onRouteCalculated;
      onErrorRef.current = onError;
  }, [onRouteCalculated, onError]);

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

  // Memoize the request payload to ensure stability
  const requestPayload = useMemo(() => {
    if (preCalculatedRoute) return null; // No need to calculate payload if route is provided
    return {
        origin: formatLocation(origin),
        destination: formatLocation(destination),
        intermediates: waypoints && waypoints.length > 0 
            ? waypoints.map(wp => ({ address: wp, via: false })) 
            : [],
        optimizeWaypointOrder: waypoints && waypoints.length > 0
    };
  }, [origin, destination, waypoints, preCalculatedRoute]);

  // Stringify for effect dependency (deep comparison)
  const requestKey = JSON.stringify(requestPayload);

  useEffect(() => {
    if (!map || !geometryLib || !markerLib || !apiKey) return;

    // If a pre-calculated route is provided, render it and skip fetching
    if (preCalculatedRoute) {
        clearMap();
        renderRoute(preCalculatedRoute, geometryLib, markerLib, map, routePolylineRef, markersRef);
        return;
    }

    // Only proceed with fetch if we have a request payload (implied: no preCalculatedRoute)
    if (!requestPayload) return;

    const currentFetchId = ++fetchIdRef.current;

    const fetchAndRenderRoute = async () => {
        // 1. Clear map artifacts synchronously before starting fetch
        clearMap();

        try {
            // Construct Routes API Request
            const body: RoutesApiRequest = {
                origin: requestPayload.origin,
                destination: requestPayload.destination,
                travelMode: 'DRIVE',
                routingPreference: 'TRAFFIC_AWARE',
                computeAlternativeRoutes: false
            };

            if (requestPayload.intermediates.length > 0) {
                body.intermediates = requestPayload.intermediates;
                body.optimizeWaypointOrder = requestPayload.optimizeWaypointOrder;
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
            
            renderRoute(route, geometryLib, markerLib, map, routePolylineRef, markersRef);

            // Callback
            if (onRouteCalculatedRef.current) {
                onRouteCalculatedRef.current(route);
            }

        } catch (err: unknown) {
            if (currentFetchId !== fetchIdRef.current) return;
            console.error('Routes API Error:', err);
            if (onErrorRef.current) {
                onErrorRef.current({ message: err instanceof Error ? err.message : 'Unknown error' });
            }
        }
    };

    fetchAndRenderRoute();
  }, [map, geometryLib, markerLib, apiKey, requestKey, requestPayload, preCalculatedRoute]);

  return null;
}

// Helper to render route on map
const renderRoute = (
    route: RouteInfo,
    geometryLib: google.maps.GeometryLibrary,
    markerLib: google.maps.MarkerLibrary,
    map: google.maps.Map,
    routePolylineRef: React.MutableRefObject<google.maps.Polyline | null>,
    markersRef: React.MutableRefObject<google.maps.marker.AdvancedMarkerElement[]>
) => {
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
};