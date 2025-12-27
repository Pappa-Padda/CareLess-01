"use client";

import SignIn from '../../components/sign-in/SignIn';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SignInPage() {
  const router = useRouter();

  const handleSignIn = async ({ email, password }: { email: string; password: string }) => {
    try {
      const res = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { ok: false, error: body?.error || 'Sign-in failed' };
      }
      // successful sign-in — redirect
      router.push('/admin/users');
      return { ok: true };
    } catch (err) {
      return { ok: false, error: 'Network error' };
    }
  };

  return <SignIn onSubmit={handleSignIn} />;
}
