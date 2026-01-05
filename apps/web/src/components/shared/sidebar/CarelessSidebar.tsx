'use client';
import * as React from 'react';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
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
import InfoIcon from '@mui/icons-material/Info';
import EmojiTransportationIcon from '@mui/icons-material/EmojiTransportation';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import MapIcon from '@mui/icons-material/Map';
import ChatIcon from '@mui/icons-material/Chat';

const drawerWidth = 240;

const menuItems = [
  { text: 'Admin Dashboard', icon: <DashboardIcon /> },
  { text: 'Event Management', icon: <EventIcon /> },
  { text: 'Address Management', icon: <LocationOnIcon /> },
  { text: 'Group Dashboard', icon: <GroupIcon /> },
  { text: 'Profile Setup', icon: <PersonIcon /> },
  { text: 'Car Management', icon: <DirectionsCarIcon /> },
  { text: 'Driver Event List', icon: <ListAltIcon /> },
  { text: 'Offer Ride', icon: <LocalTaxiIcon /> },
  { text: 'Event List', icon: <FormatListBulletedIcon /> },
  { text: 'Event Details', icon: <InfoIcon /> },
  { text: 'My Lifts', icon: <EmojiTransportationIcon /> },
  { text: 'Allocation Console', icon: <SettingsSuggestIcon /> },
  { text: 'Lift Confirmation', icon: <CheckCircleIcon /> },
  { text: 'My Event Bookings', icon: <BookmarkIcon /> },
  { text: 'Route View', icon: <MapIcon /> },
  { text: 'Communication Center', icon: <ChatIcon /> },
];

export default function CarelessSidebar() {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const handleListItemClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
    setSelectedIndex(index);
  };

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
      <Toolbar />
      <Box sx={{ overflow: 'auto', color: 'text.primary' }}>
        <List>
          {menuItems.map((item, index) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={selectedIndex === index}
                onClick={(event) => handleListItemClick(event, index)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
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
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
