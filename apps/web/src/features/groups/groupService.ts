const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface GroupMember {
  userId: number;
  name: string;
  profilePicture: string | null;
  phoneNumber: string;
  isDriver: boolean;
  isAdmin: boolean;
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
};
