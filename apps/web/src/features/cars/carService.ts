import { Car, CreateCarDTO, UpdateCarDTO } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface DefaultCarResult {
  code?: string;
  count?: number;
  message?: string;
}

export const carService = {
  getCars: async (): Promise<{ cars: Car[] }> => {
    const res = await fetch(`${API_URL}/cars`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch cars');
    return res.json();
  },

  createCar: async (data: CreateCarDTO): Promise<{ car: Car }> => {
    const res = await fetch(`${API_URL}/cars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create car');
    return res.json();
  },

  updateCar: async (id: number, data: UpdateCarDTO): Promise<{ car: Car }> => {
    const res = await fetch(`${API_URL}/cars/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update car');
    return res.json();
  },

  deleteCar: async (id: number): Promise<void> => {
    const res = await fetch(`${API_URL}/cars/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete car');
  },

  setDefaultCar: async (id: number, updateFutureOffers?: boolean): Promise<DefaultCarResult> => {
    const res = await fetch(`${API_URL}/cars/${id}/default`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ updateFutureOffers }),
    });

    if (res.status === 409) {
        return res.json();
    }

    if (!res.ok) throw new Error('Failed to set default car');
    return res.json();
  },
};
