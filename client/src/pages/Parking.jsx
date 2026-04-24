import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'spot_number', label: 'Spot' },
  { key: 'unit_number', label: 'Unit' },
  { key: 'vehicle_make', label: 'Make' },
  { key: 'vehicle_model', label: 'Model' },
  { key: 'vehicle_color', label: 'Color' },
  { key: 'license_plate', label: 'Plate' },
  { key: 'permit_type', label: 'Permit' },
  { key: 'status', label: 'Status' },
];

const fields = [
  { key: 'spot_number', label: 'Spot Number', required: true },
  { key: 'unit_number', label: 'Unit Number', required: true },
  { key: 'vehicle_make', label: 'Vehicle Make' },
  { key: 'vehicle_model', label: 'Vehicle Model' },
  { key: 'vehicle_color', label: 'Vehicle Color' },
  { key: 'license_plate', label: 'License Plate' },
  { key: 'permit_type', label: 'Permit Type', type: 'select', options: ['resident', 'visitor', 'reserved', 'handicap'], default: 'resident' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'expired', 'suspended'], default: 'active' },
];

export default function Parking() {
  return (
    <CrudPage
      title="Parking Management"
      subtitle="Manage parking with AI optimization and allocation analysis"
      endpoint="/parking"
      columns={columns}
      fields={fields}
      aiAction="ai-optimize"
      aiLabel="AI Parking Optimization"
      renderAiForm={(data, setData) => (
        <div>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>Click generate to analyze parking allocation and get AI optimization suggestions.</p>
        </div>
      )}
    />
  );
}
