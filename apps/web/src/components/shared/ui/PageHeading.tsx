import * as React from 'react';
import Typography, { TypographyProps } from '@mui/material/Typography';

export default function PageHeading(props: TypographyProps) {
  return (
    <Typography
      variant="h4"
      component="h1"
      fontWeight="bold"
      {...props}
    />
  );
}
