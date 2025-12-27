// Shared types for User auth and roles
export type Role = 'USER' | 'ADMIN' | 'MODERATOR';

export interface AuthPayload {
	userId: number;
	role: Role;
	iat?: number;
	exp?: number;
}

export interface UserSafe {
	id: number;
	name: string;
	phoneNumber: string;
	email?: string | null;
	profilePicture?: string | null;
	role: Role;
}
