// Apply pass 5 — additive page wrapping the new non-AI features:
//   /api/violation-appeals (CRUD + decision)
//   /api/ballots (create / vote / tally)
import React, { useEffect, useState } from 'react';
import { api } from '../api';

function Appeals() {
  const [appeals, setAppeals] = useState([]);
  const [form, setForm] = useState({ violation_id: '', resident_id: '', reason: '', supporting_evidence: '' });
  const [error, setError] = useState('');

  const load = async () => {
    try { const r = await api.get('/violation-appeals'); setAppeals(r.data || []); }
    catch (e) { setError(e.response?.data?.error || e.message); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault(); setError('');
    try {
      await api.post('/violation-appeals', {
        ...form,
        violation_id: form.violation_id ? Number(form.violation_id) : undefined,
        resident_id: form.resident_id ? Number(form.resident_id) : undefined,
      });
      setForm({ violation_id: '', resident_id: '', reason: '', supporting_evidence: '' });
      await load();
    } catch (e) { setError(e.response?.data?.error || e.message); }
  };

  const decide = async (id, decision) => {
    try {
      const board_decision = window.prompt(`Board notes for ${decision}:`, '');
      await api.post(`/violation-appeals/${id}/decision`, { decision, board_decision });
      await load();
    } catch (e) { setError(e.response?.data?.error || e.message); }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Violation Appeals</h2>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr', maxWidth: 600 }}>
        <input placeholder="Violation ID (optional)" value={form.violation_id} onChange={e => setForm({ ...form, violation_id: e.target.value })} />
        <input placeholder="Resident ID (optional)" value={form.resident_id} onChange={e => setForm({ ...form, resident_id: e.target.value })} />
        <textarea placeholder="Reason for appeal *" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} style={{ gridColumn: '1 / span 2' }} />
        <textarea placeholder="Supporting evidence (links, descriptions)" value={form.supporting_evidence} onChange={e => setForm({ ...form, supporting_evidence: e.target.value })} style={{ gridColumn: '1 / span 2' }} />
        <button type="submit" style={{ gridColumn: '1 / span 2' }}>Submit Appeal</button>
      </form>
      <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
        <thead><tr><th>ID</th><th>Violation</th><th>Resident</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {appeals.map(a => (
            <tr key={a.id} style={{ borderTop: '1px solid #eee' }}>
              <td>{a.id}</td><td>{a.violation_id ?? '—'}</td><td>{a.resident_id ?? '—'}</td>
              <td style={{ maxWidth: 320 }}>{a.reason}</td><td>{a.status}</td>
              <td>
                {a.status === 'submitted' && (
                  <>
                    <button onClick={() => decide(a.id, 'approved')}>Approve</button>{' '}
                    <button onClick={() => decide(a.id, 'denied')}>Deny</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Ballots() {
  const [ballots, setBallots] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', options: 'Yes,No' });
  const [tallies, setTallies] = useState({});
  const [error, setError] = useState('');

  const load = async () => {
    try { const r = await api.get('/ballots'); setBallots(r.data || []); }
    catch (e) { setError(e.response?.data?.error || e.message); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault(); setError('');
    try {
      const options = form.options.split(',').map(s => s.trim()).filter(Boolean);
      await api.post('/ballots', { title: form.title, description: form.description, options });
      setForm({ title: '', description: '', options: 'Yes,No' });
      await load();
    } catch (e) { setError(e.response?.data?.error || e.message); }
  };

  const transition = async (id, status) => {
    try { await api.post(`/ballots/${id}/transition`, { status }); await load(); }
    catch (e) { setError(e.response?.data?.error || e.message); }
  };

  const vote = async (id) => {
    const choice = window.prompt('Cast vote (enter exact option string):');
    if (!choice) return;
    try { await api.post(`/ballots/${id}/vote`, { choice }); }
    catch (e) { setError(e.response?.data?.error || e.message); }
  };

  const tally = async (id) => {
    try { const r = await api.get(`/ballots/${id}/tally`); setTallies(t => ({ ...t, [id]: r.data })); }
    catch (e) { setError(e.response?.data?.error || e.message); }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Ballots</h2>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 600 }}>
        <input placeholder="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <input placeholder="Options (comma-separated, min 2)" value={form.options} onChange={e => setForm({ ...form, options: e.target.value })} />
        <button type="submit">Create Ballot</button>
      </form>
      <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
        <thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Options</th><th>Actions</th></tr></thead>
        <tbody>
          {ballots.map(b => (
            <tr key={b.id} style={{ borderTop: '1px solid #eee' }}>
              <td>{b.id}</td><td>{b.title}</td><td>{b.status}</td>
              <td>{(b.options || []).join(', ')}</td>
              <td>
                {b.status === 'draft' && <button onClick={() => transition(b.id, 'open')}>Open</button>}{' '}
                {b.status === 'open' && <>
                  <button onClick={() => vote(b.id)}>Vote</button>{' '}
                  <button onClick={() => transition(b.id, 'closed')}>Close</button>{' '}
                </>}
                <button onClick={() => tally(b.id)}>Tally</button>
                {tallies[b.id] && (
                  <pre style={{ fontSize: 11 }}>{JSON.stringify(tallies[b.id], null, 2)}</pre>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AppealsAndBallots() {
  const [tab, setTab] = useState('appeals');
  return (
    <div style={{ padding: 8 }}>
      <h1>Community Governance (Pass 5)</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={() => setTab('appeals')} disabled={tab === 'appeals'}>Appeals</button>
        <button onClick={() => setTab('ballots')} disabled={tab === 'ballots'}>Ballots</button>
      </div>
      {tab === 'appeals' ? <Appeals /> : <Ballots />}
    </div>
  );
}
