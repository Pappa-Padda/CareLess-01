const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type Role = 'USER' | 'ADMIN' | 'MODERATOR';

export interface DashboardStats {
  userCount: number;
  upcomingEventCount: number;
  activeLiftOffers: number;
  pendingLiftRequests: number;
}

export interface User {
  id: number;
  name: string;
  email: string | null;
  phoneNumber: string;
  role: Role;
  isDriver: boolean;
  isPassenger: boolean;
  createdAt: string;
}

export interface Address {
  id: number;
  nickname?: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  link?: string;
  latitude?: number;
  longitude?: number;
}

export interface Pickup {
  id: number;
  time: string; // ISO Date string
  addressId: number;
  groupId: number | null;
  passengerCount: number;
  address: Address;
}

export interface PickupFormData extends Omit<Address, 'id'> {
  time: Date | string;
  groupId?: number;
}

export interface ApiUsage {
  id: number;
  apiName: string;
  date: string;
  count: number;
  maxFreeCount: number;
  rate: string;
}

export const adminService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${API_URL}/admin/stats`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
        if (res.status === 403) throw new Error('Access denied');
        throw new Error('Failed to fetch admin stats');
    }
    
    return res.json();
  },

  getApiUsage: async (): Promise<ApiUsage[]> => {
    const res = await fetch(`${API_URL}/admin/usage`, {
        method: 'GET',
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch API usage');
    return res.json();
  },

  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_URL}/admin/users`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 403) throw new Error('Access denied');
      throw new Error('Failed to fetch users');
    }

    return res.json();
  },

  deleteUser: async (userId: number): Promise<void> => {
    const res = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 403) throw new Error('Access denied');
      throw new Error('Failed to delete user');
    }
  },

  // Pickup Management
  getPickups: async (): Promise<Pickup[]> => {
    const res = await fetch(`${API_URL}/admin/pickups`, {
        method: 'GET',
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch pickups');
    return res.json();
  },

  createPickup: async (data: PickupFormData): Promise<Pickup> => {
    const res = await fetch(`${API_URL}/admin/pickups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create pickup');
    return res.json();
  },

  updatePickup: async (id: number, data: PickupFormData): Promise<Pickup> => {
    const res = await fetch(`${API_URL}/admin/pickups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update pickup');
    return res.json();
  },

  deletePickup: async (id: number): Promise<void> => {
    const res = await fetch(`${API_URL}/admin/pickups/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete pickup');
    }
  },
};