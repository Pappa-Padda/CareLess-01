'use client';
import React, { useEffect, useState } from 'react';
import { Box, Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import ErrorMessage from '@/components/shared/ui/ErrorMessage';
import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import CarTable from '@/features/cars/components/CarTable';
import CarFormDialog from '@/features/cars/components/CarFormDialog';
import { carService } from '@/features/cars/carService';
import { CreateCarDTO, Car, UpdateCarDTO } from '@/features/cars/types';
import { useAuth } from '@/context/AuthContext';

export default function CarsPage() {
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const fetchCars = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await carService.getCars();
      setCars(data.cars);
    } catch (err) {
      console.error(err);
      setError('Failed to load cars');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
        fetchCars();
    }
  }, [fetchCars, user]);

  const handleCreate = () => {
    setSelectedCar(undefined);
    setOpenDialog(true);
  };

  const handleEdit = (car: Car) => {
    setSelectedCar(car);
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this car?')) {
      try {
        await carService.deleteCar(id);
        fetchCars();
      } catch (err) {
        console.error(err);
        setError('Failed to delete car');
      }
    }
  };

  const handleSubmit = async (data: CreateCarDTO | UpdateCarDTO) => {
    const dataWithId = data as any;
    if (dataWithId.id) {
      await carService.updateCar(dataWithId.id, data);
    } else {
      await carService.createCar(data as CreateCarDTO);
    }
    fetchCars();
  };

  return (
    <PageContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageHeading>
          Car Management
        </PageHeading>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
        >
          Add Car
        </Button>
      </Box>

      <ErrorMessage message={error} onClose={() => setError(null)} />

      <CarTable
        cars={cars}
        isLoading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CarFormDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSubmit}
        initialData={selectedCar}
      />
    </PageContainer>
  );
}