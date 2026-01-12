import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

export default function SitemarkIcon() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
      <Image 
        src="/icons/icon-192x192.jpg" 
        alt="Careless Logo" 
        width={32} 
        height={32} 
        style={{ marginRight: 8, borderRadius: '4px' }} 
      />
      <Typography variant="h6" component="div" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
        CAReLESS
      </Typography>
    </Box>
  );
}
