import * as React from 'react';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

interface CustomDialogProps extends Omit<DialogProps, 'title' | 'onSubmit'> {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  component?: 'form';
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
}

export default function CustomDialog({
  open,
  onClose,
  title,
  actions,
  children,
  component,
  onSubmit,
  ...props
}: CustomDialogProps) {
  const dialogContent = (
    <>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {children}
      </DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </>
  );

  return (
    <Dialog open={open} onClose={onClose} {...props}>
      {component === 'form' ? (
        <form onSubmit={onSubmit}>
          {dialogContent}
        </form>
      ) : (
        dialogContent
      )}
    </Dialog>
  );
}
