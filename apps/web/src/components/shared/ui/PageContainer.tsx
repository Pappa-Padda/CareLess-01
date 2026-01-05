import * as React from 'react';
import Box, { BoxProps } from '@mui/material/Box';

interface PageContainerProps extends BoxProps {
  children: React.ReactNode;
}

export default function PageContainer({ children, sx, ...props }: PageContainerProps) {
  return (
    <Box
      sx={{
        p: 3,
        maxWidth: 1200,
        mx: 'auto',
        width: '100%',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
