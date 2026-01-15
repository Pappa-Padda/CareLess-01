const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface GroupMember {
  id: number;
  userId: number;
  name: string;
  profilePicture: string | null;
  phoneNumber: string;
  isDriver: boolean;
  isAdmin: boolean;
}

export interface PickupPoint {
  id: number;
  addressId: number;
  groupId: number;
  time: string;
  passengerCount: number;
  address: {
    id: number;
    nickname?: string;
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
    link?: string;
  };
}

export const groupService = {
  getGroupMembers: async (groupId: number): Promise<{ members: GroupMember[] }> => {
    const res = await fetch(`${API_URL}/groups/${groupId}/members`, {
      credentials: 'include',
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch group members');
    }
    return res.json();
  },

  updateMemberRole: async (groupId: number, userId: number, isAdmin: boolean): Promise<void> => {
    const res = await fetch(`${API_URL}/groups/${groupId}/members/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isAdmin }),
      credentials: 'include',
    });
    
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update member role');
    }
    return res.json();
  },

  getPickupPoints: async (groupId: number): Promise<{ pickups: PickupPoint[] }> => {
    const res = await fetch(`${API_URL}/groups/${groupId}/pickups`, {
      credentials: 'include',
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch pickup points');
    }
    return res.json();
  },

  createPickupPoint: async (groupId: number, data: any): Promise<{ pickup: PickupPoint }> => {
    const res = await fetch(`${API_URL}/groups/${groupId}/pickups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create pickup point');
    }
    return res.json();
  },

  deletePickupPoint: async (groupId: number, pickupId: number): Promise<void> => {
    const res = await fetch(`${API_URL}/groups/${groupId}/pickups/${pickupId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete pickup point');
    }
    return res.json();
  }
};