import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'emergency_type', label: 'Type' },
  { key: 'severity', label: 'Severity' },
  { key: 'contact_person', label: 'Contact' },
  { key: 'contact_phone', label: 'Phone' },
  { key: 'status', label: 'Status' },
];

const fields = [
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'emergency_type', label: 'Emergency Type', type: 'select', options: ['fire', 'flood', 'earthquake', 'power_outage', 'gas_leak', 'severe_weather', 'security'] },
  { key: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  { key: 'contact_person', label: 'Contact Person' },
  { key: 'contact_phone', label: 'Contact Phone' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'drill_scheduled', 'needs_update'], default: 'active' },
];

export default function Emergency() {
  return (
    <CrudPage
      title="Emergency Plans"
      subtitle="Emergency preparedness with AI response planning"
      endpoint="/emergency"
      columns={columns}
      fields={fields}
      aiAction="ai-plan"
      aiLabel="AI Response Plan"
      buildAiPayload={(item) => ({ emergency: item })}
    />
  );
}
