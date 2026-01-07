import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CustomDialog from '@/components/shared/ui/CustomDialog';
import CancelButton from '@/components/shared/ui/CancelButton';
import SubmitButton from '@/components/shared/ui/SubmitButton';
import { AllocationOffer } from './allocationService';

interface AllocationMessageDialogProps {
  open: boolean;
  onClose: () => void;
  offer: AllocationOffer | null;
  eventName: string;
  eventDate: string;
}

export default function AllocationMessageDialog({
  open,
  onClose,
  offer,
  eventName,
  eventDate,
}: AllocationMessageDialogProps) {
  
  const message = useMemo(() => {
    if (!offer) return '';
    
    // Formatting the date
    const dateObj = new Date(eventDate);
    const formattedDate = dateObj.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
    });

    let text = `🚗 *Lift Details for ${offer.driverName}*\n`;
    text += `📅 *Event:* ${eventName}\n`;
    text += `🗓️ *Date:* ${formattedDate}\n`;
    text += `🚘 *Car:* ${offer.carInfo}\n\n`;
    text += `*Passengers & Pickups:*\n`;

    if (offer.passengers.length === 0) {
        text += `(No passengers assigned yet)`;
    } else {
        offer.passengers.forEach((p, index) => {
            text += `${index + 1}. *${p.name}*\n`;
            if (p.pickupAddress || p.pickupTime) {
                // Handle potential time string formats
                let time = 'TBD';
                if (p.pickupTime) {
                    try {
                        const datePart = p.pickupTime.includes('T') ? p.pickupTime : `1970-01-01T${p.pickupTime}`;
                        time = new Date(datePart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    } catch {
                        time = String(p.pickupTime);
                    }
                }
                
                const addr = p.pickupAddress || 'TBD';
                text += `   📍 ${addr}\n`;
                text += `   ⏰ ${time}\n`;
            }
            text += `\n`;
        });
    }

    return text;
  }, [offer, eventName, eventDate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    onClose();
  };

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Lift Summary Message"
      actions={
        <>
            <CancelButton onClick={onClose} />
            <SubmitButton 
                variant="contained" 
                startIcon={<ContentCopyIcon />}
                onClick={handleCopy}
                isSubmitting={false}
            >
                Copy
            </SubmitButton>
        </>
      }
      fullWidth
      maxWidth="sm"
    >
      <Box sx={{ mt: 1 }}>
        <TextField
            multiline
            fullWidth
            rows={10}
            value={message}
            variant="outlined"
            slotProps={{
                input: {
                    readOnly: true,
                    sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                }
            }}
        />
      </Box>
    </CustomDialog>
  );
}
