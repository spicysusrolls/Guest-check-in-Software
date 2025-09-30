import React, { useState } from 'react';
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
  Button,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Container,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { guestAPI, adminAPI } from '../services/api';
import StatsCard from '../components/StatsCard';
import GuestStatusChart from '../components/GuestStatusChart';
import RecentGuestsList from '../components/RecentGuestsList';

export default function Dashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery('guestStats', guestAPI.getStats, {
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds
  });

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery('dashboardData', adminAPI.getDashboard, {
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const {
    data: checkedInData,
    isLoading: checkedInLoading,
    error: checkedInError,
    refetch: refetchCheckedIn,
  } = useQuery('checkedInGuests', () => 
    guestAPI.getAll().then(res => res.data?.guests?.filter(g => 
      g.status === 'checked-in' || g.status === 'with-host'
    ) || []), {
    refetchInterval: autoRefresh ? 15000 : false, // More frequent for active guests
  });

  const {
    data: todaysData,
    isLoading: todaysLoading,
    refetch: refetchTodays,
  } = useQuery('todaysGuests', () => 
    guestAPI.getAll().then(res => {
      const today = new Date().toISOString().split('T')[0];
      return res.data?.guests?.filter(g => 
        g.checkInDate?.startsWith(today)
      ) || [];
    }), {
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const handleRefreshAll = () => {
    refetchStats();
    refetchDashboard();
    refetchCheckedIn();
    refetchTodays();
  };

  if (statsLoading || dashboardLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>Loading Dashboard...</Typography>
        </Box>
      </Container>
    );
  }

  if (statsError || dashboardError) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load dashboard data: {statsError?.message || dashboardError?.message}
        </Alert>
        <Button onClick={handleRefreshAll} startIcon={<RefreshIcon />}>
          Retry
        </Button>
      </Container>
    );
  }

  const stats = statsData?.data?.stats || {};
  const dashboard = dashboardData?.data?.dashboard || {};
  const checkedInGuests = checkedInData || [];
  const todaysGuests = todaysData || [];

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <AppBar position="static" color="transparent" elevation={0} sx={{ mb: 3 }}>
        <Toolbar sx={{ px: 0 }}>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Guest Check-in Dashboard
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshAll}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date().toLocaleTimeString()}
          </Typography>
        </Toolbar>
      </AppBar>
      
      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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

      {/* Main Content */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Currently Checked-in Guests */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 500 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" component="h2">
                  Currently in Office ({checkedInGuests.length})
                </Typography>
                <Chip 
                  label={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
                  color={autoRefresh ? "success" : "default"}
                  size="small"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                />
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {checkedInLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : checkedInGuests.length === 0 ? (
                <Box 
                  display="flex" 
                  flexDirection="column" 
                  alignItems="center" 
                  justifyContent="center"
                  py={6}
                  color="text.secondary"
                >
                  <LocationIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    No guests currently in office
                  </Typography>
                  <Typography variant="body2">
                    Guests will appear here when they check in
                  </Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 380, overflow: 'auto' }}>
                  {checkedInGuests.map((guest, index) => (
                    <ListItem key={guest.guestId || index} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight="medium">
                            {guest.guestName || 'Guest'}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              <BusinessIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                              {guest.company || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <PersonIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                              Host: {guest.hostEmployee || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <ScheduleIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                              Checked in: {guest.checkInTime ? new Date(guest.checkInTime).toLocaleTimeString() : 'Unknown'}
                            </Typography>
                            {guest.phoneNumber && (
                              <Typography variant="body2" color="text.secondary">
                                <PhoneIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                {guest.phoneNumber}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Chip
                        label={guest.status === 'checked-in' ? 'In Lobby' : 'With Host'}
                        color={guest.status === 'checked-in' ? 'primary' : 'success'}
                        variant="outlined"
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Summary & Recent Activity */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={2}>
            {/* Today's Breakdown */}
            <Grid item xs={12}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Today's Activity
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h3" color="success.main" fontWeight="bold">
                          {todaysGuests.filter(g => g.status === 'checked-in' || g.status === 'with-host').length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Currently In
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h3" color="primary.main" fontWeight="bold">
                          {todaysGuests.filter(g => g.status === 'checked-out').length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Checked Out
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Guests */}
            <Grid item xs={12}>
              <Card sx={{ height: 350 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Check-ins
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {todaysLoading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress size={30} />
                    </Box>
                  ) : (
                    <RecentGuestsList 
                      guests={dashboard.recentGuests || todaysGuests.slice(0, 5).map(guest => ({
                        id: guest.guestId,
                        firstName: guest.guestName?.split(' ')[0] || 'Guest',
                        lastName: guest.guestName?.split(' ').slice(1).join(' ') || '',
                        company: guest.company,
                        hostName: guest.hostEmployee,
                        status: guest.status || 'pending',
                        checkInTime: guest.checkInTime
                      }))}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* System Status */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Integration Status
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" p={2} bgcolor="background.default" borderRadius={1}>
                    <Box
                      width={16}
                      height={16}
                      borderRadius="50%"
                      bgcolor={dashboard.systemStatus?.googleSheets ? 'success.main' : 'error.main'}
                      mr={1.5}
                    />
                    <Typography variant="body1" fontWeight="medium">Google Sheets</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" p={2} bgcolor="background.default" borderRadius={1}>
                    <Box
                      width={16}
                      height={16}
                      borderRadius="50%"
                      bgcolor={dashboard.systemStatus?.twilio ? 'success.main' : 'error.main'}
                      mr={1.5}
                    />
                    <Typography variant="body1" fontWeight="medium">Twilio SMS</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" p={2} bgcolor="background.default" borderRadius={1}>
                    <Box
                      width={16}
                      height={16}
                      borderRadius="50%"
                      bgcolor={dashboard.systemStatus?.slack ? 'success.main' : 'error.main'}
                      mr={1.5}
                    />
                    <Typography variant="body1" fontWeight="medium">Slack</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" p={2} bgcolor="background.default" borderRadius={1}>
                    <Box
                      width={16}
                      height={16}
                      borderRadius="50%"
                      bgcolor={dashboard.systemStatus?.jotform ? 'success.main' : 'error.main'}
                      mr={1.5}
                    />
                    <Typography variant="body1" fontWeight="medium">JotForm</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}