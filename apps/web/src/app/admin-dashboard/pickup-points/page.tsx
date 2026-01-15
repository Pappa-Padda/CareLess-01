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
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import CustomTable, { Column } from '@/components/shared/ui/CustomTable';
import CustomDialog from '@/components/shared/ui/CustomDialog';
import AddressForm from '@/components/shared/ui/AddressForm';
import CustomTextField from '@/components/shared/ui/CustomTextField';
import CancelButton from '@/components/shared/ui/CancelButton';
import SubmitButton from '@/components/shared/ui/SubmitButton';
import CustomSelect from '@/components/shared/ui/CustomSelect';

import { adminService, Pickup, PickupFormData } from '@/features/admin/adminService';
import { allocationService, Group } from '@/features/allocation/allocationService';
import { useAuth } from '@/context/AuthContext';

export default function PickupPointsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [filteredPickups, setFilteredPickups] = useState<Pickup[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Filters
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<number | 'all'>('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPickup, setCurrentPickup] = useState<Pickup | null>(null);
  
  // Form State
  const [timeStr, setTimeStr] = useState('08:00'); 
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>(''); // For the form
  const [formData, setFormData] = useState<Omit<PickupFormData, 'time' | 'groupId'>>({
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
      const fetchData = async () => {
        setLoading(true);
        try {
          // Fetch pickups and groups concurrently
          const [pickupData, groupData] = await Promise.all([
            adminService.getPickups(),
            allocationService.getAdminGroups()
          ]);
          
          setPickups(pickupData);
          setGroups(groupData.groups);
          setError(null);
        } catch (err) {
          console.error(err);
          setError('Failed to load data.');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, authLoading, router]);

  // Filter Logic
  useEffect(() => {
    if (selectedGroupFilter === 'all') {
      setFilteredPickups(pickups);
    } else {
      setFilteredPickups(pickups.filter(p => p.groupId === selectedGroupFilter));
    }
  }, [selectedGroupFilter, pickups]);

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
    // Default group selection in form if filter is active
    setSelectedGroupId(selectedGroupFilter !== 'all' ? selectedGroupFilter : '');
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
    setSelectedGroupId(pickup.groupId || '');
    
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

  const handleFormChange = (newData: Omit<PickupFormData, 'time' | 'groupId'>) => {
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
      groupId: selectedGroupId === '' ? undefined : Number(selectedGroupId),
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
      width: '10%',
      format: (value) => {
        if (!value) return '';
        const d = new Date(value as string);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    },
    { 
      id: 'groupId', 
      label: 'Group', 
      width: '15%',
    },
    { 
      id: 'address', 
      label: 'Location', 
      width: '65%',
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
    if (column.id === 'groupId') {
        const groupName = groups.find(g => g.id === item.groupId)?.name;
        return groupName ? (
            <Chip label={groupName} size="small" color="primary" variant="outlined" />
        ) : (
            <Chip label="Global" size="small" variant="outlined" />
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
      {/* Header Row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Tooltip title="Back">
             <IconButton onClick={() => router.back()} color="default" size="medium" sx={{ ml: -1 }}>
                <ArrowBackIcon />
             </IconButton>
        </Tooltip>
        <PageHeading>Pickup Point Management</PageHeading>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            New Point
        </Button>
      </Box>

      {/* Filter Row */}
      <Box sx={{ mb: 3 }}>
        <CustomSelect
            label="Filter by Group"
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value as number | 'all')}
            sx={{ width: 250 }} 
            size="small"
        >
            <MenuItem value="all">All Groups</MenuItem>
            {groups.map(g => (
                <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
            ))}
        </CustomSelect>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <CustomTable
        columns={columns}
        data={filteredPickups}
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
          <CustomSelect
            label="Group (Optional)"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value === '' ? '' : Number(e.target.value))}
          >
             <MenuItem value="">Global (No Group)</MenuItem>
             {groups.map(g => (
                 <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
             ))}
          </CustomSelect>

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
