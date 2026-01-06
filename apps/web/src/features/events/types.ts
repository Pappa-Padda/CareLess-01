export interface Event {
  id: number | string;
  realId?: number;
  name: string;
  description?: string;
  date: string; // ISO String
  startTime: string; // ISO String
  endTime: string; // ISO String
  isRecurring: boolean;
  groupId: number;
  addressId: number;
  address?: {
    id: number;
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    link?: string;
    latitude?: number;
    longitude?: number;
  };
  group?: {
    id: number;
    name: string;
    profilePicture?: string;
  };
}

export interface CreateEventDTO {
  name: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  groupId: number;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    link?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface UpdateEventDTO extends Partial<CreateEventDTO> {
  id: number;
}
