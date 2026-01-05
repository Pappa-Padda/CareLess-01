import * as React from 'react';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import TextField, { StandardTextFieldProps } from '@mui/material/TextField';

interface CustomTextFieldProps extends Omit<StandardTextFieldProps, 'label' | 'variant'> {
  label: string;
}

export default function CustomTextField({ label, id, ...props }: CustomTextFieldProps) {
  return (
    <FormControl fullWidth>
      <FormLabel htmlFor={id}>{label}</FormLabel>
      <TextField
        id={id}
        variant="outlined"
        {...props}
      />
    </FormControl>
  );
}
