import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'unit_number', label: 'Unit' },
  { key: 'move_in_date', label: 'Move-in Date' },
  { key: 'status', label: 'Status' },
];

const fields = [
  { key: 'name', label: 'Full Name', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'phone', label: 'Phone' },
  { key: 'unit_number', label: 'Unit Number', required: true },
  { key: 'move_in_date', label: 'Move-in Date', type: 'date' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'], default: 'active' },
];

export default function Residents() {
  return (
    <CrudPage
      title="Residents"
      subtitle="Manage community residents with AI-powered communication"
      endpoint="/residents"
      columns={columns}
      fields={fields}
      aiAction="ai-communicate"
      aiLabel="AI Communication"
      renderAiForm={(data, setData) => (
        <div>
          <div className="form-group">
            <label>Resident Name</label>
            <input type="text" value={data.resident?.name || ''} onChange={e => setData({ ...data, resident: { ...data.resident, name: e.target.value } })} placeholder="Resident name" />
          </div>
          <div className="form-group">
            <label>Unit Number</label>
            <input type="text" value={data.resident?.unit_number || ''} onChange={e => setData({ ...data, resident: { ...data.resident, unit_number: e.target.value } })} placeholder="Unit number" />
          </div>
          <div className="form-group">
            <label>Message Type</label>
            <select value={data.messageType || ''} onChange={e => setData({ ...data, messageType: e.target.value })}>
              <option value="">Select type...</option>
              <option value="welcome letter">Welcome Letter</option>
              <option value="reminder notice">Reminder Notice</option>
              <option value="thank you note">Thank You Note</option>
              <option value="maintenance update">Maintenance Update</option>
              <option value="community newsletter">Community Newsletter</option>
            </select>
          </div>
          <div className="form-group">
            <label>Context / Details</label>
            <textarea value={data.context || ''} onChange={e => setData({ ...data, context: e.target.value })} placeholder="Provide additional context..." />
          </div>
        </div>
      )}
    />
  );
}
