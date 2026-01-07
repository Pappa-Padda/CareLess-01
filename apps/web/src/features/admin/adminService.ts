const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface DashboardStats {
  userCount: number;
  upcomingEventCount: number;
  activeLiftOffers: number;
  pendingLiftRequests: number;
}

export const adminService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${API_URL}/admin/stats`, {
      method: 'GET',
      credentials: 'include', // Important for cookies
    });

    if (!res.ok) {
        // Handle 403 or other errors
        if (res.status === 403) throw new Error('Access denied');
        throw new Error('Failed to fetch admin stats');
    }
    
    return res.json();
  },
};
