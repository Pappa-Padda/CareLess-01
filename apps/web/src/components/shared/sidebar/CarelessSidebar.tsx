'use client';
import * as React from 'react';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import EmojiTransportationIcon from '@mui/icons-material/EmojiTransportation';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import MapIcon from '@mui/icons-material/Map';
import ChatIcon from '@mui/icons-material/Chat';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ColorModeIconDropdown from '../../shared-theme/ColorModeIconDropdown';

const drawerWidth = 240;

type MenuItem =
  | { kind: 'header'; title: string }
  | { kind: 'item'; text: string; icon: React.ReactNode; href: string };

const menuItems: MenuItem[] = [
  { kind: 'header', title: 'General Setup' },
  { kind: 'item', text: 'Profile Setup', icon: <PersonIcon />, href: '/profile' },
  { kind: 'item', text: 'Groups', icon: <GroupIcon />, href: '/groups' },

  { kind: 'header', title: 'Passenger Core' },
  { kind: 'item', text: 'Event List', icon: <FormatListBulletedIcon />, href: '/event-list' },
  { kind: 'item', text: 'My Lifts', icon: <EmojiTransportationIcon />, href: '/my-lifts' },
  { kind: 'item', text: 'Lift Confirmation', icon: <CheckCircleIcon />, href: '/confirmation' },

  { kind: 'header', title: 'Driver Core' },
  { kind: 'item', text: 'Car Management', icon: <DirectionsCarIcon />, href: '/cars' },
  { kind: 'item', text: 'My Event Bookings', icon: <BookmarkIcon />, href: '/bookings' },
  { kind: 'item', text: 'Route View', icon: <MapIcon />, href: '/route' },

  { kind: 'header', title: 'Admin Management' },
  { kind: 'item', text: 'Admin Dashboard', icon: <DashboardIcon />, href: '/admin-dashboard' },
  { kind: 'item', text: 'Event Management', icon: <EventIcon />, href: '/admin/events' },
  { kind: 'item', text: 'Address Management', icon: <LocationOnIcon />, href: '/addresses' },
  { kind: 'item', text: 'Allocation Console', icon: <SettingsSuggestIcon />, href: '/allocation' },
  { kind: 'item', text: 'Communication Center', icon: <ChatIcon />, href: '/chat' },
];

export default function CarelessSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: '64px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>
          <Tooltip title="Go Home">
            <IconButton onClick={() => router.push('/')} size="small">
              <HomeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="body2" noWrap sx={{ fontWeight: 'bold', maxWidth: '80px' }}>
            {user?.name || 'User'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ColorModeIconDropdown />
          <Tooltip title="Logout">
            <IconButton onClick={logout} size="small" color="error">
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ overflow: 'auto', color: 'text.primary' }}>
        <List>
          {menuItems.map((item, index) => {
            if (item.kind === 'header') {
              return (
                <ListSubheader
                  key={index}
                  sx={{
                    bgcolor: 'transparent',
                    lineHeight: '32px',
                    mt: 2,
                    mb: 1,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px',
                  }}
                >
                  {item.title}
                </ListSubheader>
              );
            }
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  component={Link}
                  href={item.href}
                  selected={pathname === item.href}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      fontWeight: 'bold',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'inherit',
                      },
                    },
                    ...(theme) => theme.applyStyles('light', {
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                        fontWeight: 'bold',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.3),
                        },
                      },
                    }),
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} sx={{ color: 'inherit' }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
}
