import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Typography,
  Box,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    approved: 'info',
    'checked-in': 'primary',
    'with-host': 'secondary',
    'checked-out': 'default',
    cancelled: 'error',
  };
  return colors[status] || 'default';
};

export default function RecentGuestsList({ guests }) {
  if (!guests || guests.length === 0) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100%"
        color="text.secondary"
      >
        <Typography variant="body2">No recent guests</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%', maxHeight: 350, overflow: 'auto' }}>
      {guests.slice(0, 10).map((guest, index) => (
        <ListItem key={guest.id || index} alignItems="flex-start">
          <ListItemAvatar>
            <Avatar>
              <PersonIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={`${guest.firstName} ${guest.lastName}`}
            secondary={
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Host: {guest.hostName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Company: {guest.company || 'N/A'}
                </Typography>
                <Box mt={1}>
                  <Chip
                    label={guest.status}
                    size="small"
                    color={getStatusColor(guest.status)}
                    variant="outlined"
                  />
                </Box>
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}