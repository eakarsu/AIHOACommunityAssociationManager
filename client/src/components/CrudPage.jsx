import React, { useState, useEffect } from 'react';
import { api } from '../api';

function AIResponse({ response, loading, label }) {
  if (!response && !loading) return null;
  return (
    <div className="ai-response">
      <div className="ai-response-header">
        <div className="ai-icon">🤖</div>
        <h3>{label || 'AI Analysis'}</h3>
      </div>
      {loading ? (
        <div className="ai-loading"><div className="spinner"></div>AI is thinking...</div>
      ) : (
        <div className="ai-response-body">{response}</div>
      )}
    </div>
  );
}

function RateLimitAlert({ onClose }) {
  return (
    <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#92400e', fontWeight: 500 }}>⚠️ AI rate limit reached. Please wait before making more AI requests.</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: '18px' }}>×</button>
    </div>
  );
}

function AiModal({ title, response, loading, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '700px', width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2>🤖 {title}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
        {loading ? (
          <div className="ai-loading"><div className="spinner"></div>AI is generating response...</div>
        ) : (
          <div className="ai-response-body" style={{ maxHeight: '60vh', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{response}</div>
        )}
      </div>
    </div>
  );
}

function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total, limit } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
      <span style={{ fontSize: '13px', color: '#64748b' }}>Showing {start}–{end} of {total} records</span>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          className="btn btn-secondary btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← Prev
        </button>
        <span style={{ fontSize: '13px', color: '#475569', padding: '4px 8px', lineHeight: '1.8' }}>
          Page {page} / {totalPages}
        </span>
        <button
          className="btn btn-secondary btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default function CrudPage({ title, subtitle, endpoint, columns, fields, aiAction, aiLabel, buildAiPayload, renderAiForm }) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalTitle, setAiModalTitle] = useState('');
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);

  // AI Center form state
  const [aiFormData, setAiFormData] = useState({});
  const [showAiForm, setShowAiForm] = useState(false);

  useEffect(() => { loadItems(currentPage); }, [currentPage]);

  const loadItems = async (page = 1) => {
    try {
      const data = await api.get(`${endpoint}?page=${page}&limit=20`);
      // Support both paginated { data, pagination } and plain array responses
      if (data && data.data && data.pagination) {
        setItems(data.data);
        setPagination(data.pagination);
      } else {
        setItems(Array.isArray(data) ? data : []);
        setPagination(null);
      }
    } catch (err) { setError(err.message); }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleRowClick = (item) => {
    setSelected(item);
    setAiResponse('');
  };

  const handleNew = () => {
    const initial = {};
    fields.forEach(f => initial[f.key] = f.default || '');
    setFormData(initial);
    setEditItem(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    const data = {};
    fields.forEach(f => {
      let val = item[f.key] || '';
      if (f.type === 'date' && val) val = val.substring(0, 10);
      data[f.key] = val;
    });
    setFormData(data);
    setEditItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.del(`${endpoint}/${item.id}`);
      setSelected(null);
      loadItems(currentPage);
    } catch (err) { setError(err.message); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`${endpoint}/${editItem.id}`, formData);
      } else {
        await api.post(endpoint, formData);
      }
      setShowForm(false);
      setSelected(null);
      loadItems(currentPage);
    } catch (err) { setError(err.message); }
  };

  const handleAI = async (item) => {
    if (rateLimited) return;
    setAiLoading(true);
    setAiResponse('');
    setAiModalTitle(aiLabel || 'AI Analyze');
    setAiModalOpen(true);
    try {
      const payload = buildAiPayload ? buildAiPayload(item) : { [endpoint.split('/').pop().replace(/s$/, '')]: item };
      const data = await api.post(`${endpoint}/${aiAction}`, payload);
      const resKey = Object.keys(data)[0];
      setAiResponse(data[resKey]);
    } catch (err) {
      if (err.message === '__RATE_LIMIT__') {
        setRateLimited(true);
        setAiModalOpen(false);
      } else {
        setAiResponse('Error: ' + err.message);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiFormSubmit = async () => {
    if (rateLimited) return;
    setAiLoading(true);
    setAiResponse('');
    setAiModalTitle(aiLabel || 'AI Analysis');
    setAiModalOpen(true);
    try {
      const payload = { ...aiFormData, transactions: items, bookings: items, spots: items };
      const data = await api.post(`${endpoint}/${aiAction}`, payload);
      const resKey = Object.keys(data)[0];
      setAiResponse(data[resKey]);
    } catch (err) {
      if (err.message === '__RATE_LIMIT__') {
        setRateLimited(true);
        setAiModalOpen(false);
      } else {
        setAiResponse('Error: ' + err.message);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const getBadgeClass = (val) => {
    if (!val) return 'badge-gray';
    const v = String(val).toLowerCase();
    if (['active', 'completed', 'approved', 'confirmed', 'sent', 'resolved'].includes(v)) return 'badge-green';
    if (['open', 'scheduled', 'pending', 'draft', 'needs_update'].includes(v)) return 'badge-blue';
    if (['in_progress', 'warning_sent', 'revision_needed', 'drill_scheduled'].includes(v)) return 'badge-yellow';
    if (['urgent', 'critical', 'high', 'escalated', 'cancelled', 'suspended', 'expired'].includes(v)) return 'badge-red';
    if (['medium', 'normal'].includes(v)) return 'badge-purple';
    return 'badge-gray';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {renderAiForm && (
            <button className="btn btn-ai" onClick={() => { setShowAiForm(true); setSelected(null); setAiResponse(''); }}>
              🤖 {aiLabel}
            </button>
          )}
          <button className="btn btn-primary" onClick={handleNew}>+ New {title.replace(/s$/, '').replace(/ies$/, 'y')}</button>
        </div>
      </div>

      {error && <p className="error-text mb-4">{error}</p>}
      {rateLimited && <RateLimitAlert onClose={() => setRateLimited(false)} />}

      {/* Detail View */}
      {selected && (
        <div className="detail-panel">
          <div className="flex-between">
            <h2>Details</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
          </div>
          <div className="detail-grid">
            {columns.map((col) => (
              <div key={col.key} className="detail-field">
                <label>{col.label}</label>
                <span>{col.key.includes('status') || col.key.includes('priority') || col.key.includes('severity')
                  ? <span className={`badge ${getBadgeClass(selected[col.key])}`}>{selected[col.key]}</span>
                  : (selected[col.key] || '-')}</span>
              </div>
            ))}
          </div>
          <div className="detail-actions">
            <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected)}>Delete</button>
            {aiAction && !renderAiForm && (
              <button className="btn btn-ai btn-sm" onClick={() => handleAI(selected)} disabled={aiLoading || rateLimited}>
                🤖 {aiLabel || 'AI Analyze'}
              </button>
            )}
          </div>
          {!aiModalOpen && <AIResponse response={aiResponse} loading={aiLoading} label={aiLabel} />}
        </div>
      )}

      {/* AI Form View */}
      {showAiForm && renderAiForm && (
        <div className="detail-panel">
          <div className="flex-between">
            <h2>🤖 {aiLabel}</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAiForm(false)}>Close</button>
          </div>
          {renderAiForm(aiFormData, setAiFormData)}
          <div className="detail-actions">
            <button className="btn btn-ai" onClick={handleAiFormSubmit} disabled={aiLoading || rateLimited}>
              {aiLoading ? 'Generating...' : `🤖 Generate`}
            </button>
          </div>
          {!aiModalOpen && <AIResponse response={aiResponse} loading={aiLoading} label={aiLabel} />}
        </div>
      )}

      {/* Data Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              {aiAction && !renderAiForm && <th>AI</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} onClick={() => handleRowClick(item)}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.key.includes('status') || col.key.includes('priority') || col.key.includes('severity') || col.key.includes('permit_type') || col.key.includes('contract_status')
                      ? <span className={`badge ${getBadgeClass(item[col.key])}`}>{item[col.key]}</span>
                      : col.key.includes('amount') || col.key.includes('cost') || col.key.includes('rate')
                        ? `$${Number(item[col.key] || 0).toLocaleString()}`
                        : col.key.includes('date') && item[col.key]
                          ? item[col.key].substring(0, 10)
                          : (item[col.key] || '-')}
                  </td>
                ))}
                {aiAction && !renderAiForm && (
                  <td onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-ai btn-sm"
                      onClick={() => handleAI(item)}
                      disabled={aiLoading || rateLimited}
                      title={aiLabel || 'AI Analyze'}
                    >
                      🤖
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={columns.length + (aiAction && !renderAiForm ? 1 : 0)} className="text-center" style={{ padding: '40px', color: '#94a3b8' }}>No items found</td></tr>
            )}
          </tbody>
        </table>
        <Pagination pagination={pagination} onPageChange={handlePageChange} />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editItem ? 'Edit' : 'New'} {title.replace(/s$/, '').replace(/ies$/, 'y')}</h2>
            <form onSubmit={handleSave}>
              {fields.map((field) => (
                <div className="form-group" key={field.key}>
                  <label>{field.label}</label>
                  {field.type === 'select' ? (
                    <select value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}>
                      <option value="">Select...</option>
                      {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} />
                  ) : (
                    <input type={field.type || 'text'} value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} required={field.required} />
                  )}
                </div>
              ))}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Result Modal */}
      {aiModalOpen && (
        <AiModal
          title={aiModalTitle}
          response={aiResponse}
          loading={aiLoading}
          onClose={() => { setAiModalOpen(false); setAiResponse(''); }}
        />
      )}
    </div>
  );
}
