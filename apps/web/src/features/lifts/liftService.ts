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

// Frontend types for Dashboard
export interface EventDetails {
  id: number;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  address: {
    nickname?: string;
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    link?: string;
  };
  group: {
    name: string;
    profilePicture?: string;
  };
}

export interface DriverDetails {
  name: string;
  phoneNumber?: string;
  profilePicture?: string;
}

export interface CarDetails {
  id: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  seatCapacity: number;
}

export interface PickupDetails {
  id: number;
  time: string;
  address: {
    nickname?: string;
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    link?: string;
  };
}

export interface DashboardAllocationItem {
  type: 'allocation';
  id: string; // Unique ID for the item, e.g., alloc_liftOfferId_passengerId
  event: EventDetails;
  allocationId: number; // The liftOfferId from PassengerAllocation composite key
  driver: DriverDetails;
  car: CarDetails;
  pickup: PickupDetails;
  isConfirmed: boolean;
  status: 'ASSIGNED' | 'CONFIRMED';
  date: string; // YYYY-MM-DD
}

export interface DashboardRequestItem {
  type: 'request';
  id: string; // Unique ID for the item, e.g., req_requestId
  event: EventDetails;
  requestId: number;
  status: 'PENDING';
  date: string; // YYYY-MM-DD
}

export type DashboardItem = DashboardAllocationItem | DashboardRequestItem;

export interface DriverDashboardOffer {
  id: number;
  date: string;
  availableSeats: number;
  notes?: string;
  event: EventDetails;
  car: CarDetails;
  passengers: {
    id: number;
    name: string;
    phoneNumber?: string;
    profilePicture?: string;
    isConfirmed: boolean;
    pickup: PickupDetails;
  }[];
}

export interface CarUpdateResult {
  code?: string;
  error?: string;
  currentPassengers?: number;
  newCapacity?: number;
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

  // Passenger Dashboard
  getPassengerDashboard: async (): Promise<{ rides: DashboardItem[] }> => {
    const res = await fetch(`${API_URL}/passenger/dashboard`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch passenger dashboard');
    return res.json();
  },

  // Driver Dashboard
  getDriverDashboard: async (): Promise<{ offers: DriverDashboardOffer[] }> => {
    const res = await fetch(`${API_URL}/lift-offers/dashboard`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch driver dashboard');
    return res.json();
  },

  confirmAllocation: async (liftOfferId: number): Promise<void> => {
    const res = await fetch(`${API_URL}/passenger/confirm`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ liftOfferId }),
    });
    if (!res.ok) throw new Error('Failed to confirm allocation');
  },

  declineAllocation: async (liftOfferId: number): Promise<void> => {
    const res = await fetch(`${API_URL}/passenger/decline`, {
      method: 'POST', // Using POST for now as DELETE with body is tricky
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ liftOfferId }),
    });
    if (!res.ok) throw new Error('Failed to decline allocation');
  },

  updateLiftOfferCar: async (offerId: number, carId: number, force: boolean = false): Promise<CarUpdateResult> => {
    const res = await fetch(`${API_URL}/lift-offers/${offerId}/car`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ carId, force }),
    });

    if (res.status === 409) {
        // Return the warning data
        return res.json();
    }

    if (!res.ok) throw new Error('Failed to update car');
    return res.json();
  },
};
