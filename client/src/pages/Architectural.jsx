import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'unit_number', label: 'Unit' },
  { key: 'requested_by', label: 'Requested By' },
  { key: 'modification_type', label: 'Type' },
  { key: 'estimated_cost', label: 'Est. Cost' },
  { key: 'status', label: 'Status' },
];

const fields = [
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'unit_number', label: 'Unit Number', required: true },
  { key: 'requested_by', label: 'Requested By' },
  { key: 'modification_type', label: 'Modification Type', type: 'select', options: ['exterior', 'interior', 'landscaping', 'structural', 'fence', 'deck'] },
  { key: 'estimated_cost', label: 'Estimated Cost', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'denied', 'revision_needed'], default: 'pending' },
];

export default function Architectural() {
  return (
    <CrudPage
      title="Architectural Reviews"
      subtitle="Review modifications with AI compliance analysis"
      endpoint="/architectural"
      columns={columns}
      fields={fields}
      aiAction="ai-compliance"
      aiLabel="AI Compliance Check"
      buildAiPayload={(item) => ({ review: item })}
    />
  );
}
