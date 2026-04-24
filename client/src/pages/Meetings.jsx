import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'location', label: 'Location' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
];

const fields = [
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'date', label: 'Date', type: 'date', required: true },
  { key: 'time', label: 'Time', type: 'text' },
  { key: 'location', label: 'Location' },
  { key: 'type', label: 'Type', type: 'select', options: ['board', 'annual', 'special', 'committee'], default: 'board' },
  { key: 'status', label: 'Status', type: 'select', options: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
];

export default function Meetings() {
  return (
    <CrudPage
      title="Meetings"
      subtitle="Schedule meetings with AI agenda generation and minutes"
      endpoint="/meetings"
      columns={columns}
      fields={fields}
      aiAction="ai-agenda"
      aiLabel="AI Agenda Generator"
      buildAiPayload={(item) => ({ meeting: item })}
    />
  );
}
