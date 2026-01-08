import * as React from 'react';
import Button, { ButtonProps } from '@mui/material/Button';

export default function CancelButton({ children, ...props }: ButtonProps) {
  return (
    <Button
      variant="text"
      {...props}
      sx={{
        '&.Mui-disabled': {
          color: 'action.disabled',
        },
        ...props.sx,
      }}
    >
      {children || 'Cancel'}
    </Button>
  );
}
