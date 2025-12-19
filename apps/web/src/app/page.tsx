'use client';

import { useState, useEffect } from 'react';

type User = {
  id: number;
  phoneNumber: string;
  name: string | null;
  createdAt: string;
  lastUpdated: string;
};
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');

  // Fetch users from the backend API
  useEffect(() => {
    fetch(`${API_URL}/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;

    // Send data to the backend API
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, name }),
    });

    if (res.ok) {
      const newUser = await res.json();
      setUsers([...users, newUser]);
      setPhoneNumber('');
      setName('');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center p-24 bg-white dark:bg-zinc-900 text-black dark:text-white">
      <h1 className="text-4xl font-bold mb-8">User Management</h1>

      {/* Form to add user */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-12 w-full max-w-md">
        <input
          type="tel"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700"
          required
        />
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700"
        />
        <button
          type="submit"
          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Add User
        </button>
      </form>

      {/* List of users */}
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Current Users</h2>
        <ul className="flex flex-col gap-2">
          {users.map((user) => (
            <li
              key={user.id}
              className="p-4 border rounded shadow-sm dark:bg-zinc-800 dark:border-zinc-700"
            >
              <p className="font-bold">{user.name || 'Unnamed'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.phoneNumber}</p>
              <div className="text-xs text-gray-400 mt-2">
                <p>Created: {new Date(user.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(user.lastUpdated).toLocaleString()}</p>
              </div>
            </li>
          ))}
          {users.length === 0 && <p className="text-gray-500">No users found.</p>}
        </ul>
      </div>
    </div>
  );
}
