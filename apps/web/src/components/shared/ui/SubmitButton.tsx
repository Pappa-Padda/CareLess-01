import * as React from 'react';
import Button, { ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

interface SubmitButtonProps extends ButtonProps {
  isSubmitting: boolean;
  submittingText?: string;
}

export default function SubmitButton({
  isSubmitting,
  submittingText = 'Processing...',
  children,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant="contained"
      disabled={isSubmitting}
      {...props}
    >
      {isSubmitting ? (
        <>
          <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
          {submittingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
