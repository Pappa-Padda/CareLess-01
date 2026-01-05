'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CarelessSidebar from '../shared/sidebar/CarelessSidebar';

const publicRoutes = ['/', '/sign-in', '/sign-up'];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user && !publicRoutes.includes(pathname)) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return <>{children}</>;
  }

  if (user) {
    return (
      <Box sx={{ display: 'flex' }}>
        <CarelessSidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          {children}
        </Box>
      </Box>
    );
  }

  return <>{children}</>;
}
