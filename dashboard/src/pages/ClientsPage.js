import { useState, useEffect } from 'react';
import { getUsers, deleteUser } from '../services/api';

export default function ClientsPage() {
  const [clients, setClients]           = useState([]);
  const [search, setSearch]             = useState('');
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
            <th>Verified</th>
            <th>Registered</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={6} className="empty-msg">No clients found.</td></tr>
          )}
          {filtered.map(c => (
            <tr key={c.id}>
              <td>{c.first_name} {c.last_name}</td>
              <td>{c.email}</td>
              <td>{c.phone || '—'}</td>
              <td>
                {c.email_verified
                  ? <span style={{ color: '#27ae60', fontWeight: 600 }}>Yes</span>
                  : <span style={{ color: '#e67e22', fontWeight: 600 }}>Pending</span>}
              </td>
              <td style={{ fontSize: '0.82rem', color: '#888' }}>
                {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
              </td>
              <td>
                <button className="btn-icon btn-del" onClick={() => setDeleteTarget(c)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
