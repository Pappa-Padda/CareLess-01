import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

type LocationInput = string | { lat: number; lng: number };

export interface Leg {
  distanceMeters?: number;
  duration?: string;
  startLocation?: { latLng: { latitude: number, longitude: number } };
  endLocation?: { latLng: { latitude: number, longitude: number } };
}

export interface RouteInfo {
  distanceMeters?: number;
  duration?: string;
  legs?: Leg[];
  optimizedIntermediateWaypointIndex?: number[];
  polyline: { encodedPolyline: string };
}

interface UseRouteCalculationProps {
  origin: LocationInput | null;
  destination: LocationInput | null;
  waypoints?: string[];
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

export function useRouteCalculation({
  origin,
  destination,
  waypoints = [],
}: Omit<UseRouteCalculationProps, 'apiKey'> & { apiKey?: string }) {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchIdRef = useRef<number>(0);

  // Memoize the request payload to ensure stability
  const requestPayload = useMemo(() => {
    if (!origin || !destination) return null;
    return {
        origin: formatLocation(origin),
        destination: formatLocation(destination),
        intermediates: waypoints && waypoints.length > 0 
            ? waypoints.map(wp => ({ address: wp, via: false })) 
            : [],
        optimizeWaypointOrder: waypoints && waypoints.length > 0
    };
  }, [origin, destination, waypoints]);

  const requestKey = JSON.stringify(requestPayload);

  const fetchRoute = useCallback(async () => {
    if (!requestPayload) return;

    const currentFetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

        const response = await fetch(`${apiUrl}/maps/routes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(requestPayload)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `Routes API failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (currentFetchId !== fetchIdRef.current) return;

        if (!data.routes || data.routes.length === 0) {
            throw new Error('No routes found');
        }

        setRouteInfo(data.routes[0]);
    } catch (err: unknown) {
        if (currentFetchId !== fetchIdRef.current) return;
        console.error('Routes API Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setRouteInfo(null);
    } finally {
        if (currentFetchId === fetchIdRef.current) {
            setLoading(false);
        }
    }
  }, [requestPayload]); // Depend on stable payload

  // Trigger fetch when dependencies change
  // Note: We might want to make this manual for the static view optimization, 
  // but for now, we follow the existing behavior of auto-fetch.
  // Actually, to support "fetch only on demand", we should perhaps export fetchRoute 
  // and NOT put it in a useEffect that runs automatically if we want full manual control.
  // BUT, the goal is to fetch ONCE for the static map, and then pass that data to the dynamic map.
  // So auto-fetching here is fine, as long as the dynamic map DOESN'T fetch again.
  useEffect(() => {
    if (requestPayload) {
        fetchRoute();
    }
  }, [requestKey, fetchRoute, requestPayload]); // requestKey ensures deep comparison check

  return { routeInfo, loading, error, refetch: fetchRoute };
}
