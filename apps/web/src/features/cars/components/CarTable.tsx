import React from 'react';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { Car } from '../types';
import CustomTable, { Column } from  '../../../components/shared/ui/CustomTable';

interface CarTableProps {
  cars: Car[];
  isLoading: boolean;
  onEdit: (car: Car) => void;
  onDelete: (id: number) => void;
  onSetDefault: (id: number) => void;
}

export default function CarTable({ cars, isLoading, onEdit, onDelete, onSetDefault }: CarTableProps) {
  const columns: Column<Car>[] = [
    { id: 'make', label: 'Make', width: '15%' },
    { id: 'model', label: 'Model', width: '15%' },
    { id: 'color', label: 'Color', width: '10%' },
    { id: 'year', label: 'Year', width: '10%' },
    { id: 'licensePlate', label: 'License Plate', width: '15%' },
    { id: 'seatCapacity', label: 'Seats', width: '10%', align: 'right' },
    { id: 'isDefault', label: 'Status', width: '10%', align: 'center' },
    { id: 'actions', label: 'Actions', align: 'right', width: '15%' },
  ];

  const renderCell = (car: Car, column: Column<Car>) => {
    switch (column.id) {
      case 'make':
        return car.make;
      case 'model':
        return car.model;
      case 'color':
        return car.color;
      case 'year':
        return car.year;
      case 'licensePlate':
        return car.licensePlate;
      case 'seatCapacity':
        return car.seatCapacity;
      case 'isDefault':
        return car.isDefault ? (
          <Chip label="Default" color="primary" size="small" variant="outlined" />
        ) : null;
      case 'actions':
        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
             <Tooltip title={car.isDefault ? "Default Car" : "Set as Default"}>
                <span>
                    <IconButton 
                        onClick={() => onSetDefault(car.id)} 
                        color="warning" 
                        size="small" 
                        disabled={car.isDefault}
                    >
                        {car.isDefault ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                    </IconButton>
                </span>
            </Tooltip>
            <IconButton onClick={() => onEdit(car)} color="primary" size="small" aria-label="edit">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={() => onDelete(car.id)} color="error" size="small" aria-label="delete">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        );
      default:
        return null;
    }
  };

  return (
    <CustomTable
      columns={columns}
      data={cars}
      isLoading={isLoading}
      renderCell={renderCell}
      emptyMessage="No cars registered. Add one to get started!"
    />
  );
}