import React from 'react';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Stack from '@mui/material/Stack';
import { Car } from '../types';
import CustomTable, { Column } from  '../../../components/shared/ui/CustomTable';

interface CarTableProps {
  cars: Car[];
  isLoading: boolean;
  onEdit: (car: Car) => void;
  onDelete: (id: number) => void;
}

export default function CarTable({ cars, isLoading, onEdit, onDelete }: CarTableProps) {
  const columns: Column<Car>[] = [
    { id: 'make', label: 'Make', width: '20%' },
    { id: 'model', label: 'Model', width: '20%' },
    { id: 'year', label: 'Year', width: '15%' },
    { id: 'licensePlate', label: 'License Plate', width: '20%' },
    { id: 'seatCapacity', label: 'Seats', width: '10%', align: 'right' },
    { id: 'actions', label: 'Actions', align: 'right', width: '15%' },
  ];

  const renderCell = (car: Car, column: Column<Car>) => {
    switch (column.id) {
      case 'make':
        return car.make;
      case 'model':
        return car.model;
      case 'year':
        return car.year;
      case 'licensePlate':
        return car.licensePlate;
      case 'seatCapacity':
        return car.seatCapacity;
      case 'actions':
        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
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