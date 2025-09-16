import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { guestAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function CheckIn() {
  const [submissionResult, setSubmissionResult] = useState(null);
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      company: '',
      hostName: '',
      hostEmail: '',
      purposeOfVisit: '',
      expectedDuration: '',
      specialRequirements: '',
      visitDate: new Date().toISOString().split('T')[0],
    },
  });

  const createGuestMutation = useMutation(
    (guestData) => guestAPI.create(guestData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('guests');
        toast.success('Guest registered successfully!');
        setSubmissionResult(data.data);
        reset();
      },
      onError: (error) => {
        toast.error(`Failed to register guest: ${error.response?.data?.message || error.message}`);
      },
    }
  );

  const onSubmit = (data) => {
    // Format phone number
    const formattedData = {
      ...data,
      phoneNumber: data.phoneNumber.replace(/\D/g, ''), // Remove non-digits
      notificationPreferences: {
        sms: true,
        email: true,
        slack: true,
      },
    };
    
    createGuestMutation.mutate(formattedData);
  };

  const expectedDurationOptions = [
    { value: '30 minutes', label: '30 minutes' },
    { value: '1 hour', label: '1 hour' },
    { value: '2 hours', label: '2 hours' },
    { value: 'Half day', label: 'Half day' },
    { value: 'Full day', label: 'Full day' },
    { value: 'Multiple days', label: 'Multiple days' },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Guest Check-In
      </Typography>

      {submissionResult && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Guest registered successfully! ID: {submissionResult.guest?.id}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Guest Information
          </Typography>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="firstName"
                  control={control}
                  rules={{ required: 'First name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Name"
                      fullWidth
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="lastName"
                  control={control}
                  rules={{ required: 'Last name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Last Name"
                      fullWidth
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email"
                      type="email"
                      fullWidth
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="phoneNumber"
                  control={control}
                  rules={{ required: 'Phone number is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Phone Number"
                      fullWidth
                      error={!!errors.phoneNumber}
                      helperText={errors.phoneNumber?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="company"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Company"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="hostName"
                  control={control}
                  rules={{ required: 'Host name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Host Name"
                      fullWidth
                      error={!!errors.hostName}
                      helperText={errors.hostName?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="hostEmail"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Host Email"
                      type="email"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="visitDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Visit Date"
                      type="date"
                      fullWidth
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="purposeOfVisit"
                  control={control}
                  rules={{ required: 'Purpose of visit is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Purpose of Visit"
                      fullWidth
                      multiline
                      rows={3}
                      error={!!errors.purposeOfVisit}
                      helperText={errors.purposeOfVisit?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="expectedDuration"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Expected Duration"
                      fullWidth
                    >
                      {expectedDurationOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="specialRequirements"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Special Requirements"
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Any special accommodations needed?"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={createGuestMutation.isLoading}
                  sx={{ mr: 2 }}
                >
                  {createGuestMutation.isLoading ? 'Registering...' : 'Register Guest'}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  size="large"
                  onClick={() => reset()}
                >
                  Clear Form
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}