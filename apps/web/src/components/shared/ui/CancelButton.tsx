import * as React from 'react';
import Button, { ButtonProps } from '@mui/material/Button';

export default function CancelButton(props: ButtonProps) {
  return (
    <Button
      variant="text"
      {...props}
    />
  );
}
