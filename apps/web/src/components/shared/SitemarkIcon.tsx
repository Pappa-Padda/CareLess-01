import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function SitemarkIcon() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
      <img src="/icons/icon-192x192.jpg" alt="Careless Logo" style={{ height: 32, width: 32, marginRight: 8, borderRadius: '4px' }} />
      <Typography variant="h6" component="div" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
        CAReLESS
      </Typography>
    </Box>
  );
}
