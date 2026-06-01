import { useState, useEffect } from 'react';
import { getUsers, deleteUser, adminUpdateUser } from '../services/api';

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const PencilIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const EMPTY_FORM = { first_name: '', last_name: '', email: '', phone: '' };

export default function ClientsPage() {
  const [clients, setClients]           = useState([]);
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState(null);
  const [editing, setEditing]           = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [saveMsg, setSaveMsg]           = useState(null);
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

  function openDetail(c) {
    setSelected(c);
    setEditing(false);
    setSaveMsg(null);
    setForm({ first_name: c.first_name, last_name: c.last_name || '', email: c.email, phone: c.phone || '' });
  }

  function closeModal() {
    setSelected(null);
    setEditing(false);
    setSaveMsg(null);
    setDeleteTarget(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setSaveMsg(null);
    try {
      const res = await adminUpdateUser(selected.id, form);
      const updated = res.data;
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
      setSelected(updated);
      setEditing(false);
      setSaveMsg({ ok: true, text: 'Changes saved.' });
    } catch (err) {
      setSaveMsg({ ok: false, text: err.response?.data?.detail || 'Failed to save.' });
    }
    setSaving(false);
  }

  async function confirmDelete() {
    await deleteUser(deleteTarget.id);
    setClients(prev => prev.filter(c => c.id !== deleteTarget.id));
    closeModal();
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
                <button className="btn-icon" onClick={() => openDetail(c)} title="View details">
                  <InfoIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Detail / edit modal */}
      {selected && !deleteTarget && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ minWidth: 340 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0 }}>{selected.first_name} {selected.last_name}</h3>
              {!editing
                ? <button style={btnOutline} onClick={() => { setEditing(true); setSaveMsg(null); }}><PencilIcon /> Edit</button>
                : <button style={btnCancel} onClick={() => { setEditing(false); setSaveMsg(null); setForm({ first_name: selected.first_name, last_name: selected.last_name || '', email: selected.email, phone: selected.phone || '' }); }}>Cancel</button>}
            </div>

            {saveMsg && <p style={{ fontSize: '0.85rem', color: saveMsg.ok ? '#27ae60' : '#c0392b', margin: '0 0 0.75rem' }}>{saveMsg.text}</p>}

            {editing ? (
              <form onSubmit={handleSave}>
                <Field label="First name"><input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required /></Field>
                <Field label="Last name"><input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></Field>
                <Field label="Email"><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></Field>
                <Field label="Phone"><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
                <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
                  <button type="button" className="btn-danger" onClick={() => setDeleteTarget(selected)}>Delete</button>
                  <button type="submit" style={btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
                </div>
              </form>
            ) : (
              <>
                <DetailRow label="Email"      value={selected.email} />
                <DetailRow label="Phone"      value={selected.phone || '—'} />
                <DetailRow label="Verified"   value={selected.email_verified ? 'Yes' : 'Pending'} />
                <DetailRow label="Registered" value={selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '—'} />
                <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                  <button className="btn-cancel" onClick={closeModal}>Close</button>
                  <button className="btn-danger" onClick={() => setDeleteTarget(selected)}>Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
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

function Field({ label, children }) {
  return <div className="form-field"><label>{label}</label>{children}</div>;
}

const btnOutline  = { display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.35rem 0.8rem', fontSize: '0.82rem', color: '#555', cursor: 'pointer' };
const btnCancel   = { background: 'none', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.35rem 0.8rem', fontSize: '0.82rem', color: '#555', cursor: 'pointer' };
const btnPrimary  = { background: '#4aba6e', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' };
