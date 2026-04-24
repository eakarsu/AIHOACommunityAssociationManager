import React from 'react';
import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'audience', label: 'Audience' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
];

const fields = [
  { key: 'title', label: 'Title', required: true },
  { key: 'content', label: 'Content', type: 'textarea', required: true },
  { key: 'type', label: 'Type', type: 'select', options: ['announcement', 'newsletter', 'notice', 'alert'], default: 'announcement' },
  { key: 'audience', label: 'Audience', type: 'select', options: ['all', 'board', 'residents', 'staff'], default: 'all' },
  { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  { key: 'status', label: 'Status', type: 'select', options: ['draft', 'sent', 'scheduled'], default: 'draft' },
];

export default function Communications() {
  return (
    <CrudPage
      title="Communications"
      subtitle="Manage communications with AI newsletter and announcement generation"
      endpoint="/communications"
      columns={columns}
      fields={fields}
      aiAction="ai-generate"
      aiLabel="AI Generate Content"
      renderAiForm={(data, setData) => (
        <div>
          <div className="form-group">
            <label>Content Type</label>
            <select value={data.type || ''} onChange={e => setData({ ...data, type: e.target.value })}>
              <option value="">Select type...</option>
              <option value="announcement">Announcement</option>
              <option value="newsletter">Newsletter</option>
              <option value="notice">Notice</option>
              <option value="alert">Alert</option>
            </select>
          </div>
          <div className="form-group">
            <label>Topic</label>
            <textarea value={data.topic || ''} onChange={e => setData({ ...data, topic: e.target.value })} placeholder="What should the communication be about?" />
          </div>
          <div className="form-group">
            <label>Target Audience</label>
            <select value={data.audience || ''} onChange={e => setData({ ...data, audience: e.target.value })}>
              <option value="">Select audience...</option>
              <option value="all residents">All Residents</option>
              <option value="board members">Board Members</option>
              <option value="homeowners">Homeowners</option>
              <option value="tenants">Tenants</option>
            </select>
          </div>
          <div className="form-group">
            <label>Tone</label>
            <select value={data.tone || ''} onChange={e => setData({ ...data, tone: e.target.value })}>
              <option value="professional and friendly">Professional & Friendly</option>
              <option value="formal">Formal</option>
              <option value="casual and warm">Casual & Warm</option>
              <option value="urgent and direct">Urgent & Direct</option>
            </select>
          </div>
        </div>
      )}
    />
  );
}
