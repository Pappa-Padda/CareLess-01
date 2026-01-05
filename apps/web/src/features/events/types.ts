export interface Event {
  id: number;
  name: string;
  description?: string;
  date: string; // ISO String
  startTime: string; // ISO String
  endTime: string; // ISO String
  groupId: number;
  addressId: number;
  address?: {
    id: number;
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  group?: {
    id: number;
    name: string;
  };
}

export interface CreateEventDTO {
  name: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  groupId: number;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface UpdateEventDTO extends Partial<CreateEventDTO> {
  id: number;
}
