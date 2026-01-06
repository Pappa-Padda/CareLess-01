const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AllocationPassenger {
  id: number;
  passengerId: number;
  name: string;
  profilePicture: string | null;
}

export interface AllocationOffer {
  id: number;
  driverName: string;
  driverProfilePicture: string | null;
  carInfo: string;
  totalSeats: number;
  availableSeats: number;
  passengers: { id: number; name: string }[];
}

export interface AllocationData {
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
};
