'use client';

import React, { useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import { CreateCarDTO, Car, UpdateCarDTO } from '../types';
import CustomDialog from '@/components/shared/ui/CustomDialog';
import CustomTextField from '@/components/shared/ui/CustomTextField';
import SubmitButton from '@/components/shared/ui/SubmitButton';
import CancelButton from '@/components/shared/ui/CancelButton';

interface CarFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCarDTO | UpdateCarDTO) => Promise<void>;
  initialData?: Car;
}

export default function CarFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
}: CarFormDialogProps) {
  const [formData, setFormData] = useState<CreateCarDTO>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    seatCapacity: 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          make: initialData.make,
          model: initialData.model,
          year: initialData.year,
          licensePlate: initialData.licensePlate,
          seatCapacity: initialData.seatCapacity,
        });
      } else {
        setFormData({
          make: '',
          model: '',
          year: new Date().getFullYear(),
          licensePlate: '',
          seatCapacity: 5,
        });
      }
    }
  }, [initialData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'year' || name === 'seatCapacity') {
      const numValue = value === '' ? 0 : parseInt(value);
      setFormData((prev) => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      if (initialData) {
        await onSubmit({ ...formData, id: initialData.id } as any);
      } else {
        await onSubmit(formData);
      }
      onClose();
    } catch (err) {
      console.error('Form submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={initialData ? 'Edit Car' : 'Add New Car'}
      component="form"
      onSubmit={handleFormSubmit}
      maxWidth="sm"
      fullWidth
      actions={
        <>
          <CancelButton onClick={onClose} disabled={isSubmitting}>
            Cancel
          </CancelButton>
          <SubmitButton isSubmitting={isSubmitting} disabled={isSubmitting}>
            {initialData ? 'Update Car' : 'Add Car'}
          </SubmitButton>
        </>
      }
    >
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <CustomTextField
            id="make"
            name="make"
            label="Make"
            placeholder="e.g. Toyota"
            value={formData.make}
            onChange={handleChange}
            required
            autoFocus
          />
          <CustomTextField
            id="model"
            name="model"
            label="Model"
            placeholder="e.g. Corolla"
            value={formData.model}
            onChange={handleChange}
            required
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <CustomTextField
            id="year"
            name="year"
            label="Year"
            type="number"
            value={formData.year || ''}
            onChange={handleChange}
            required
          />
          <CustomTextField
            id="seatCapacity"
            name="seatCapacity"
            label="Seat Capacity"
            type="number"
            value={formData.seatCapacity || ''}
            onChange={handleChange}
            required
            helperText="Including driver's seat"
          />
        </Stack>

        <CustomTextField
          id="licensePlate"
          name="licensePlate"
          label="License Plate"
          placeholder="e.g. ABC 123 GP"
          value={formData.licensePlate}
          onChange={handleChange}
          required
        />
      </Stack>
    </CustomDialog>
  );
}
