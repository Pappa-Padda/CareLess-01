'use client';

import { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface MapControllerProps {
  center: { lat: number, lng: number } | null;
  zoom?: number;
}

export default function MapController({ center, zoom }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !center) return;
    map.panTo(center);
    if (zoom) {
        map.setZoom(zoom);
    }
  }, [map, center, zoom]);

  return null;
}
