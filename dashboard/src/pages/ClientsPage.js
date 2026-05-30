import { useState, useEffect } from 'react';
import { getClients, createClient, updateClient, deleteClient } from '../services/api';

const emptyForm = { first_name:'', last_name:'', phone:'', address:'', notes:'', status:'client' };

export default function ClientsPage() {
  const [clients, setClients]     = useState([]);
  const [search, setSearch]       = useState('');
  const [form, setForm]           = useState(emptyForm);
  const [editId, setEditId]       = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    getClients().then(r => setClients(r.data));
  }, []);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(q) ||
      (c.last_name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.address || '').toLowerCase().includes(q)
    );
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (editId) {
      const res = await updateClient(editId, form);
      setClients(prev => prev.map(c => c.id === editId ? res.data : c));
    } else {
      const res = await createClient(form);
      setClients(prev => [...prev, res.data].sort((a,b) => (a.last_name||'').localeCompare(b.last_name||'')));
    }
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  }

  function startEdit(client) {
    setForm({
      first_name: client.first_name,
      last_name:  client.last_name  || '',
      phone:      client.phone      || '',
      address:    client.address    || '',
      notes:      client.notes      || '',
      status:     client.status     || 'client',
    });
    setEditId(client.id);
    setShowForm(true);
  }

  async function confirmDelete() {
    await deleteClient(deleteTarget.id);
    setClients(prev => prev.filter(c => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <div className="clients-wrap">
      <div className="clients-header">
        <h2>Clients ({clients.length})</h2>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <input
            className="search-input"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn-save" style={{ padding:'0.5rem 1.2rem', fontSize:'0.9rem' }} onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}>
            + New Client
          </button>
        </div>
      </div>

      <table className="client-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={5} className="empty-msg">No clients found.</td></tr>
          )}
          {filtered.map(c => (
            <tr key={c.id}>
              <td>{c.first_name} {c.last_name}</td>
              <td>{c.phone || '—'}</td>
              <td>{c.address || '—'}</td>
              <td>
                <span className={`status-pill status-${c.status}`}>
                  {c.status === 'quote' ? 'Quote' : 'Client'}
                </span>
              </td>
              <td>
                <button className="btn-icon" onClick={() => startEdit(c)}>Edit</button>
                <button className="btn-icon btn-del" onClick={() => setDeleteTarget(c)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Client form modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId ? 'Edit Client' : 'New Client'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>First Name *</label>
                <input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required />
              </div>
              <div className="form-field">
                <label>Last Name</label>
                <input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} />
              </div>
              <div className="form-field">
                <label>Phone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div className="form-field">
                <label>Address</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <div className="form-field">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="client">Client</option>
                  <option value="quote">Quote</option>
                </select>
              </div>
              <div className="form-field">
                <label>Notes</label>
                <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-save" style={{ padding:'0.5rem 1.5rem' }}>
                  {editId ? 'Save Changes' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Client</h3>
            <p>Are you sure you want to delete <strong>{deleteTarget.first_name} {deleteTarget.last_name}</strong>?</p>
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
