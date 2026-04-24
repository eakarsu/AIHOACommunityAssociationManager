import React, { useState, useEffect } from 'react';
import CrudPage from '../components/CrudPage';
import { api } from '../api';

const columns = [
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount' },
  { key: 'type', label: 'Type' },
  { key: 'category', label: 'Category' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status' },
];

const fields = [
  { key: 'description', label: 'Description', required: true },
  { key: 'amount', label: 'Amount', type: 'number', required: true },
  { key: 'type', label: 'Type', type: 'select', options: ['income', 'expense'], default: 'expense' },
  { key: 'category', label: 'Category', type: 'select', options: ['dues', 'maintenance', 'utilities', 'insurance', 'legal', 'landscaping', 'reserves', 'events', 'administrative', 'special_assessment'] },
  { key: 'date', label: 'Date', type: 'date', required: true },
  { key: 'status', label: 'Status', type: 'select', options: ['completed', 'pending'], default: 'completed' },
];

export default function Finances() {
  return (
    <CrudPage
      title="Financial Transactions"
      subtitle="Track finances with AI budget forecasting and analysis"
      endpoint="/finances"
      columns={columns}
      fields={fields}
      aiAction="ai-forecast"
      aiLabel="AI Budget Forecast"
      renderAiForm={(data, setData) => (
        <div>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>Click generate to analyze all transactions and get AI budget forecasting insights.</p>
        </div>
      )}
      buildAiPayload={null}
    />
  );
}
