import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
} from '@mui/material';
import { CreateEventDTO, Event, UpdateEventDTO } from '../types';

interface EventFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEventDTO | UpdateEventDTO) => Promise<void>;
  initialData?: Event;
}

const defaultAddress = {
  street: '',
  city: '',
  province: '',
  postalCode: '',
  country: '',
};

export default function EventFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
}: EventFormDialogProps) {
  const [formData, setFormData] = useState<CreateEventDTO>({
    name: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    groupId: 1, // Defaulting to 1 for now
    address: defaultAddress,
  });

  useEffect(() => {
    const resetForm = async () => {
      if (initialData) {
        setFormData({
          name: initialData.name,
          description: initialData.description || '',
          date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
          startTime: initialData.startTime ? new Date(initialData.startTime).toTimeString().substring(0, 5) : '',
          endTime: initialData.endTime ? new Date(initialData.endTime).toTimeString().substring(0, 5) : '',
          groupId: initialData.groupId,
          address: initialData.address || defaultAddress,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          date: '',
          startTime: '',
          endTime: '',
          groupId: 1,
          address: defaultAddress,
        });
      }
    };
    resetForm();
  }, [initialData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
        ...prev,
        [name]: name === 'groupId' ? Number(value) : value
    }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [name]: value },
    }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.name || !formData.date || !formData.startTime || !formData.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    // Construct full date objects for start/end time if needed, 
    // but DTO expects strings. The API handles conversion.
    // However, for Time inputs, we get "HH:MM". 
    // We should probably append the date to it to make a full ISO string if API expects that.
    // My Controller expects `new Date(startTime)`. `new Date("HH:MM")` is invalid.
    // I should combine date + time.

    // Note: This timezone handling is naive. Ideally use dayjs/date-fns.
    // For prototype, I will just send the ISO string constructed from local.
    
    // Actually, let's just send what the controller needs.
    // Controller: `new Date(startTime)`
    // If I send "2023-10-10T10:00", it works.
    
    const submitData: CreateEventDTO = {
        ...formData,
        groupId: Number(formData.groupId),
        startTime: `${formData.date}T${formData.startTime}`,
        endTime: `${formData.date}T${formData.endTime}`,
    };

    if (initialData) {
        await onSubmit({ ...submitData, id: Number(initialData.id) });
    } else {
        await onSubmit(submitData);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? 'Edit Event' : 'Create New Event'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Event Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
          />
          
          <Stack direction="row" spacing={2}>
             <TextField
                label="Date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
          </Stack>
          <Stack direction="row" spacing={2}>
              <TextField
                label="Start Time"
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Time"
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
          </Stack>

          <Typography variant="h6" sx={{ mt: 2 }}>Location (Address)</Typography>
          <TextField
            label="Street"
            name="street"
            value={formData.address.street}
            onChange={handleAddressChange}
            fullWidth
            required
          />
          <Stack direction="row" spacing={2}>
            <TextField
                label="City"
                name="city"
                value={formData.address.city}
                onChange={handleAddressChange}
                fullWidth
                required
            />
            <TextField
                label="Province/State"
                name="province"
                value={formData.address.province}
                onChange={handleAddressChange}
                fullWidth
                required
            />
          </Stack>
           <Stack direction="row" spacing={2}>
            <TextField
                label="Postal Code"
                name="postalCode"
                value={formData.address.postalCode}
                onChange={handleAddressChange}
                fullWidth
                required
            />
            <TextField
                label="Country"
                name="country"
                value={formData.address.country}
                onChange={handleAddressChange}
                fullWidth
                required
            />
          </Stack>
           
           <TextField
                label="Group ID"
                name="groupId"
                type="number"
                value={formData.groupId}
                onChange={handleChange}
                fullWidth
                helperText="ID of the group this event belongs to"
            />

        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {initialData ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
