import { CreateEventDTO, Event, UpdateEventDTO } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const eventService = {
  getEvents: async (filter: 'upcoming' | 'past' = 'upcoming'): Promise<Event[]> => {
    const res = await fetch(`${API_URL}/events?filter=${filter}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  getEventById: async (id: number): Promise<Event> => {
    const res = await fetch(`${API_URL}/events/${id}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to fetch event');
    }
    return res.json();
  },

  createEvent: async (data: CreateEventDTO): Promise<Event> => {
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create event');
    return res.json();
  },

  updateEvent: async (id: number, data: UpdateEventDTO): Promise<Event> => {
    const res = await fetch(`${API_URL}/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update event');
    return res.json();
  },

  deleteEvent: async (id: number): Promise<void> => {
    const res = await fetch(`${API_URL}/events/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete event');
  },
};
