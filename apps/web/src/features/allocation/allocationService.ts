const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AllocationPassenger {
  id: number;
  passengerId: number;
  name: string;
  profilePicture: string | null;
  defaultAddressNickname?: string;
  location?: { lat: number; lng: number; address?: string } | null;
}

export interface AllocationOffer {
  id: number;
  driverName: string;
  driverProfilePicture: string | null;
  driverLocation?: { lat: number; lng: number } | null;
  carInfo: string;
  totalSeats: number;
  availableSeats: number;
  passengers: { 
    id: number; 
    name: string;
    pickupTime?: string;
    pickupAddress?: string;
    location?: { lat: number; lng: number } | null;
  }[];
}

export interface Group {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
}

export interface Event {
  id: number;
  name: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  groupId: number;
  addressId: number;
}

export interface AllocationData {
  event: {
    id: number;
    name: string;
    date: string;
    location: { lat: number; lng: number; address?: string } | null;
  };
  unassigned: AllocationPassenger[];
  offers: AllocationOffer[];
}

export const allocationService = {
  getAdminGroups: async () => {
    const res = await fetch(`${API_URL}/allocation/groups`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch admin groups');
    return res.json();
  },

  getEvents: async (groupId: number) => {
    const res = await fetch(`${API_URL}/allocation/events/${groupId}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  getAllocationData: async (eventId: number): Promise<AllocationData> => {
    const res = await fetch(`${API_URL}/allocation/data/${eventId}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch allocation data');
    return res.json();
  },

  commitAssignments: async (eventId: number, assignments: { passengerId: number; liftOfferId: number }[]) => {
    const res = await fetch(`${API_URL}/allocation/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ eventId, assignments }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to commit assignments');
    }
    return res.json();
  },

  clearAllocations: async (eventId: number) => {
    const res = await fetch(`${API_URL}/allocation/clear/${eventId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to clear allocations');
    return res.json();
  },
};
