import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CustomDialog from '@/components/shared/ui/CustomDialog';
import CancelButton from '@/components/shared/ui/CancelButton';
import { Car } from '@/features/cars/types';

interface CarSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  cars: Car[];
  onSelect: (car: Car) => void;
}

export default function CarSelectionDialog({
  open,
  onClose,
  cars,
  onSelect,
}: CarSelectionDialogProps) {
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Select Vehicle"
      actions={<CancelButton onClick={onClose}>Cancel</CancelButton>}
      maxWidth="xs"
      fullWidth
    >
      <List sx={{ pt: 0 }}>
        {cars.map((car) => (
          <ListItem disableGutters key={car.id}>
            <ListItemButton onClick={() => onSelect(car)}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                  <DirectionsCarIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={`${car.make} ${car.model}`}
                secondary={`${car.year} • ${car.licensePlate} • ${car.seatCapacity} seats`}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </CustomDialog>
  );
}
