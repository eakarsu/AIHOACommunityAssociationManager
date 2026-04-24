import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'unit_number', label: 'Unit' },
  { key: 'violation_type', label: 'Type' },
  { key: 'severity', label: 'Severity' },
  { key: 'reported_by', label: 'Reported By' },
  { key: 'status', label: 'Status' },
];

const fields = [
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description', type: 'textarea', required: true },
  { key: 'unit_number', label: 'Unit Number', required: true },
  { key: 'violation_type', label: 'Type', type: 'select', options: ['noise', 'parking', 'maintenance', 'pet', 'architectural', 'trash'] },
  { key: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high'], default: 'medium' },
  { key: 'reported_by', label: 'Reported By' },
  { key: 'status', label: 'Status', type: 'select', options: ['open', 'warning_sent', 'resolved', 'escalated'], default: 'open' },
];

export default function Violations() {
  return (
    <CrudPage
      title="Violations"
      subtitle="Track violations with AI letter generation and severity assessment"
      endpoint="/violations"
      columns={columns}
      fields={fields}
      aiAction="ai-letter"
      aiLabel="AI Violation Letter"
      buildAiPayload={(item) => ({ violation: item })}
    />
  );
}
