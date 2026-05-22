import React, { useEffect, useState } from 'react';

export default function CovenantVariancePrecedent() {
  const [data, setData] = useState(null);
  const token = localStorage.getItem('token');
  useEffect(() => {
    fetch('/api/covenant-variance-precedent', { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then((r) => r.json()).then(setData).catch(() => {});
  }, [token]);
  return (
    <div className="page">
      <h1>Covenant Variance Precedent Finder</h1>
      <p>Compares architectural variance requests with prior board decisions.</p>
      {data && <section className="card"><h2>{data.recommendation}</h2><p>{data.fairness_note}</p><ul>{data.matches.map((m) => <li key={m.id}>{m.id}: {m.outcome} ({Math.round(m.similarity * 100)}%)</li>)}</ul></section>}
    </div>
  );
}
