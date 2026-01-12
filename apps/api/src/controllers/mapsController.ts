import { Request, Response } from 'express';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export const calculateRoute = async (req: Request, res: Response) => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Missing GOOGLE_MAPS_API_KEY');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { origin, destination, intermediates, optimizeWaypointOrder } = req.body;

  if (!origin || !destination) {
    return res.status(400).json({ error: 'Origin and destination are required' });
  }

  try {
    // Call Google Routes API
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs,routes.optimizedIntermediateWaypointIndex',
      },
      body: JSON.stringify({
        origin,
        destination,
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: false,
        intermediates: intermediates,
        optimizeWaypointOrder: optimizeWaypointOrder,
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Maps API Error:', errorText);
        return res.status(response.status).json({ error: 'Failed to calculate route' });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Error calculating route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
