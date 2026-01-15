'use client';

import * as React from 'react';
import FormControl, { FormControlProps } from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectProps } from '@mui/material/Select';
import FormHelperText from '@mui/material/FormHelperText';

interface CustomSelectProps extends Omit<SelectProps, 'label'> {
  label: string;
  helperText?: string;
  formControlProps?: FormControlProps;
}

export default function CustomSelect({
    label,
    helperText,
    error,
    formControlProps,
    children,
    ...props
}: CustomSelectProps) {
  const labelId = `${props.id || props.name || 'custom-select'}-label`;

  return (
    <FormControl fullWidth error={error} {...formControlProps}>
      <InputLabel id={labelId} shrink sx={{ bgcolor: 'background.paper', px: 0.5 }}>
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        displayEmpty
        notched
        label={label}
        {...props}
        sx={{
          '& .MuiSelect-select': {
            py: 1.5,
          },
          ...props.sx,
        }}
      >
        {children}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
