import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  pending: '#ff9800',
  approved: '#4caf50',
  'checked-in': '#2196f3',
  'with-host': '#9c27b0',
  'checked-out': '#757575',
  cancelled: '#f44336',
};

export default function GuestStatusChart({ data }) {
  if (!data) {
    return <div>No data available</div>;
  }

  const chartData = [
    { name: 'Pending', value: data.pending || 0, color: COLORS.pending },
    { name: 'Approved', value: data.approved || 0, color: COLORS.approved },
    { name: 'Checked In', value: data.checkedIn || 0, color: COLORS['checked-in'] },
    { name: 'With Host', value: data.withHost || 0, color: COLORS['with-host'] },
    { name: 'Checked Out', value: data.checkedOut || 0, color: COLORS['checked-out'] },
    { name: 'Cancelled', value: data.cancelled || 0, color: COLORS.cancelled },
  ].filter(item => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        color: '#757575' 
      }}>
        No guests today
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${name}: ${value}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}