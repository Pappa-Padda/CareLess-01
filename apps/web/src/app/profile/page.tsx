'use client';

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LinkIcon from '@mui/icons-material/Link';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Badge from '@mui/material/Badge';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import Tooltip from '@mui/material/Tooltip';

import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import Alert from '@mui/material/Alert';

import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';

import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import CustomTextField from '@/components/shared/ui/CustomTextField';
import CustomTable, { Column } from '@/components/shared/ui/CustomTable';
import CustomDialog from '@/components/shared/ui/CustomDialog';
import SubmitButton from '@/components/shared/ui/SubmitButton';
import CancelButton from '@/components/shared/ui/CancelButton';
import AddressForm, { AddressFormData } from '@/components/shared/ui/AddressForm';
import { useAuth } from '@/context/AuthContext';

interface Address {
  id: number;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  link?: string;
  rank?: number;
  isDefault: boolean;
}

const addressColumns: Column<Address>[] = [
  { id: 'street', label: 'Street', sortable: true },
  { id: 'city', label: 'City', sortable: true },
  { id: 'province', label: 'Province', sortable: true },
  { id: 'postalCode', label: 'Postal Code', sortable: true },
  { id: 'country', label: 'Country', sortable: true },
  { id: 'isDefault', label: 'Status', align: 'center', width: 100 },
  { id: 'link', label: 'Link', width: 80, align: 'center' },
  { id: 'actions', label: 'Actions', align: 'center', width: 150 },
];

function ProfileContent() {
  const { user, refreshUser } = useAuth();
  const geocodingLib = useMapsLibrary('geocoding');
  
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
  const [sortConfig, setSortConfig] = useState<{ key: keyof Address | 'actions'; direction: 'asc' | 'desc' }>({
    key: 'street',
    direction: 'asc',
  });
  
  // Address Dialog State
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addressFormData, setAddressFormData] = useState<AddressFormData>({
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    link: '',
  });
  const [isAddressSubmitting, setIsAddressSubmitting] = useState(false);

  // Warning State
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningData, setWarningData] = useState<{ count: number, addressId: number } | null>(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phoneNumber: user.phoneNumber || '',
      });
      fetchAddresses();
    }
  }, [user]);

  const handleSort = (columnId: keyof Address | 'actions') => {
    const isAsc = sortConfig.key === columnId && sortConfig.direction === 'asc';
    setSortConfig({ key: columnId, direction: isAsc ? 'desc' : 'asc' });
  };

  const sortedAddresses = React.useMemo(() => {
    if (sortConfig.key === 'actions' || sortConfig.key === 'link') return addresses;
    
    return [...addresses].sort((a, b) => {
      const valA = a[sortConfig.key as keyof Address];
      const valB = b[sortConfig.key as keyof Address];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (valA < valB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [addresses, sortConfig]);

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

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddressSubmitting(true);
    try {
      // Geocoding
      let latitude: number | undefined;
      let longitude: number | undefined;

      if (geocodingLib) {
          try {
              const geocoder = new geocodingLib.Geocoder();
              const addressString = `${addressFormData.street}, ${addressFormData.city}, ${addressFormData.province}, ${addressFormData.postalCode}, ${addressFormData.country}`;
              const geoRes = await geocoder.geocode({ address: addressString });
              
              if (geoRes.results && geoRes.results.length > 0) {
                  const location = geoRes.results[0].geometry.location;
                  latitude = location.lat();
                  longitude = location.lng();
              }
          } catch (geoError) {
              console.warn("Geocoding failed:", geoError);
              // Proceed without coordinates
          }
      }

      const url = selectedAddress 
        ? `${process.env.NEXT_PUBLIC_API_URL}/users/addresses/${selectedAddress.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/users/addresses`;
      
      const method = selectedAddress ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addressFormData, latitude, longitude }),
        credentials: 'include',
      });

      if (res.ok) {
        setIsAddressDialogOpen(false);
        fetchAddresses();
      }
    } catch (error) {
      console.error('Failed to save address', error);
    } finally {
      setIsAddressSubmitting(false);
    }
  };

  const openAddressDialog = (address?: Address) => {
    if (address) {
      setSelectedAddress(address);
      setAddressFormData({
        street: address.street,
        city: address.city,
        province: address.province,
        postalCode: address.postalCode,
        country: address.country,
        link: address.link || '',
      });
    } else {
      setSelectedAddress(null);
      setAddressFormData({ street: '', city: '', province: '', postalCode: '', country: '', link: '' });
    }
    setIsAddressDialogOpen(true);
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

  const handleSetDefaultAddress = async (id: number, updatePickups?: boolean) => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/addresses/${id}/default`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updateFuturePickups: updatePickups }),
            credentials: 'include',
        });

        if (res.status === 409) {
            const data = await res.json();
            setWarningData({ count: data.count, addressId: id });
            setWarningOpen(true);
            return;
        }

        if (res.ok) {
            setWarningOpen(false);
            fetchAddresses();
        }
    } catch (error) {
        console.error('Failed to set default address', error);
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
              onClick={() => openAddressDialog()}
              size="small"
            >
              Add Address
            </Button>
          </Box>
          
          <CustomTable
            columns={addressColumns}
            data={sortedAddresses}
            isLoading={isAddressesLoading}
            emptyMessage="No addresses found. Add one to get started."
            sortConfig={sortConfig}
            onSort={handleSort}
            renderCell={(item, column) => {
              if (column.id === 'isDefault') {
                return item.isDefault ? (
                  <Badge badgeContent="Default" color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem' } }}>
                    <Box />
                  </Badge>
                ) : null;
              }
              if (column.id === 'link') {
                return item.link ? (
                  <Tooltip title={item.link}>
                    <IconButton
                      component="a"
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="primary"
                      size="small"
                    >
                      <LinkIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : '-';
              }
              if (column.id === 'actions') {
                return (
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title={item.isDefault ? "Default Address" : "Set as Default"}>
                        <span>
                            <IconButton
                                color="warning"
                                size="small"
                                onClick={() => handleSetDefaultAddress(item.id)}
                                disabled={item.isDefault}
                            >
                                {item.isDefault ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                            </IconButton>
                        </span>
                    </Tooltip>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => openAddressDialog(item)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDeleteAddress(item.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
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

      {/* Add/Edit Address Dialog */}
      <CustomDialog
        open={isAddressDialogOpen}
        onClose={() => setIsAddressDialogOpen(false)}
        title={selectedAddress ? "Edit Address" : "Add New Address"}
        component="form"
        onSubmit={handleAddressSubmit}
        actions={
          <>
            <CancelButton onClick={() => setIsAddressDialogOpen(false)}>Cancel</CancelButton>
            <SubmitButton isSubmitting={isAddressSubmitting}>
              {selectedAddress ? "Update Address" : "Save Address"}
            </SubmitButton>
          </>
        }
      >
        <AddressForm
          data={addressFormData}
          onChange={(data) => setAddressFormData(data)}
        />
      </CustomDialog>

      {/* Future Pickup Warning Dialog */}
      <CustomDialog
        open={warningOpen}
        onClose={() => setWarningOpen(false)}
        title="Update Future Pickups?"
        actions={
            <>
                <Button onClick={() => setWarningOpen(false)}>Cancel</Button>
                <Button 
                    onClick={() => handleSetDefaultAddress(warningData!.addressId, false)} 
                    variant="outlined"
                >
                    No, keep old address
                </Button>
                <Button 
                    onClick={() => handleSetDefaultAddress(warningData!.addressId, true)} 
                    variant="contained" 
                    color="primary"
                >
                    Yes, update pick-ups
                </Button>
            </>
        }
      >
        <Stack spacing={2}>
            <Alert severity="info">
                You have {warningData?.count} upcoming lifts with a different pick-up address.
            </Alert>
            <Typography>
                Do you want to update these lifts to use your new default address?
            </Typography>
        </Stack>
      </CustomDialog>
    </PageContainer>
  );
}

export default function ProfilePage() {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      <ProfileContent />
    </APIProvider>
  );
}