import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  CheckCircle as CheckInIcon,
  ExitToApp as CheckOutIcon,
  Message as MessageIcon,
  Notifications as NotifyIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { guestAPI } from '../services/api';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'checked-in', label: 'Checked In' },
  { value: 'with-host', label: 'With Host' },
  { value: 'checked-out', label: 'Checked Out' },
  { value: 'cancelled', label: 'Cancelled' },
];

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

export default function GuestList() {
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [smsDialog, setSmsDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [smsMessage, setSmsMessage] = useState('');

  const queryClient = useQueryClient();

  const {
    data: guestsData,
    isLoading,
    error,
  } = useQuery('guests', guestAPI.getAll, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const updateStatusMutation = useMutation(
    ({ id, status, notes }) => guestAPI.updateStatus(id, { status, notes }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('guests');
        toast.success('Guest status updated successfully');
        setStatusDialog(false);
        setSelectedGuest(null);
      },
      onError: (error) => {
        toast.error(`Failed to update status: ${error.response?.data?.message || error.message}`);
      },
    }
  );

  const checkInMutation = useMutation(
    (id) => guestAPI.checkIn(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('guests');
        toast.success('Guest checked in successfully');
      },
      onError: (error) => {
        toast.error(`Failed to check in: ${error.response?.data?.message || error.message}`);
      },
    }
  );

  const checkOutMutation = useMutation(
    (id) => guestAPI.checkOut(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('guests');
        toast.success('Guest checked out successfully');
      },
      onError: (error) => {
        toast.error(`Failed to check out: ${error.response?.data?.message || error.message}`);
      },
    }
  );

  const sendSmsMutation = useMutation(
    ({ id, message }) => guestAPI.sendSms(id, { message }),
    {
      onSuccess: () => {
        toast.success('SMS sent successfully');
        setSmsDialog(false);
        setSelectedGuest(null);
        setSmsMessage('');
      },
      onError: (error) => {
        toast.error(`Failed to send SMS: ${error.response?.data?.message || error.message}`);
      },
    }
  );

  const notifyHostMutation = useMutation(
    (id) => guestAPI.notifyHost(id, {}),
    {
      onSuccess: () => {
        toast.success('Host notified successfully');
      },
      onError: (error) => {
        toast.error(`Failed to notify host: ${error.response?.data?.message || error.message}`);
      },
    }
  );

  const handleStatusUpdate = () => {
    if (selectedGuest && newStatus) {
      updateStatusMutation.mutate({
        id: selectedGuest.id,
        status: newStatus,
        notes: statusNotes,
      });
    }
  };

  const handleSendSms = () => {
    if (selectedGuest && smsMessage.trim()) {
      sendSmsMutation.mutate({
        id: selectedGuest.id,
        message: smsMessage,
      });
    }
  };

  const columns = [
    {
      field: 'firstName',
      headerName: 'First Name',
      width: 120,
    },
    {
      field: 'lastName',
      headerName: 'Last Name',
      width: 120,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
    },
    {
      field: 'company',
      headerName: 'Company',
      width: 150,
    },
    {
      field: 'hostName',
      headerName: 'Host',
      width: 150,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'visitDate',
      headerName: 'Visit Date',
      width: 120,
      renderCell: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString();
      },
    },
    {
      field: 'checkInTime',
      headerName: 'Check In Time',
      width: 150,
      renderCell: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleString();
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Check In">
            <IconButton
              size="small"
              onClick={() => checkInMutation.mutate(params.row.id)}
              disabled={params.row.status === 'checked-in' || params.row.status === 'checked-out'}
            >
              <CheckInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Check Out">
            <IconButton
              size="small"
              onClick={() => checkOutMutation.mutate(params.row.id)}
              disabled={params.row.status !== 'checked-in' && params.row.status !== 'with-host'}
            >
              <CheckOutIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Update Status">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedGuest(params.row);
                setNewStatus(params.row.status);
                setStatusDialog(true);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Send SMS">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedGuest(params.row);
                setSmsDialog(true);
              }}
            >
              <MessageIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Notify Host">
            <IconButton
              size="small"
              onClick={() => notifyHostMutation.mutate(params.row.id)}
            >
              <NotifyIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load guests: {error.response?.data?.message || error.message}
      </Alert>
    );
  }

  const guests = guestsData?.data?.guests || [];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Guest List
      </Typography>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={guests}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          checkboxSelection={false}
          disableSelectionOnClick
          loading={isLoading}
        />
      </Box>

      {/* Status Update Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Guest Status</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            fullWidth
            margin="normal"
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Notes"
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={updateStatusMutation.isLoading}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* SMS Dialog */}
      <Dialog open={smsDialog} onClose={() => setSmsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send SMS to Guest</DialogTitle>
        <DialogContent>
          <TextField
            label="Message"
            value={smsMessage}
            onChange={(e) => setSmsMessage(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={4}
            placeholder="Enter your message here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSmsDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSendSms}
            variant="contained"
            disabled={sendSmsMutation.isLoading || !smsMessage.trim()}
          >
            Send SMS
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}