'use client';

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Badge from '@mui/material/Badge';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import CustomTextField from '@/components/shared/ui/CustomTextField';
import CustomTable, { Column } from '@/components/shared/ui/CustomTable';
import CustomDialog from '@/components/shared/ui/CustomDialog';
import SubmitButton from '@/components/shared/ui/SubmitButton';
import CancelButton from '@/components/shared/ui/CancelButton';
import { useAuth } from '@/context/AuthContext';

interface Address {
  id: number;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  rank?: number;
}

const addressColumns: Column<Address>[] = [
  { id: 'street', label: 'Street' },
  { id: 'city', label: 'City' },
  { id: 'province', label: 'Province' },
  { id: 'postalCode', label: 'Postal Code' },
  { id: 'country', label: 'Country' },
  { id: 'actions', label: 'Actions', align: 'center', width: 100 },
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  
  // User Profile State
  const [profileData, setProfileData] = useState({
    name: '',
    phoneNumber: '',
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);

  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddressesLoading, setIsAddressesLoading] = useState(false);
  
  // Address Dialog State
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
  });
  const [isAddressSubmitting, setIsAddressSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
      });
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    setIsAddressesLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/addresses`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error('Failed to fetch addresses', error);
    } finally {
      setIsAddressesLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('phoneNumber', profileData.phoneNumber);
      if (profileImage) {
        formData.append('profilePicture', profileImage);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });

      if (res.ok) {
        await refreshUser();
        setIsProfileDialogOpen(false);
        setProfileImage(null);
        setPreviewImage(null);
      }
    } catch (error) {
      console.error('Failed to update profile', error);
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddressSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressFormData),
        credentials: 'include',
      });

      if (res.ok) {
        setIsAddressDialogOpen(false);
        setAddressFormData({ street: '', city: '', province: '', postalCode: '', country: '' });
        fetchAddresses();
      }
    } catch (error) {
      console.error('Failed to add address', error);
    } finally {
      setIsAddressSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Are you sure you want to remove this address?')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        fetchAddresses();
      }
    } catch (error) {
      console.error('Failed to delete address', error);
    }
  };

  const getProfileSrc = () => {
    if (previewImage) return previewImage;
    if (user?.profilePicture) {
      return user.profilePicture.startsWith('http') 
        ? user.profilePicture 
        : `${process.env.NEXT_PUBLIC_API_URL}${user.profilePicture}`;
    }
    return undefined;
  };

  return (
    <PageContainer>
      <PageHeading sx={{ mb: 4 }}>Profile Setup</PageHeading>

      <Stack spacing={4}>
        {/* User Details Section */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Personal Details
            </Typography>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setIsProfileDialogOpen(true)}
              size="small"
            >
              Edit Details
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Avatar
              src={user?.profilePicture ? (user.profilePicture.startsWith('http') ? user.profilePicture : `${process.env.NEXT_PUBLIC_API_URL}${user.profilePicture}`) : undefined}
              alt={user?.name}
              sx={{ width: 100, height: 100, fontSize: '2.5rem' }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Grid container spacing={2} sx={{ flex: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                <Typography variant="body1">{user?.name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">Phone Number</Typography>
                <Typography variant="body1">{user?.phoneNumber || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">Email Address</Typography>
                <Typography variant="body1">{user?.email || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">Account Role</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{user?.role?.toLowerCase() || 'User'}</Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Addresses Section */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              My Addresses
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsAddressDialogOpen(true)}
              size="small"
            >
              Add Address
            </Button>
          </Box>
          
          <CustomTable
            columns={addressColumns}
            data={addresses}
            isLoading={isAddressesLoading}
            emptyMessage="No addresses found. Add one to get started."
            renderCell={(item, column) => {
              if (column.id === 'actions') {
                return (
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => handleDeleteAddress(item.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                );
              }
              return item[column.id as keyof Address];
            }}
          />
        </Paper>
      </Stack>

      {/* Edit Profile Dialog */}
      <CustomDialog
        open={isProfileDialogOpen}
        onClose={() => {
          setIsProfileDialogOpen(false);
          setProfileImage(null);
          setPreviewImage(null);
          if (user) {
            setProfileData({ name: user.name, phoneNumber: user.phoneNumber || '' });
          }
        }}
        title="Edit Personal Details"
        component="form"
        onSubmit={handleProfileUpdate}
        actions={
          <>
            <CancelButton onClick={() => setIsProfileDialogOpen(false)}>Cancel</CancelButton>
            <SubmitButton isSubmitting={isProfileSubmitting}>Save Changes</SubmitButton>
          </>
        }
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <IconButton
                component="label"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  width: 32,
                  height: 32,
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                <CameraAltIcon sx={{ fontSize: 18 }} />
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleFileChange}
                />
              </IconButton>
            }
          >
            <Avatar
              src={getProfileSrc()}
              alt="Profile Picture"
              sx={{ width: 100, height: 100, fontSize: '2.5rem' }}
            >
              {profileData.name?.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
        </Box>

        <CustomTextField
          id="name"
          label="Full Name"
          value={profileData.name}
          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
          required
        />
        <CustomTextField
          id="phone"
          label="Phone Number"
          value={profileData.phoneNumber}
          onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
          required
        />
      </CustomDialog>

      {/* Add Address Dialog */}
      <CustomDialog
        open={isAddressDialogOpen}
        onClose={() => setIsAddressDialogOpen(false)}
        title="Add New Address"
        component="form"
        onSubmit={handleAddAddress}
        actions={
          <>
            <CancelButton onClick={() => setIsAddressDialogOpen(false)}>Cancel</CancelButton>
            <SubmitButton isSubmitting={isAddressSubmitting}>Save Address</SubmitButton>
          </>
        }
      >
        <CustomTextField
          id="street"
          label="Street Address"
          value={addressFormData.street}
          onChange={(e) => setAddressFormData({ ...addressFormData, street: e.target.value })}
          required
          autoFocus
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <CustomTextField
            id="city"
            label="City"
            value={addressFormData.city}
            onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
            required
          />
          <CustomTextField
            id="province"
            label="Province/State"
            value={addressFormData.province}
            onChange={(e) => setAddressFormData({ ...addressFormData, province: e.target.value })}
            required
          />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <CustomTextField
            id="postalCode"
            label="Postal Code"
            value={addressFormData.postalCode}
            onChange={(e) => setAddressFormData({ ...addressFormData, postalCode: e.target.value })}
            required
          />
          <CustomTextField
            id="country"
            label="Country"
            value={addressFormData.country}
            onChange={(e) => setAddressFormData({ ...addressFormData, country: e.target.value })}
            required
          />
        </Stack>
      </CustomDialog>
    </PageContainer>
  );
}
