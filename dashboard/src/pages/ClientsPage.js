import { useState, useEffect } from 'react';
import { getUsers, deleteUser } from '../services/api';

const PencilIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

export default function ClientsPage() {
  const [clients, setClients]           = useState([]);
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    getUsers().then(r => setClients(r.data.filter(u => u.role === 'client')));
  }, []);

  const filtered = clients.filter(u => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.first_name.toLowerCase().includes(q) ||
      (u.last_name || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q)
    );
  });

  async function confirmDelete() {
    await deleteUser(deleteTarget.id);
    setClients(prev => prev.filter(c => c.id !== deleteTarget.id));
    setDeleteTarget(null);
    setSelected(null);
  }

  return (
    <div className="clients-wrap">
      <div className="clients-header">
        <h2>Clients ({clients.length})</h2>
        <input
          className="search-input"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <table className="client-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={4} className="empty-msg">No clients found.</td></tr>
          )}
          {filtered.map(c => (
            <tr key={c.id}>
              <td>{c.first_name} {c.last_name}</td>
              <td>{c.email}</td>
              <td>{c.phone || '—'}</td>
              <td>
                <button className="btn-icon" onClick={() => setSelected(c)} title="View details">
                  <PencilIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Detail modal */}
      {selected && !deleteTarget && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{selected.first_name} {selected.last_name}</h3>
            <div style={detailGrid}>
              <DetailRow label="Email"      value={selected.email} />
              <DetailRow label="Phone"      value={selected.phone || '—'} />
              <DetailRow label="Verified"   value={selected.email_verified ? 'Yes' : 'Pending'} />
              <DetailRow label="Registered" value={selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '—'} />
            </div>
            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn-cancel" onClick={() => setSelected(null)}>Close</button>
              <button className="btn-danger" onClick={() => setDeleteTarget(selected)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Client</h3>
            <p>Are you sure you want to delete <strong>{deleteTarget.first_name} {deleteTarget.last_name}</strong> ({deleteTarget.email})?</p>
            <p style={{ fontSize: '0.85rem', color: '#c0392b' }}>This will permanently delete their account.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>Delete</button>
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
      <span style={{ width: 110, fontSize: '0.82rem', color: '#888', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.88rem', color: '#111', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const detailGrid = { marginTop: '0.75rem' };
