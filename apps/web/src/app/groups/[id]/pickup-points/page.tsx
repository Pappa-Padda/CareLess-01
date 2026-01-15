'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';

import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import PlaceIcon from '@mui/icons-material/Place';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import AddressForm, { AddressFormData } from '@/components/shared/ui/AddressForm';
import { groupService, PickupPoint } from '@/features/groups/groupService';

interface PickupPointsPageProps {
  params: Promise<{ id: string }>;
}

export default function PickupPointsPage({ params }: PickupPointsPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const groupId = Number(resolvedParams.id);

  const [pickups, setPickups] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<AddressFormData>({
    nickname: '',
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    latitude: undefined,
    longitude: undefined,
  });

  const fetchPickups = async () => {
    try {
      setLoading(true);
      const data = await groupService.getPickupPoints(groupId);
      setPickups(data.pickups);
      setError(null);
    } catch {
      setError('Failed to load pickup points');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNaN(groupId)) {
        fetchPickups();
    }
  }, [groupId]);

  const handleAddOpen = () => {
    setFormData({
        nickname: '',
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.street || !formData.city) {
        alert('Please fill in at least Street and City');
        return;
    }
    
    setSaving(true);
    try {
        await groupService.createPickupPoint(groupId, {
            ...formData,
            // Default time for template
            time: '1970-01-01T00:00:00Z' 
        });
        setDialogOpen(false);
        fetchPickups();
    } catch {
        alert('Failed to save pickup point');
    } finally {
        setSaving(false);
    }
  };

  const handleDelete = async (pickupId: number) => {
    if (!confirm('Are you sure you want to delete this pickup point?')) return;
    try {
        await groupService.deletePickupPoint(groupId, pickupId);
        setPickups(prev => prev.filter(p => p.id !== pickupId));
    } catch {
        alert('Failed to delete pickup point');
    }
  };

  return (
    <PageContainer>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Tooltip title="Back to Groups">
             <IconButton onClick={() => router.back()} color="default" size="medium" sx={{ ml: -1 }}>
                <ArrowBackIcon />
             </IconButton>
        </Tooltip>
        <PageHeading>Pickup Points</PageHeading>
        <Box sx={{ flexGrow: 1 }} />
        <Button 
            variant="contained" 
            startIcon={<AddLocationAltIcon />} 
            onClick={handleAddOpen}
        >
            Add Point
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
        </Box>
      ) : pickups.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
                No pickup points defined for this group. Add one to make allocation easier!
            </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
            {pickups.map(pickup => (
                <Paper key={pickup.id} sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }} variant="outlined">
                    <Box sx={{ p: 1.5, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}>
                        <PlaceIcon />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            {pickup.address.nickname || 'Unnamed Point'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {pickup.address.street}, {pickup.address.city}
                        </Typography>
                        {pickup.address.link && (
                            <Typography variant="caption" component="a" href={pickup.address.link} target="_blank" rel="noreferrer" sx={{ color: 'primary.main', textDecoration: 'none', mt: 0.5, display: 'block' }}>
                                View on Map
                            </Typography>
                        )}
                    </Box>
                    <IconButton onClick={() => handleDelete(pickup.id)} color="error" size="small">
                        <DeleteIcon />
                    </IconButton>
                </Paper>
            ))}
        </Stack>
      )}

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Pickup Point</DialogTitle>
        <DialogContent dividers>
            <AddressForm 
                data={formData}
                onChange={setFormData}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Add Point'}
            </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
