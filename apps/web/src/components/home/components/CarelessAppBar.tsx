'use client';
import * as React from 'react';
import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import ColorModeIconDropdown from '../../shared-theme/ColorModeIconDropdown';
import Sitemark from '../../shared/SitemarkIcon';
import { useAuth } from '@/context/AuthContext';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
  backdropFilter: 'blur(24px)',
  border: '1px solid',
  borderColor: (theme.vars || theme).palette.divider,
  backgroundColor: theme.vars
    ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.4)`
    : alpha(theme.palette.background.default, 0.4),
  boxShadow: (theme.vars || theme).shadows[1],
  padding: '8px 12px',
}));

export default function CarelessAppBar() {
  const { user, logout } = useAuth();

  let authButtons;
  if (user) {
    authButtons = (
      <>
        <Typography variant="body2" color="text.primary">
          {user.name}
        </Typography>
        <Button color="primary" variant="outlined" size="small" onClick={logout}>
          Logout
        </Button>
      </>
    );
  } else {
    authButtons = (
      <>
        <Button color="primary" variant="text" size="small" component={Link} href="/sign-in">
          Sign in
        </Button>
        <Button color="primary" variant="contained" size="small" component={Link} href="/sign-up">
          Sign up
        </Button>
      </>
    );
  }

  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 0,
        bgcolor: 'transparent',
        backgroundImage: 'none',
        mt: 'calc(var(--template-frame-height, 0px) + 28px)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth="lg">
        <StyledToolbar variant="dense" disableGutters>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', px: 0 }}>
            <Sitemark />
          </Box>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
            }}
          >
            {authButtons}
            <ColorModeIconDropdown />
          </Box>
        </StyledToolbar>
      </Container>
    </AppBar>
  );
}
