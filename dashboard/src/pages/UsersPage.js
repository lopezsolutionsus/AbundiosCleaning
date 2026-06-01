import { useState, useEffect } from 'react';
import { getUsers, deleteUser } from '../services/api';

export default function UsersPage() {
  const [users, setUsers]             = useState([]);
  const [search, setSearch]           = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    getUsers().then(r => setUsers(r.data.filter(u => u.role === 'staff' || u.role === 'admin')));
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.first_name.toLowerCase().includes(q) ||
      (u.last_name || '').toLowerCase().includes(q)
    );
  });

  async function confirmDelete() {
    await deleteUser(deleteTarget.id);
    setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <div className="clients-wrap">
      <div className="clients-header">
        <h2>Staff ({users.length})</h2>
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
            <th>Role</th>
            <th>Verified</th>
            <th>Registered</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={6} className="empty-msg">No users found.</td></tr>
          )}
          {filtered.map(u => (
            <tr key={u.id}>
              <td>{u.first_name} {u.last_name}</td>
              <td>{u.email}</td>
              <td>
                <span className={`status-pill status-${u.role}`}>{u.role}</span>
              </td>
              <td>
                {u.email_verified
                  ? <span style={{ color: '#27ae60', fontWeight: 600 }}>Yes</span>
                  : <span style={{ color: '#e67e22', fontWeight: 600 }}>No</span>}
              </td>
              <td style={{ fontSize: '0.82rem', color: '#888' }}>
                {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
              </td>
              <td>
                <button className="btn-icon btn-del" onClick={() => setDeleteTarget(u)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Staff Member</h3>
            <p>Are you sure you want to delete <strong>{deleteTarget.first_name} {deleteTarget.last_name}</strong> ({deleteTarget.email})?</p>
            <p style={{ fontSize: '0.85rem', color: '#c0392b' }}>This will permanently delete their account and all associated data.</p>
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
