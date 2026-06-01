import { useState, useEffect } from 'react';
import { getMe, updateMe, changePassword } from '../services/api';

const ROLE_LABEL = { admin: 'Administrator', staff: 'Staff', client: 'Client' };

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

export default function ProfilePage() {
  const [user, setUser]             = useState(null);
  const [editing, setEditing]       = useState(false);
  const [pwOpen, setPwOpen]         = useState(false);
  const [form, setForm]             = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [pwForm, setPwForm]         = useState({ current_password: '', new_password: '', confirm: '' });
  const [profileMsg, setProfileMsg] = useState(null);
  const [pwMsg, setPwMsg]           = useState(null);
  const [saving, setSaving]         = useState(false);
  const [savingPw, setSavingPw]     = useState(false);
  const [loadError, setLoadError]   = useState(false);

  useEffect(() => {
    getMe()
      .then(r => {
        setUser(r.data);
        setForm({
          first_name: r.data.first_name || '',
          last_name:  r.data.last_name  || '',
          email:      r.data.email      || '',
          phone:      r.data.phone      || '',
        });
      })
      .catch(() => setLoadError(true));
  }, []);

  function startEdit() { setEditing(true); setProfileMsg(null); }
  function cancelEdit() {
    setEditing(false);
    setForm({ first_name: user.first_name, last_name: user.last_name, email: user.email, phone: user.phone || '' });
    setProfileMsg(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setProfileMsg(null);
    try {
      const res = await updateMe(form);
      setUser(prev => ({ ...prev, ...res.data }));
      localStorage.setItem('first_name', res.data.first_name);
      setEditing(false);
      setProfileMsg({ ok: true, text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({ ok: false, text: err.response?.data?.detail || 'Failed to update profile.' });
    }
    setSaving(false);
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.new_password !== pwForm.confirm) { setPwMsg({ ok: false, text: 'Passwords do not match.' }); return; }
    if (pwForm.new_password.length < 6)         { setPwMsg({ ok: false, text: 'Password must be at least 6 characters.' }); return; }
    setSavingPw(true);
    try {
      await changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwMsg({ ok: true, text: 'Password updated successfully.' });
      setPwForm({ current_password: '', new_password: '', confirm: '' });
      setPwOpen(false);
    } catch (err) {
      setPwMsg({ ok: false, text: err.response?.data?.detail || 'Failed to change password.' });
    }
    setSavingPw(false);
  }

  if (loadError) return <p style={{ padding: '2rem', color: '#c0392b' }}>Could not load profile. Try refreshing.</p>;
  if (!user)     return <p style={{ padding: '2rem', color: '#aaa' }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 600 }}>

      {/* Profile card */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111', margin: 0 }}>Profile</h2>
          {!editing
            ? <button onClick={startEdit} style={btnOutline}><EditIcon /> Edit</button>
            : <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={cancelEdit} style={btnCancel}>Cancel</button>
                <button form="profileForm" type="submit" style={btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
          }
        </div>

        {profileMsg && <p style={{ fontSize: '0.85rem', color: profileMsg.ok ? '#27ae60' : '#c0392b', marginBottom: '1rem' }}>{profileMsg.text}</p>}

        {editing ? (
          <form id="profileForm" onSubmit={handleSave}>
            <Field label="First name"><input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required /></Field>
            <Field label="Last name"><input value={form.last_name}  onChange={e => setForm({ ...form, last_name: e.target.value })} /></Field>
            <Field label="Email"><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></Field>
            <Field label="Phone"><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(434) 000-0000" /></Field>
          </form>
        ) : (
          <div>
            <Row label="First name"  value={user.first_name} />
            <Row label="Last name"   value={user.last_name  || '—'} />
            <Row label="Email"       value={user.email} />
            <Row label="Phone"       value={user.phone || '—'} />
            <Row label="Role"        value={ROLE_LABEL[user.role] || user.role} />
            <Row label="Email verified" value={user.email_verified ? 'Yes' : 'No'} />
          </div>
        )}
      </div>

      {/* Change password card */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111', margin: 0 }}>Change Password</h2>
          {!pwOpen
            ? <button onClick={() => { setPwOpen(true); setPwMsg(null); }} style={btnOutline}><EditIcon /> Change</button>
            : <button onClick={() => { setPwOpen(false); setPwMsg(null); setPwForm({ current_password: '', new_password: '', confirm: '' }); }} style={btnCancel}>Cancel</button>
          }
        </div>

        {pwOpen && (
          <form onSubmit={handlePasswordSave} style={{ marginTop: '1.5rem' }}>
            <Field label="Current password"><input type="password" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} required /></Field>
            <Field label="New password"><input type="password" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} placeholder="At least 6 characters" required /></Field>
            <Field label="Confirm new password"><input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required /></Field>
            {pwMsg && <p style={{ fontSize: '0.85rem', color: pwMsg.ok ? '#27ae60' : '#c0392b', margin: '0.5rem 0' }}>{pwMsg.text}</p>}
            <button type="submit" style={{ ...btnPrimary, marginTop: '0.25rem' }} disabled={savingPw}>{savingPw ? 'Saving…' : 'Update Password'}</button>
          </form>
        )}
      </div>

    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', padding: '0.65rem 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ width: 160, fontSize: '0.85rem', color: '#888', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.9rem', color: '#111', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

const card = {
  background: 'white', borderRadius: '0.75rem', padding: '1.5rem',
  marginBottom: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
};
const btnOutline = {
  display: 'flex', alignItems: 'center', gap: '0.35rem',
  background: 'none', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem',
  padding: '0.4rem 0.9rem', fontSize: '0.85rem', color: '#555', cursor: 'pointer',
};
const btnCancel = {
  background: 'none', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem',
  padding: '0.4rem 0.9rem', fontSize: '0.85rem', color: '#555', cursor: 'pointer',
};
const btnPrimary = {
  background: '#E90A46', color: 'white', border: 'none', borderRadius: '0.5rem',
  padding: '0.4rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
};
