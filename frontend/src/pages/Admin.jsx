import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Admin() {
  const [integrationDialog, setIntegrationDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery('adminDashboard', adminAPI.getDashboard);

  const {
    data: integrationStatus,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useQuery('integrationStatus', adminAPI.getIntegrationStatus);

  const testIntegrationMutation = useMutation(
    (integration) => adminAPI.testIntegration(integration),
    {
      onSuccess: (data, integration) => {
        if (data.data.success) {
          toast.success(`${integration} integration test passed`);
        } else {
          toast.error(`${integration} integration test failed: ${data.data.error}`);
        }
        refetchStatus();
      },
      onError: (error, integration) => {
        toast.error(`Failed to test ${integration}: ${error.response?.data?.message || error.message}`);
      },
    }
  );

  const exportDataMutation = useMutation(
    (format) => adminAPI.exportGuests({ format }),
    {
      onSuccess: (data) => {
        // Handle CSV download
        if (data.headers['content-type']?.includes('text/csv')) {
          const blob = new Blob([data.data], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = 'guests.csv';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          toast.success('Guest data exported successfully');
        } else {
          toast.success('Export completed');
        }
      },
      onError: (error) => {
        toast.error(`Export failed: ${error.response?.data?.message || error.message}`);
      },
    }
  );

  if (dashboardLoading || statusLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (dashboardError) {
    return (
      <Alert severity="error">
        Failed to load admin data: {dashboardError.response?.data?.message || dashboardError.message}
      </Alert>
    );
  }

  const dashboard = dashboardData?.data?.dashboard || {};
  const integrations = integrationStatus?.data?.integrations || {};

  const getStatusChip = (status) => {
    return (
      <Chip
        label={status ? 'Connected' : 'Disconnected'}
        color={status ? 'success' : 'error'}
        size="small"
        variant="outlined"
      />
    );
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* System Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Summary
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Guests: {dashboard.summary?.totalGuests || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Today's Guests: {dashboard.summary?.todayGuests || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Currently In Office: {dashboard.summary?.currentlyInOffice || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Pending Approval: {dashboard.summary?.pendingApproval || 0}
                </Typography>
              </Box>
              <Button
                startIcon={<RefreshIcon />}
                onClick={() => refetchDashboard()}
                size="small"
              >
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={() => exportDataMutation.mutate('csv')}
                  disabled={exportDataMutation.isLoading}
                  variant="outlined"
                  size="small"
                >
                  Export Guest Data (CSV)
                </Button>
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={() => exportDataMutation.mutate('json')}
                  disabled={exportDataMutation.isLoading}
                  variant="outlined"
                  size="small"
                >
                  Export Guest Data (JSON)
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Integration Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Integration Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" p={1}>
                <Typography variant="body2">Google Sheets</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  {getStatusChip(integrations.googleSheets?.success)}
                  <Tooltip title="Test Connection">
                    <IconButton
                      size="small"
                      onClick={() => testIntegrationMutation.mutate('google-sheets')}
                      disabled={testIntegrationMutation.isLoading}
                    >
                      <SettingsIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" p={1}>
                <Typography variant="body2">Twilio SMS</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  {getStatusChip(integrations.twilio?.success)}
                  <Tooltip title="Test Connection">
                    <IconButton
                      size="small"
                      onClick={() => testIntegrationMutation.mutate('twilio')}
                      disabled={testIntegrationMutation.isLoading}
                    >
                      <SettingsIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" p={1}>
                <Typography variant="body2">Slack</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  {getStatusChip(integrations.slack?.success)}
                  <Tooltip title="Test Connection">
                    <IconButton
                      size="small"
                      onClick={() => testIntegrationMutation.mutate('slack')}
                      disabled={testIntegrationMutation.isLoading}
                    >
                      <SettingsIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" p={1}>
                <Typography variant="body2">JotForm</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  {getStatusChip(integrations.jotform?.success)}
                  <Tooltip title="Test Connection">
                    <IconButton
                      size="small"
                      onClick={() => testIntegrationMutation.mutate('jotform')}
                      disabled={testIntegrationMutation.isLoading}
                    >
                      <SettingsIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <List dense>
            {dashboard.recentActivity?.slice(0, 10).map((activity, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={`${activity.action} - ${activity.guestName}`}
                  secondary={`${activity.performedBy} • ${new Date(activity.timestamp).toLocaleString()}`}
                />
              </ListItem>
            )) || (
              <ListItem>
                <ListItemText primary="No recent activity" />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>

      {/* Integration Details Dialog */}
      <Dialog
        open={integrationDialog}
        onClose={() => setIntegrationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Integration Details: {selectedIntegration}</DialogTitle>
        <DialogContent>
          {selectedIntegration && integrations[selectedIntegration] && (
            <Box>
              <Typography variant="body2">
                Status: {integrations[selectedIntegration].success ? 'Connected' : 'Disconnected'}
              </Typography>
              {integrations[selectedIntegration].error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {integrations[selectedIntegration].error}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIntegrationDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}