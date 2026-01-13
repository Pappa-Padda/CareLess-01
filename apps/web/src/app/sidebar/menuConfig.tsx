import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import EmojiTransportationIcon from '@mui/icons-material/EmojiTransportation';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import MapIcon from '@mui/icons-material/Map';
import ChatIcon from '@mui/icons-material/Chat';

export type MenuItem =
  | { kind: 'header'; title: string }
  | { kind: 'item'; text: string; icon: React.ReactNode; href: string };

const generalItems: MenuItem[] = [
  { kind: 'header', title: 'General' },
  { kind: 'item', text: 'Profile Setup', icon: <PersonIcon />, href: '/profile' },
  { kind: 'item', text: 'Groups', icon: <GroupIcon />, href: '/groups' },
  { kind: 'item', text: 'Communication Center', icon: <ChatIcon />, href: '/chat' },
];

const passengerItems: MenuItem[] = [
  { kind: 'header', title: 'Passenger' },
  { kind: 'item', text: 'Event List', icon: <FormatListBulletedIcon />, href: '/event-list' },
  { kind: 'item', text: 'My Lifts', icon: <EmojiTransportationIcon />, href: '/my-lifts' },
];

const driverItems: MenuItem[] = [
  { kind: 'header', title: 'Driver' },
  { kind: 'item', text: 'Car Management', icon: <DirectionsCarIcon />, href: '/cars' },
  { kind: 'item', text: 'My Lift Offers', icon: <LocalTaxiIcon />, href: '/lift-offers' },
  { kind: 'item', text: 'Route View', icon: <MapIcon />, href: '/route' },
];

export const getMenuItems = (userRole: string | undefined, isGroupAdmin: boolean): MenuItem[] => {
  const isSystemAdmin = userRole === 'ADMIN';
  
  let adminItems: MenuItem[] = [];

  if (isSystemAdmin) {
    // System Admin sees everything
    adminItems = [
      { kind: 'header', title: 'Admin' },
      { kind: 'item', text: 'Admin Dashboard', icon: <DashboardIcon />, href: '/admin-dashboard' },
      { kind: 'item', text: 'Pickup Points', icon: <LocationOnIcon />, href: '/admin-dashboard/pickup-points' },
      { kind: 'item', text: 'Allocation Console', icon: <SettingsSuggestIcon />, href: '/admin-dashboard/allocation' },
      { kind: 'item', text: 'API Usage', icon: <DashboardIcon />, href: '/admin-dashboard/usage' },
    ];
  } else if (isGroupAdmin) {
    // Group Admin sees limited items
    adminItems = [
      { kind: 'header', title: 'Admin' },
      { kind: 'item', text: 'Pickup Points', icon: <LocationOnIcon />, href: '/admin-dashboard/pickup-points' },
      { kind: 'item', text: 'Allocation Console', icon: <SettingsSuggestIcon />, href: '/admin-dashboard/allocation' },
    ];
  }

  return [
    ...generalItems,
    ...passengerItems,
    ...driverItems,
    ...adminItems,
  ];
};
