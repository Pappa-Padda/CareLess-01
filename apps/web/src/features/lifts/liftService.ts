const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface LiftRequest {
  id: number;
  eventId: number;
  date: string;
  passengerId: number;
  status: 'PENDING' | 'ASSIGNED' | 'CANCELLED';
}

export interface LiftOffer {
  id: number;
  eventId: number;
  date: string;
  driverId: number;
  carId: number;
  availableSeats: number;
}

export const liftService = {
  // Requests
  getMyRequests: async (): Promise<{ requests: LiftRequest[] }> => {
    const res = await fetch(`${API_URL}/lift-requests/my`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch requests');
    return res.json();
  },

  createRequest: async (eventId: number, date: string): Promise<{ request: LiftRequest }> => {
    const res = await fetch(`${API_URL}/lift-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ eventId, date }),
    });
    if (!res.ok) {
        const text = await res.text();
        console.error('Create Request Failed:', res.status, res.statusText, text);
        throw new Error(`Failed to create request: ${res.status} ${text}`);
    }
    return res.json();
  },

  deleteRequest: async (eventId: number, date: string): Promise<void> => {
    const res = await fetch(`${API_URL}/lift-requests/event/${eventId}?date=${date}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
        const text = await res.text();
        console.error('Delete Request Failed:', res.status, res.statusText, text);
        throw new Error(`Failed to delete request: ${res.status} ${text}`);
    }
  },

  // Offers
  getMyOffers: async (): Promise<{ offers: LiftOffer[] }> => {
    const res = await fetch(`${API_URL}/lift-offers/my`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch offers');
    return res.json();
  },

  createOffer: async (eventId: number, date: string, carId: number): Promise<{ offer: LiftOffer }> => {
    const res = await fetch(`${API_URL}/lift-offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ eventId, date, carId }),
    });
    if (!res.ok) throw new Error('Failed to create offer');
    return res.json();
  },

  deleteOffer: async (eventId: number, date: string): Promise<void> => {
    const res = await fetch(`${API_URL}/lift-offers/event/${eventId}?date=${date}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete offer');
  },
};