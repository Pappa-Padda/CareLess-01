'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import DialogContentText from '@mui/material/DialogContentText';
import Typography from '@mui/material/Typography';

import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import CustomTable, { Column } from '@/components/shared/ui/CustomTable';
import CustomDialog from '@/components/shared/ui/CustomDialog';
import AddressForm from '@/components/shared/ui/AddressForm';
import CustomTextField from '@/components/shared/ui/CustomTextField';
import CancelButton from '@/components/shared/ui/CancelButton';
import SubmitButton from '@/components/shared/ui/SubmitButton';

import { adminService, Pickup, PickupFormData } from '@/features/admin/adminService';
import { useAuth } from '@/context/AuthContext';

export default function PickupPointsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPickup, setCurrentPickup] = useState<Pickup | null>(null);
  
  // Form State
  const [timeStr, setTimeStr] = useState('08:00'); // Local state for the time input string
  const [formData, setFormData] = useState<Omit<PickupFormData, 'time'>>({
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    nickname: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
      return;
    }

    if (user?.role === 'ADMIN') {
      const fetchPickups = async () => {
        setLoading(true);
        try {
          const data = await adminService.getPickups();
          setPickups(data);
          setError(null);
        } catch (err) {
          console.error(err);
          setError('Failed to load pickups.');
        } finally {
          setLoading(false);
        }
      };
      fetchPickups();
    }
  }, [user, authLoading, router]);

  const handleOpenCreate = () => {
    setCurrentPickup(null);
    setFormData({
      street: '',
      city: '',
      province: '',
      postalCode: '',
      country: '',
      nickname: '',
    });
    setTimeStr('08:00');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (pickup: Pickup) => {
    setCurrentPickup(pickup);
    setFormData({
      street: pickup.address.street,
      city: pickup.address.city,
      province: pickup.address.province,
      postalCode: pickup.address.postalCode,
      country: pickup.address.country,
      nickname: pickup.address.nickname,
      link: pickup.address.link,
      latitude: pickup.address.latitude,
      longitude: pickup.address.longitude,
    });
    
    // Format time from ISO to HH:mm
    const date = new Date(pickup.time);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    setTimeStr(`${hours}:${minutes}`);
    
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (pickup: Pickup) => {
    setCurrentPickup(pickup);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSubmitting(false);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSubmitting(false);
  };

  const handleFormChange = (newData: Omit<PickupFormData, 'time'>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.street || !formData.city) {
      alert('Street and City are required.');
      return;
    }

    setSubmitting(true);
    
    // Construct Date object from timeStr
    const [hours, minutes] = timeStr.split(':').map(Number);
    const timeDate = new Date();
    timeDate.setHours(hours, minutes, 0, 0);

    const payload: PickupFormData = {
      ...formData,
      time: timeDate,
    };

    try {
      if (currentPickup) {
        await adminService.updatePickup(currentPickup.id, payload);
      } else {
        await adminService.createPickup(payload);
      }
      // Refresh list
      const data = await adminService.getPickups();
      setPickups(data);
      handleCloseDialog();
    } catch (err) {
      console.error(err);
      alert('Failed to save pickup.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentPickup) return;
    setSubmitting(true);
    try {
      await adminService.deletePickup(currentPickup.id);
      // Refresh list
      const data = await adminService.getPickups();
      setPickups(data);
      handleCloseDeleteDialog();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete pickup.';
      console.error(err);
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<Pickup>[] = [
    { 
      id: 'time', 
      label: 'Time', 
      width: '15%',
      format: (value) => {
        if (!value) return '';
        const d = new Date(value as string);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    },
    { 
      id: 'address', 
      label: 'Location', 
      width: '75%',
    },
    { id: 'actions', label: 'Actions', align: 'right', width: '10%' },
  ];

  const renderCell = (item: Pickup, column: Column<Pickup>) => {
    if (column.id === 'address') {
      const addr = item.address;
      return (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {addr.nickname || addr.city}
          </Typography>
          {addr.nickname && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {addr.street}
            </Typography>
          )}
        </Box>
      );
    }
    if (column.id === 'actions') {
      return (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenEdit(item)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleOpenDelete(item)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      );
    }
    // Handle formatting via the column definition
    if (column.format) {
      return column.format(item[column.id as keyof Pickup]);
    }
    return item[column.id as keyof Pickup] as React.ReactNode;
  };

  if (authLoading || (loading && !pickups.length && !error)) {
    return (
      <PageContainer>
        <PageHeading>Pickup Point Management</PageHeading>
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>Loading...</Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <PageHeading>Pickup Point Management</PageHeading>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          New Pickup Point
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <CustomTable
        columns={columns}
        data={pickups}
        isLoading={loading}
        renderCell={renderCell}
        emptyMessage="No pickup points defined yet."
      />

      {/* Create/Edit Dialog */}
      <CustomDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        title={currentPickup ? 'Edit Pickup Point' : 'New Pickup Point'}
        component="form"
        onSubmit={handleSubmit}
        actions={
          <>
            <CancelButton onClick={handleCloseDialog} disabled={submitting}>
              Cancel
            </CancelButton>
            <SubmitButton isSubmitting={submitting}>
              Save
            </SubmitButton>
          </>
        }
      >
        <Stack spacing={2} sx={{ mt: 1 }}>
          <CustomTextField
            label="Pickup Time"
            type="time"
            value={timeStr}
            onChange={(e) => setTimeStr(e.target.value)}
            required
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />
          <AddressForm data={formData} onChange={handleFormChange} />
        </Stack>
      </CustomDialog>

      {/* Delete Confirmation Dialog */}
      <CustomDialog
        open={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        title="Delete Pickup Point"
        actions={
          <>
            <CancelButton onClick={handleCloseDeleteDialog} disabled={submitting}>
              Cancel
            </CancelButton>
            <Button color="error" variant="contained" onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        }
      >
        <DialogContentText>
          Are you sure you want to delete the pickup at <strong>{currentPickup?.address.nickname || currentPickup?.address.street}</strong>?
          This action cannot be undone.
        </DialogContentText>
      </CustomDialog>
    </PageContainer>
  );
}