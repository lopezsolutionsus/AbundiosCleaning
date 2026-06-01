import { useState, useEffect } from 'react';
import { getUsers, deleteUser, adminUpdateUser, getClientsWithUpcoming } from '../services/api';

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

const EMPTY_FORM = { first_name: '', last_name: '', email: '', phone: '', zip_code: '', city: '', county: '' };

export default function ClientsPage() {
  const [clients, setClients]               = useState([]);
  const [upcomingIds, setUpcomingIds]       = useState(new Set());
  const [filterCity, setFilterCity]         = useState('');
  const [filterCounty, setFilterCounty]     = useState('');
  const [filterUpcoming, setFilterUpcoming] = useState(true);
  const [filtersOpen, setFiltersOpen]       = useState(false);
  const [selected, setSelected]             = useState(null);
  const [editing, setEditing]           = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [saveMsg, setSaveMsg]           = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [zipLoading, setZipLoading]     = useState(false);

  useEffect(() => {
    getUsers().then(r => setClients(r.data.filter(u => u.role === 'client')));
    getClientsWithUpcoming().then(r => setUpcomingIds(new Set(r.data)));
  }, []);

  // Unique sorted values for filter dropdowns
  const cities   = [...new Set(clients.map(c => c.city).filter(Boolean))].sort();
  const counties = [...new Set(clients.map(c => c.county).filter(Boolean))].sort();

  const filtered = clients.filter(c => {
    if (filterCity     && c.city   !== filterCity)   return false;
    if (filterCounty   && c.county !== filterCounty) return false;
    if (filterUpcoming && !upcomingIds.has(c.id))    return false;
    return true;
  });

  function openDetail(c) {
    setSelected(c);
    setEditing(false);
    setSaveMsg(null);
    setForm({
      first_name: c.first_name,
      last_name:  c.last_name  || '',
      email:      c.email,
      phone:      c.phone      || '',
      zip_code:   c.zip_code   || '',
      city:       c.city       || '',
      county:     c.county     || '',
    });
  }

  function closeModal() {
    setSelected(null);
    setEditing(false);
    setSaveMsg(null);
    setDeleteTarget(null);
  }

  async function lookupZip(zip) {
    if (zip.length !== 5) return;
    setZipLoading(true);
    try {
      const res  = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (res.ok) {
        const data = await res.json();
        const place = data.places?.[0];
        if (place) {
          setForm(f => ({ ...f, city: place['place name'] || f.city }));
        }
      }
    } catch (_) {}
    setZipLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setSaveMsg(null);
    try {
      const res     = await adminUpdateUser(selected.id, form);
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
      {/* Header + filters */}
      <div className="clients-header">
        <h2>Clients ({filtered.length}{filtered.length !== clients.length ? ` of ${clients.length}` : ''})</h2>
        <div style={{ position: 'relative' }}>
          <button
            className={`filter-btn${(filterCity || filterCounty || filterUpcoming) ? ' filter-btn-active' : ''}`}
            onClick={() => setFiltersOpen(v => !v)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Filters
            {(filterCity || filterCounty || filterUpcoming) && (
              <span className="filter-badge">
                {[filterCity, filterCounty, filterUpcoming].filter(Boolean).length}
              </span>
            )}
          </button>

          {filtersOpen && (
            <>
              <div className="filter-backdrop" onClick={() => setFiltersOpen(false)} />
              <div className="filter-dropdown">
                <div className="filter-dropdown-title">Filters</div>

                <div className="filter-group">
                  <label>City</label>
                  <select className="filter-select" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
                    <option value="">All cities</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="filter-group">
                  <label>County</label>
                  <select className="filter-select" value={filterCounty} onChange={e => setFilterCounty(e.target.value)}>
                    <option value="">All counties</option>
                    {counties.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="toggle-label" style={{ marginBottom: 0 }}>
                    <div className={`toggle-switch ${filterUpcoming ? 'on' : ''}`} onClick={() => setFilterUpcoming(v => !v)}>
                      <div className="toggle-thumb" />
                    </div>
                    <span>Has upcoming appointment</span>
                  </label>
                </div>

                {(filterCity || filterCounty || filterUpcoming) && (
                  <button
                    className="filter-clear"
                    style={{ marginTop: '0.75rem', width: '100%', textAlign: 'center' }}
                    onClick={() => { setFilterCity(''); setFilterCounty(''); setFilterUpcoming(false); }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <table className="client-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>City</th>
            <th>County</th>
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
              <td>{c.city   || '—'}</td>
              <td>{c.county || '—'}</td>
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
          <div className="modal" style={{ minWidth: 360, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0 }}>{selected.first_name} {selected.last_name}</h3>
              {!editing
                ? <button style={btnOutline} onClick={() => { setEditing(true); setSaveMsg(null); }}><PencilIcon /> Edit</button>
                : <button style={btnCancel} onClick={() => { setEditing(false); setSaveMsg(null); setForm({ first_name: selected.first_name, last_name: selected.last_name || '', email: selected.email, phone: selected.phone || '', zip_code: selected.zip_code || '', city: selected.city || '', county: selected.county || '' }); }}>Cancel</button>}
            </div>

            {saveMsg && <p style={{ fontSize: '0.85rem', color: saveMsg.ok ? '#27ae60' : '#c0392b', margin: '0 0 0.75rem' }}>{saveMsg.text}</p>}

            {editing ? (
              <form onSubmit={handleSave}>
                <div style={grid2}>
                  <Field label="First name"><input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required /></Field>
                  <Field label="Last name"><input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></Field>
                </div>
                <Field label="Email"><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></Field>
                <Field label="Phone"><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
                <div style={grid2}>
                  <Field label="Zip code">
                    <input
                      value={form.zip_code}
                      maxLength={5}
                      onChange={e => {
                        const z = e.target.value;
                        setForm(f => ({ ...f, zip_code: z }));
                        if (z.length === 5) lookupZip(z);
                      }}
                      placeholder="00000"
                    />
                  </Field>
                  <Field label={zipLoading ? 'City (looking up…)' : 'City'}>
                    <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                  </Field>
                </div>
                <Field label="County">
                  <input value={form.county} onChange={e => setForm({ ...form, county: e.target.value })} placeholder="e.g. Albemarle" />
                </Field>
                <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
                  <button type="button" className="btn-danger" onClick={() => setDeleteTarget(selected)}>Delete</button>
                  <button type="submit" style={btnSuccess} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
                </div>
              </form>
            ) : (
              <>
                <DetailRow label="Email"      value={selected.email} />
                <DetailRow label="Phone"      value={selected.phone    || '—'} />
                <DetailRow label="Zip code"   value={selected.zip_code || '—'} />
                <DetailRow label="City"       value={selected.city     || '—'} />
                <DetailRow label="County"     value={selected.county   || '—'} />
                <DetailRow label="Verified"   value={selected.email_verified ? 'Yes' : 'Pending'} />
                <DetailRow label="Registered" value={selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '—'} />
                <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                  <button className="btn-cancel" onClick={closeModal}>Cancel</button>
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

const btnOutline = { display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.35rem 0.8rem', fontSize: '0.82rem', color: '#555', cursor: 'pointer' };
const btnCancel  = { background: 'none', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.35rem 0.8rem', fontSize: '0.82rem', color: '#555', cursor: 'pointer' };
const btnSuccess = { background: '#4aba6e', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' };
const grid2      = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' };
