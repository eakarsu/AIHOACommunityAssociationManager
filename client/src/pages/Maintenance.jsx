import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'unit_number', label: 'Unit' },
  { key: 'category', label: 'Category' },
  { key: 'priority', label: 'Priority' },
  { key: 'reported_by', label: 'Reported By' },
  { key: 'status', label: 'Status' },
];

const fields = [
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'unit_number', label: 'Unit Number', required: true },
  { key: 'category', label: 'Category', type: 'select', options: ['plumbing', 'electrical', 'hvac', 'landscaping', 'general', 'structural'] },
  { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  { key: 'reported_by', label: 'Reported By' },
  { key: 'status', label: 'Status', type: 'select', options: ['open', 'in_progress', 'completed', 'closed'], default: 'open' },
];

export default function Maintenance() {
  return (
    <CrudPage
      title="Maintenance Requests"
      subtitle="Track maintenance with AI priority assessment and cost estimation"
      endpoint="/maintenance"
      columns={columns}
      fields={fields}
      aiAction="ai-assess"
      aiLabel="AI Assessment"
      buildAiPayload={(item) => ({ request: item })}
    />
  );
}
