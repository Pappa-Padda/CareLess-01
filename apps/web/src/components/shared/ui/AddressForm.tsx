'use client';

import React from 'react';
import Stack from '@mui/material/Stack';
import CustomTextField from './CustomTextField';

export interface AddressFormData {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  link?: string;
}

interface AddressFormProps {
  data: AddressFormData;
  onChange: (data: AddressFormData) => void;
  required?: boolean;
}

export default function AddressForm({ data, onChange, required = true }: AddressFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({
      ...data,
      [name]: value,
    });
  };

  return (
    <Stack spacing={2}>
      <CustomTextField
        id="street"
        name="street"
        label="Street Address"
        value={data.street}
        onChange={handleChange}
        required={required}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <CustomTextField
          id="city"
          name="city"
          label="City"
          value={data.city}
          onChange={handleChange}
          required={required}
        />
        <CustomTextField
          id="province"
          name="province"
          label="Province/State"
          value={data.province}
          onChange={handleChange}
          required={required}
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <CustomTextField
          id="postalCode"
          name="postalCode"
          label="Postal Code"
          value={data.postalCode}
          onChange={handleChange}
          required={required}
        />
        <CustomTextField
          id="country"
          name="country"
          label="Country"
          value={data.country}
          onChange={handleChange}
          required={required}
        />
      </Stack>

      <CustomTextField
        id="link"
        name="link"
        label="Google Maps / Address Link"
        placeholder="https://maps.google.com/..."
        value={data.link || ''}
        onChange={handleChange}
      />
    </Stack>
  );
}
