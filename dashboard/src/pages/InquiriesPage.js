import { useState, useEffect } from 'react';
import { getInquiries } from '../services/api';

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    getInquiries()
      .then(r => setInquiries(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="clients-wrap">
      <div className="clients-header">
        <h2>Quote Requests ({inquiries.length})</h2>
      </div>

      {loading ? (
        <p style={{ color: '#888', padding: '2rem 0' }}>Loading...</p>
      ) : (
        <table className="client-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Service</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {inquiries.length === 0 && (
              <tr><td colSpan={6} className="empty-msg">No quote requests yet.</td></tr>
            )}
            {inquiries.map(i => (
              <tr key={i.id}>
                <td>{i.name}</td>
                <td>{i.email}</td>
                <td>{i.phone || '—'}</td>
                <td>{i.service_type || '—'}</td>
                <td>{i.created_at ? new Date(i.created_at).toLocaleDateString() : '—'}</td>
                <td>
                  <button className="btn-icon" onClick={() => setSelected(i)} title="View details">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ minWidth: 360, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0 }}>{selected.name}</h3>
              <button style={btnClose} onClick={() => setSelected(null)}>✕</button>
            </div>
            <DetailRow label="Email"   value={selected.email} />
            <DetailRow label="Phone"   value={selected.phone || '—'} />
            <DetailRow label="Service" value={selected.service_type || '—'} />
            <DetailRow label="Date"    value={selected.created_at ? new Date(selected.created_at).toLocaleString() : '—'} />
            {selected.message && (
              <div style={{ marginTop: '1rem' }}>
                <span style={{ fontSize: '0.82rem', color: '#888' }}>Message</span>
                <p style={{ marginTop: '0.35rem', fontSize: '0.9rem', color: '#111', lineHeight: 1.6 }}>{selected.message}</p>
              </div>
            )}
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <a href={`mailto:${selected.email}`} style={btnReply}>Reply by email</a>
              <button className="btn-cancel" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', padding: '0.55rem 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ width: 80, fontSize: '0.82rem', color: '#888', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.88rem', color: '#111', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const btnClose = { background: 'none', border: 'none', fontSize: '1rem', color: '#888', cursor: 'pointer', padding: '0.2rem 0.5rem' };
const btnReply = { display: 'inline-block', background: '#4aba6e', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' };
