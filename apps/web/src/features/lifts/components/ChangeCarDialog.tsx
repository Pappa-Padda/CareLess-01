import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';

import CustomDialog from '@/components/shared/ui/CustomDialog';
import CustomSelect from '@/components/shared/ui/CustomSelect';
import CancelButton from '@/components/shared/ui/CancelButton';
import SubmitButton from '@/components/shared/ui/SubmitButton';
import { carService } from '@/features/cars/carService';
import { Car } from '@/features/cars/types';

interface ChangeCarDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (carId: number, force?: boolean) => Promise<any>; // Returns warning object if conflict
  currentCarId: number;
}

export default function ChangeCarDialog({ open, onClose, onSubmit, currentCarId }: ChangeCarDialogProps) {
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Warning State
  const [warning, setWarning] = useState<{ code: string; message: string; currentPassengers: number; newCapacity: number } | null>(null);

  useEffect(() => {
    if (open) {
      const fetchCars = async () => {
        try {
            const data = await carService.getCars();
            setCars(data.cars);
            setSelectedCar(currentCarId);
        } catch (err) {
            setError('Failed to load cars');
        }
      };
      fetchCars();
      setWarning(null); // Reset warning on open
      setError(null);
    }
  }, [open, currentCarId]);

  const handleSubmit = async () => {
    if (!selectedCar) return;
    
    setLoading(true);
    setError(null);
    
    try {
        const result = await onSubmit(Number(selectedCar), false); // Try without force first
        
        if (result && result.code === 'CAPACITY_WARNING') {
            setWarning({
                code: result.code,
                message: result.error,
                currentPassengers: result.currentPassengers,
                newCapacity: result.newCapacity
            });
            setLoading(false);
            return;
        }

        onClose();
    } catch (err: any) {
        setError(err.message || 'Failed to update car');
    } finally {
        if (!warning) setLoading(false); // Keep loading false if we hit warning
    }
  };

  const handleForceSubmit = async () => {
    if (!selectedCar) return;
    setLoading(true);
    try {
        await onSubmit(Number(selectedCar), true); // Force update
        onClose();
    } catch (err: any) {
        setError(err.message || 'Failed to force update car');
    } finally {
        setLoading(false);
    }
  };

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={warning ? "⚠️ Capacity Warning" : "Change Car"}
      actions={
        warning ? (
            <>
                <CancelButton onClick={() => setWarning(null)} disabled={loading} />
                <Button 
                    onClick={handleForceSubmit} 
                    color="error" 
                    variant="contained" 
                    disabled={loading}
                >
                    {loading ? 'Processing...' : 'Remove Passengers & Proceed'}
                </Button>
            </>
        ) : (
            <>
                <CancelButton onClick={onClose} disabled={loading} />
                <SubmitButton 
                    onClick={handleSubmit}
                    isSubmitting={loading}
                    submittingText="Saving..."
                    disabled={!selectedCar || selectedCar === currentCarId || loading}
                >
                    Save Change
                </SubmitButton>
            </>
        )
      }
    >
        {warning ? (
            <Stack spacing={2}>
                <Alert severity="warning">
                    The selected car has fewer seats ({warning.newCapacity}) than the number of currently assigned passengers ({warning.currentPassengers}).
                </Alert>
                <Typography variant="body1">
                    If you proceed, <strong>ALL assigned passengers will be removed</strong> from this lift and their requests will be reset to pending.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    You will need to re-allocate passengers manually or let the admin handle it.
                </Typography>
            </Stack>
        ) : (
            <Stack spacing={3} sx={{ minWidth: 300, mt: 1 }}>
                {error && <Alert severity="error">{error}</Alert>}
                
                <CustomSelect
                    label="Select Car"
                    value={selectedCar}
                    onChange={(e) => setSelectedCar(e.target.value as number)}
                >
                    {cars.map(car => (
                        <MenuItem key={car.id} value={car.id}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <DirectionsCarIcon fontSize="small" color="action" />
                                <Typography>
                                    {car.make} {car.model} ({car.licensePlate})
                                </Typography>
                                {car.isDefault && <Typography variant="caption" color="primary" sx={{ ml: 1 }}>(Default)</Typography>}
                            </Stack>
                        </MenuItem>
                    ))}
                </CustomSelect>
                
                {selectedCar && (
                    <Typography variant="caption" color="text.secondary">
                        Capacity: {cars.find(c => c.id === selectedCar)?.seatCapacity} seats
                    </Typography>
                )}
            </Stack>
        )}
    </CustomDialog>
  );
}
