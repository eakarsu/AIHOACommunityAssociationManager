import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'service_type', label: 'Service' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'rating', label: 'Rating' },
  { key: 'hourly_rate', label: 'Rate' },
  { key: 'contract_status', label: 'Status' },
];

const fields = [
  { key: 'name', label: 'Vendor Name', required: true },
  { key: 'service_type', label: 'Service Type', type: 'select', options: ['plumbing', 'electrical', 'landscaping', 'cleaning', 'security', 'painting', 'roofing'] },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'rating', label: 'Rating (0-5)', type: 'number' },
  { key: 'hourly_rate', label: 'Hourly Rate', type: 'number' },
  { key: 'contract_status', label: 'Contract Status', type: 'select', options: ['active', 'expired', 'pending'], default: 'active' },
];

export default function Vendors() {
  return (
    <CrudPage
      title="Vendors"
      subtitle="Manage vendors with AI evaluation and performance analysis"
      endpoint="/vendors"
      columns={columns}
      fields={fields}
      aiAction="ai-evaluate"
      aiLabel="AI Vendor Evaluation"
      buildAiPayload={(item) => ({ vendor: item })}
    />
  );
}
