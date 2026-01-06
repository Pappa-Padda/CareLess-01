import { Car, CreateCarDTO, UpdateCarDTO } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
};
