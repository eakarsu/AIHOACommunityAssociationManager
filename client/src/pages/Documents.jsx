import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'category', label: 'Category' },
  { key: 'author', label: 'Author' },
  { key: 'status', label: 'Status' },
];

const fields = [
  { key: 'title', label: 'Title', required: true },
  { key: 'content', label: 'Content', type: 'textarea', required: true },
  { key: 'category', label: 'Category', type: 'select', options: ['bylaws', 'minutes', 'policy', 'financial', 'legal', 'notice'] },
  { key: 'author', label: 'Author' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'archived', 'draft'], default: 'active' },
];

export default function Documents() {
  return (
    <CrudPage
      title="Documents"
      subtitle="Manage documents with AI summarization and key point extraction"
      endpoint="/documents"
      columns={columns}
      fields={fields}
      aiAction="ai-summarize"
      aiLabel="AI Document Summary"
      buildAiPayload={(item) => ({ document: item })}
    />
  );
}
