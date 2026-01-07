'use client';

import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HailIcon from '@mui/icons-material/Hail';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import { adminService, DashboardStats } from '@/features/admin/adminService';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Basic role check on client (backend enforces security)
    if (!authLoading && user && user.role !== 'ADMIN') {
        router.push('/'); // Redirect non-admins
        return;
    }

    if (!authLoading && user?.role === 'ADMIN') {
        const fetchStats = async () => {
            try {
                const data = await adminService.getDashboardStats();
                setStats(data);
            } catch (err) {
                setError('Failed to load dashboard statistics.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }
  }, [user, authLoading, router]);

  if (authLoading || (loading && !error)) {
    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        </PageContainer>
    );
  }

  if (error) {
      return (
          <PageContainer>
              <Alert severity="error">{error}</Alert>
          </PageContainer>
      );
  }

  if (!user || user.role !== 'ADMIN') return null; // Should have redirected

  return (
    <PageContainer>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <AdminPanelSettingsIcon fontSize="large" color="primary" />
        <PageHeading>
            Admin Dashboard
        </PageHeading>
      </Stack>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
                title="Total Users" 
                value={stats?.userCount || 0} 
                icon={<PeopleIcon fontSize="large" color="action" />} 
                color="primary.main"
            />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
                title="Upcoming Events" 
                value={stats?.upcomingEventCount || 0} 
                icon={<EventIcon fontSize="large" color="action" />} 
                color="secondary.main"
            />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
                title="Active Offers" 
                value={stats?.activeLiftOffers || 0} 
                icon={<DirectionsCarIcon fontSize="large" color="action" />} 
                color="success.main"
            />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
                title="Pending Requests" 
                value={stats?.pendingLiftRequests || 0} 
                icon={<HailIcon fontSize="large" color="action" />} 
                color="warning.main"
            />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Management Consoles</Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
            <ActionCard 
                title="Allocation Console"
                description="Assign passengers to vehicles for upcoming events."
                href="/allocation"
                icon={<DirectionsCarIcon />}
            />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
            <ActionCard 
                title="Event Management"
                description="Create and manage groups and their events."
                href="/groups" // Linking to groups as events are managed there currently
                icon={<EventIcon />}
            />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
            <ActionCard 
                title="User Management"
                description="View system users (Future Feature)."
                href="#"
                icon={<PeopleIcon />}
                disabled
            />
        </Grid>
      </Grid>

    </PageContainer>
  );
}

// Sub-components for cleaner code
function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
    return (
        <Paper elevation={2} sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color }}>{value}</Typography>
                <Typography variant="body2" color="text.secondary">{title}</Typography>
            </Box>
            <Box sx={{ opacity: 0.8 }}>
                {icon}
            </Box>
        </Paper>
    );
}

function ActionCard({ title, description, href, icon, disabled }: { title: string, description: string, href: string, icon: React.ReactNode, disabled?: boolean }) {
    return (
        <Paper 
            variant="outlined" 
            sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                opacity: disabled ? 0.6 : 1,
                bgcolor: disabled ? 'action.hover' : 'background.paper'
            }}
        >
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 1, color: 'primary.contrastText', display: 'flex' }}>
                    {icon}
                </Box>
                <Typography variant="h6" fontWeight="bold">{title}</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                {description}
            </Typography>
            <Button 
                variant="text" 
                endIcon={<ArrowForwardIcon />} 
                href={href}
                disabled={disabled}
                sx={{ alignSelf: 'flex-start' }}
            >
                Access
            </Button>
        </Paper>
    );
}
