import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'amenity_name', label: 'Amenity' },
  { key: 'booked_by', label: 'Booked By' },
  { key: 'booking_date', label: 'Date' },
  { key: 'start_time', label: 'Start' },
  { key: 'end_time', label: 'End' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'status', label: 'Status' },
];

const fields = [
  { key: 'amenity_name', label: 'Amenity', type: 'select', options: ['Pool', 'Clubhouse', 'Tennis Court', 'Fitness Center', 'BBQ Area', 'Meeting Room', 'Basketball Court', 'Playground'], required: true },
  { key: 'booked_by', label: 'Booked By', required: true },
  { key: 'booking_date', label: 'Date', type: 'date', required: true },
  { key: 'start_time', label: 'Start Time' },
  { key: 'end_time', label: 'End Time' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'status', label: 'Status', type: 'select', options: ['confirmed', 'pending', 'cancelled'], default: 'confirmed' },
];

export default function Amenities() {
  return (
    <CrudPage
      title="Amenity Bookings"
      subtitle="Book amenities with AI usage optimization and scheduling"
      endpoint="/amenities"
      columns={columns}
      fields={fields}
      aiAction="ai-optimize"
      aiLabel="AI Optimize Usage"
      renderAiForm={(data, setData) => (
        <div>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>Click generate to analyze booking patterns and get AI optimization suggestions.</p>
        </div>
      )}
    />
  );
}
