'use client';
import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Alert, Stack } from '@mui/material';
import { Add } from '@mui/icons-material';
import ErrorMessage from '@/components/shared/ui/ErrorMessage';
import PageContainer from '@/components/shared/ui/PageContainer';
import PageHeading from '@/components/shared/ui/PageHeading';
import CarTable from '@/features/cars/components/CarTable';
import CarFormDialog from '@/features/cars/components/CarFormDialog';
import CustomDialog from '@/components/shared/ui/CustomDialog';
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

  // Warning State
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningData, setWarningData] = useState<{ count: number, carId: number } | null>(null);

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

  const handleSetDefault = async (id: number, updateOffers?: boolean) => {
    try {
        const result = await carService.setDefaultCar(id, updateOffers);
        
        if (result && result.code === 'FUTURE_OFFERS_WARNING') {
            setWarningData({ count: result.count || 0, carId: id });
            setWarningOpen(true);
            return;
        }

        setWarningOpen(false);
        setWarningData(null);
        fetchCars();
    } catch (err) {
        console.error(err);
        setError('Failed to set default car');
    }
  };

  const handleSubmit = async (data: CreateCarDTO | UpdateCarDTO) => {
    if ('id' in data && data.id) {
      await carService.updateCar(data.id, data);
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
        onSetDefault={(id) => handleSetDefault(id)}
      />

      <CarFormDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSubmit}
        initialData={selectedCar}
      />

      <CustomDialog
        open={warningOpen}
        onClose={() => setWarningOpen(false)}
        title="Update Future Offers?"
        actions={
            <>
                <Button onClick={() => setWarningOpen(false)}>Cancel</Button>
                <Button 
                    onClick={() => handleSetDefault(warningData!.carId, false)} 
                    variant="outlined"
                >
                    No, keep old car
                </Button>
                <Button 
                    onClick={() => handleSetDefault(warningData!.carId, true)} 
                    variant="contained" 
                    color="primary"
                >
                    Yes, update offers
                </Button>
            </>
        }
      >
        <Stack spacing={2}>
            <Alert severity="info">
                You have {warningData?.count} upcoming lift offers associated with a different car.
            </Alert>
            <Typography>
                Do you want to update these offers to use your new default car?
            </Typography>
            <Typography variant="caption" color="text.secondary">
                Note: If the new car has fewer seats, some passengers may be removed automatically.
            </Typography>
        </Stack>
      </CustomDialog>
    </PageContainer>
  );
}