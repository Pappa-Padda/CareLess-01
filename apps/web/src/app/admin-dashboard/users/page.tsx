'use client';

import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';

import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import CustomTable, { Column } from '@/components/shared/ui/CustomTable';
import CustomDialog from '@/components/shared/ui/CustomDialog';
import { adminService, User } from '@/features/admin/adminService';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog State
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && currentUser && currentUser.role !== 'ADMIN') {
        router.push('/');
        return;
    }

    if (!authLoading && currentUser?.role === 'ADMIN') {
        const loadUsers = async () => {
          try {
              setLoading(true);
              const data = await adminService.getUsers();
              setUsers(data);
              setError(null);
          } catch {
              setError('Failed to load users');
          } finally {
              setLoading(false);
          }
        };
        loadUsers();
    }
  }, [currentUser, authLoading, router]);

  const handleDeleteClick = (user: User) => {
    setDeleteUserId(user.id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteUserId) return;
    
    try {
        setIsDeleting(true);
        await adminService.deleteUser(deleteUserId);
        setUsers(prev => prev.filter(u => u.id !== deleteUserId));
        setDeleteUserId(null);
    } catch {
        setError('Failed to delete user');
    } finally {
        setIsDeleting(false);
    }
  };

  const columns: Column<User>[] = [
    { id: 'id', label: 'ID', width: 50 },
    { id: 'name', label: 'User', width: 250 },
    { id: 'email', label: 'Email', width: 250 },
    { id: 'role', label: 'Role', width: 100 },
    { id: 'isDriver', label: 'Status', width: 150 },
    { id: 'actions', label: 'Actions', width: 100, align: 'center' },
  ];

  const renderCell = (item: User, column: Column<User>) => {
    switch (column.id) {
      case 'name':
        return (
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 32, height: 32 }}>{item.name[0]}</Avatar>
            <Typography variant="body2">{item.name}</Typography>
          </Stack>
        );
      case 'role':
        return (
          <Chip 
            label={item.role} 
            size="small" 
            color={item.role === 'ADMIN' ? 'error' : 'default'} 
            variant="outlined" 
          />
        );
      case 'isDriver':
        return (
          <Stack direction="row" spacing={1}>
            {item.isDriver && <Chip label="Driver" size="small" color="primary" />}
            {item.isPassenger && <Chip label="Passenger" size="small" color="secondary" />}
          </Stack>
        );
      case 'actions':
        return (
          <IconButton 
            color="error" 
            onClick={() => handleDeleteClick(item)}
            disabled={item.id === currentUser?.id} // Prevent self-delete
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        );
      default: {
        const key = column.id as keyof User;
        const val = item[key];
        return val !== null && val !== undefined ? String(val) : '';
      }
    }
  };

  if (authLoading) return null;

  return (
    <PageContainer>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
        <Tooltip title="Back to Dashboard">
             <IconButton onClick={() => router.push('/admin-dashboard')} color="default" size="medium" sx={{ ml: -1 }}>
                <ArrowBackIcon />
             </IconButton>
        </Tooltip>
        <PageHeading>User Management</PageHeading>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <CustomTable
        columns={columns}
        data={users}
        isLoading={loading}
        renderCell={renderCell}
        emptyMessage="No users found."
      />

      <CustomDialog
        open={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        title="Delete User?"
        actions={
            <>
                <Button onClick={() => setDeleteUserId(null)} disabled={isDeleting} color="inherit">
                    Cancel
                </Button>
                <Button 
                    color="error" 
                    variant="contained"
                    onClick={handleConfirmDelete} 
                    disabled={isDeleting}
                >
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </Button>
            </>
        }
      >
        <Box>
            <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>Warning: This action is irreversible!</strong>
            </Alert>
            <Typography variant="body1" paragraph>
                Deleting this user will permanently remove:
            </Typography>
            <ul>
                <li>The user&apos;s account and profile information.</li>
                <li>Any associated <strong>Driver</strong> or <strong>Passenger</strong> profiles.</li>
                <li>All saved <strong>Addresses</strong> and <strong>Group</strong> memberships.</li>
                <li>All active <strong>Lift Offers</strong> created by this user (as a driver).</li>
                <li>All active <strong>Lift Requests</strong> made by this user.</li>
            </ul>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Please confirm you want to proceed with this deletion.
            </Typography>
        </Box>
      </CustomDialog>
    </PageContainer>
  );
}