import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'address', label: 'Address' },
  { key: 'unit_number', label: 'Unit' },
  { key: 'type', label: 'Type' },
  { key: 'bedrooms', label: 'Beds' },
  { key: 'bathrooms', label: 'Baths' },
  { key: 'sqft', label: 'Sqft' },
  { key: 'owner_name', label: 'Owner' },
  { key: 'status', label: 'Status' },
];

const fields = [
  { key: 'address', label: 'Address', required: true },
  { key: 'unit_number', label: 'Unit Number', required: true },
  { key: 'type', label: 'Type', type: 'select', options: ['condo', 'townhouse', 'single-family'], default: 'condo' },
  { key: 'bedrooms', label: 'Bedrooms', type: 'number' },
  { key: 'bathrooms', label: 'Bathrooms', type: 'number' },
  { key: 'sqft', label: 'Square Feet', type: 'number' },
  { key: 'owner_name', label: 'Owner Name' },
  { key: 'status', label: 'Status', type: 'select', options: ['occupied', 'vacant', 'maintenance'], default: 'occupied' },
];

export default function Properties() {
  return (
    <CrudPage
      title="Properties"
      subtitle="Manage properties with AI-powered analysis and valuation"
      endpoint="/properties"
      columns={columns}
      fields={fields}
      aiAction="ai-analyze"
      aiLabel="AI Property Analysis"
      buildAiPayload={(item) => ({ property: item })}
    />
  );
}
