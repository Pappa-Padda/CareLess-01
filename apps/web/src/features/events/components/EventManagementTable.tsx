import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Chip,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { Event } from '../types';

interface EventManagementTableProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (id: number) => void;
}

export default function EventManagementTable({ events, onEdit, onDelete }: EventManagementTableProps) {
  if (events.length === 0) {
    return <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>No events found.</Typography>;
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table sx={{ minWidth: 650 }} aria-label="event table">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Group</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {events.map((event) => (
            <TableRow
              key={event.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                <Typography variant="subtitle2">{event.name}</Typography>
                <Typography variant="caption" color="text.secondary">{event.description}</Typography>
              </TableCell>
              <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
              <TableCell>
                {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </TableCell>
              <TableCell>
                 {event.address ? (
                     <>
                        {event.address.street}, {event.address.city}
                     </>
                 ) : 'N/A'}
              </TableCell>
              <TableCell>
                <Chip label={`Group ${event.groupId}`} size="small" />
              </TableCell>
              <TableCell align="right">
                <IconButton onClick={() => onEdit(event)} color="primary" size="small">
                  <Edit />
                </IconButton>
                <IconButton onClick={() => onDelete(event.id)} color="error" size="small">
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
