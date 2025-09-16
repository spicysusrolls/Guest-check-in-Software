import React from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { guestAPI, adminAPI } from '../services/api';
import StatsCard from '../components/StatsCard';
import GuestStatusChart from '../components/GuestStatusChart';
import RecentGuestsList from '../components/RecentGuestsList';

export default function Dashboard() {
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery('guestStats', guestAPI.getStats);

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery('dashboardData', adminAPI.getDashboard);

  if (statsLoading || dashboardLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (statsError || dashboardError) {
    return (
      <Alert severity="error">
        Failed to load dashboard data: {statsError?.message || dashboardError?.message}
      </Alert>
    );
  }

  const stats = statsData?.data?.stats || {};
  const dashboard = dashboardData?.data?.dashboard || {};

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Guests"
            value={stats.total || 0}
            icon={<PeopleIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Today's Guests"
            value={stats.today?.total || 0}
            icon={<PersonAddIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Currently In Office"
            value={stats.currentlyInOffice || 0}
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending Approval"
            value={stats.today?.pending || 0}
            icon={<BusinessIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Charts and Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Today's Guest Status
            </Typography>
            <GuestStatusChart data={stats.today} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Recent Guests
            </Typography>
            <RecentGuestsList guests={dashboard.recentGuests || []} />
          </Paper>
        </Grid>
      </Grid>

      {/* System Status */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center">
                    <Box
                      width={12}
                      height={12}
                      borderRadius="50%"
                      bgcolor={dashboard.systemStatus?.googleSheets ? 'success.main' : 'error.main'}
                      mr={1}
                    />
                    <Typography variant="body2">Google Sheets</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center">
                    <Box
                      width={12}
                      height={12}
                      borderRadius="50%"
                      bgcolor={dashboard.systemStatus?.twilio ? 'success.main' : 'error.main'}
                      mr={1}
                    />
                    <Typography variant="body2">Twilio SMS</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center">
                    <Box
                      width={12}
                      height={12}
                      borderRadius="50%"
                      bgcolor={dashboard.systemStatus?.slack ? 'success.main' : 'error.main'}
                      mr={1}
                    />
                    <Typography variant="body2">Slack</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center">
                    <Box
                      width={12}
                      height={12}
                      borderRadius="50%"
                      bgcolor={dashboard.systemStatus?.jotform ? 'success.main' : 'error.main'}
                      mr={1}
                    />
                    <Typography variant="body2">JotForm</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}