'use client';

import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface MapControllerProps {
  center: { lat: number, lng: number } | null;
  zoom?: number;
}

/**
 * MapController handles programmatic movement of the map (e.g. clicking a step).
 * It uses a ref to ensure it only moves the map when the 'center' object itself
 * changes to a new reference, rather than on every parent re-render.
 */
export default function MapController({ center, zoom }: MapControllerProps) {
  const map = useMap();
  const lastCenterRef = useRef<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    if (!map || !center) return;
    
    // Only pan if this is a "new" center request (different object reference)
    if (center !== lastCenterRef.current) {
        map.panTo(center);
        if (zoom) {
            map.setZoom(zoom);
        }
        lastCenterRef.current = center;
    }
  }, [map, center, zoom]);

  return null;
}
