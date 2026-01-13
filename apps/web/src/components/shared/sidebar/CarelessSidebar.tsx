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
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { allocationService } from '@/features/allocation/allocationService';
import ColorModeIconDropdown from '../../shared-theme/ColorModeIconDropdown';
import { getMenuItems } from './menuConfig';

const drawerWidth = 240;

export default function CarelessSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        try {
          const data = await allocationService.getAdminGroups();
          setIsAdmin(data.groups && data.groups.length > 0);
        } catch (err) {
          console.error('Failed to check admin status', err);
        }
      }
    };
    checkAdmin();
  }, [user]);

  const menuItems = React.useMemo(() => {
    return getMenuItems(user?.role, isAdmin);
  }, [user?.role, isAdmin]);

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
