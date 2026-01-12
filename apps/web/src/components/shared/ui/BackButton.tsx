'use client';

import React from 'react';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Tooltip from '@mui/material/Tooltip';
import { useRouter } from 'next/navigation';

interface BackButtonProps extends IconButtonProps {
  href: string;
  tooltip?: string;
}

export default function BackButton({ href, tooltip = "Go Back", sx, ...props }: BackButtonProps) {
  const router = useRouter();

  return (
    <Tooltip title={tooltip}>
      <IconButton 
        onClick={() => router.push(href)} 
        color="default" 
        size="medium" 
        sx={{ ml: -1, ...sx }}
        {...props}
      >
        <ArrowBackIcon />
      </IconButton>
    </Tooltip>
  );
}
