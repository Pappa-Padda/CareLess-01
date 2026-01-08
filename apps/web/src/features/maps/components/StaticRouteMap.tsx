import React from 'react';
import { Box, Skeleton } from '@mui/material';
import { RouteInfo } from '../hooks/useRouteCalculation';

interface StaticRouteMapProps {
  routeInfo: RouteInfo | null;
  loading?: boolean;
  width?: number | string;
  height?: number | string;
  apiKey: string;
  className?: string;
  onClick?: () => void;
}

const StaticRouteMap: React.FC<StaticRouteMapProps> = ({
  routeInfo,
  loading,
  width = '100%',
  height = '100%',
  apiKey,
  className,
  onClick
}) => {
  if (loading) {
    return (
      <Skeleton 
        variant="rectangular" 
        width={width} 
        height={height} 
        animation="wave" 
        sx={{ borderRadius: 1 }} 
      />
    );
  }

  if (!routeInfo || !routeInfo.polyline?.encodedPolyline) {
    return (
      <Box 
        sx={{ 
          width, 
          height, 
          bgcolor: 'grey.100', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider'
        }}
        className={className}
        onClick={onClick}
      >
        No Route Available
      </Box>
    );
  }

  // Construct Static Maps URL
  // Base URL
  let url = `https://maps.googleapis.com/maps/api/staticmap?size=600x400&scale=2`;
  
  // Add Route Line (Blue, 5px weight)
  // Use 'enc:' prefix for encoded polyline
  const polyline = encodeURIComponent(routeInfo.polyline.encodedPolyline);
  url += `&path=weight:5|color:0x1a73e8|enc:${polyline}`;

  // Add Start/End Markers (Simple approach: we rely on the path to frame the map, 
  // but explicitly adding markers helps visual clarity if the path is obscure)
  // Extracting start/end from legs is complex for a static URL string limit.
  // The path itself is usually sufficient for the "Preview".
  // If we really want markers, we need coordinates.
  // Let's add Start (Green 'S') and End (Red 'E') if available from the first/last leg.
  
  if (routeInfo.legs && routeInfo.legs.length > 0) {
      const firstLeg = routeInfo.legs[0];
      const lastLeg = routeInfo.legs[routeInfo.legs.length - 1];

      if (firstLeg.startLocation?.latLng) {
          const startLat = firstLeg.startLocation.latLng.latitude;
          const startLng = firstLeg.startLocation.latLng.longitude;
          url += `&markers=color:green|label:S|${startLat},${startLng}`;
      }

      if (lastLeg.endLocation?.latLng) {
          const endLat = lastLeg.endLocation.latLng.latitude;
          const endLng = lastLeg.endLocation.latLng.longitude;
          url += `&markers=color:red|label:E|${endLat},${endLng}`;
      }
  }

  url += `&key=${apiKey}`;

  return (
    <Box 
        component="img"
        src={url}
        alt="Route Preview"
        sx={{ 
            width, 
            height, 
            objectFit: 'cover', 
            borderRadius: 1,
            cursor: onClick ? 'pointer' : 'default',
            display: 'block'
        }}
        className={className}
        onClick={onClick}
    />
  );
};

export default StaticRouteMap;
