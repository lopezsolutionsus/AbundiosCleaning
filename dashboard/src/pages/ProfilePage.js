import { useState, useEffect } from 'react';
import { getMe, updateMe, changePassword, requestEmailChange, confirmEmailChange } from '../services/api';

const ROLE_LABEL = { admin: 'Administrator', staff: 'Staff', client: 'Client' };

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

function PasswordInput({ value, onChange, placeholder, required }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} required={required} style={{ paddingRight: '2.5rem' }} />
      <button type="button" onClick={() => setShow(s => !s)} tabIndex={-1}
        style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 0, display: 'flex' }}>
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser]           = useState(null);
  const [loadError, setLoadError] = useState(false);

  // Profile section
  const [editing, setEditing]     = useState(false);
  const [form, setForm]           = useState({ first_name: '', last_name: '', phone: '' });
  const [profileMsg, setProfileMsg] = useState(null);
  const [saving, setSaving]       = useState(false);

  // Email change section
  const [emailOpen, setEmailOpen]     = useState(false);
  const [emailStep, setEmailStep]     = useState(1); // 1=enter new email, 2=enter code
  const [newEmail, setNewEmail]       = useState('');
  const [emailCode, setEmailCode]     = useState('');
  const [emailMsg, setEmailMsg]       = useState(null);
  const [emailSending, setEmailSending] = useState(false);

  // Password section
  const [pwOpen, setPwOpen]       = useState(false);
  const [pwForm, setPwForm]       = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwMsg, setPwMsg]         = useState(null);
  const [savingPw, setSavingPw]   = useState(false);

  useEffect(() => {
    getMe()
      .then(r => {
        setUser(r.data);
        setForm({ first_name: r.data.first_name || '', last_name: r.data.last_name || '', phone: r.data.phone || '' });
      })
      .catch(() => setLoadError(true));
  }, []);

  // --- Profile handlers ---
  function startEdit() { setEditing(true); setProfileMsg(null); }
  function cancelEdit() {
    setEditing(false);
    setForm({ first_name: user.first_name, last_name: user.last_name || '', phone: user.phone || '' });
    setProfileMsg(null);
  }
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setProfileMsg(null);
    try {
      const res = await updateMe(form);
      setUser(prev => ({ ...prev, ...res.data }));
      localStorage.setItem('first_name', res.data.first_name);
      setEditing(false);
      setProfileMsg({ ok: true, text: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ ok: false, text: err.response?.data?.detail || 'Failed to update.' });
    }
    setSaving(false);
  }

  // --- Email change handlers ---
  function openEmailChange() { setEmailOpen(true); setEmailStep(1); setNewEmail(''); setEmailCode(''); setEmailMsg(null); }
  function closeEmailChange() { setEmailOpen(false); setEmailMsg(null); }

  async function handleRequestCode(e) {
    e.preventDefault();
    setEmailSending(true); setEmailMsg(null);
    try {
      await requestEmailChange({ new_email: newEmail });
      setEmailStep(2);
      setEmailMsg({ ok: true, text: `A 6-digit code was sent to ${user.email}. It expires in 15 minutes.` });
    } catch (err) {
      setEmailMsg({ ok: false, text: err.response?.data?.detail || 'Failed to send code.' });
    }
    setEmailSending(false);
  }

  async function handleConfirmCode(e) {
    e.preventDefault();
    setEmailSending(true); setEmailMsg(null);
    try {
      const res = await confirmEmailChange({ code: emailCode });
      setUser(prev => ({ ...prev, email: res.data.email }));
      setEmailOpen(false);
      setProfileMsg({ ok: true, text: 'Email updated successfully.' });
    } catch (err) {
      setEmailMsg({ ok: false, text: err.response?.data?.detail || 'Incorrect or expired code.' });
    }
    setEmailSending(false);
  }

  // --- Password handlers ---
  async function handlePasswordSave(e) {
    e.preventDefault(); setPwMsg(null);
    if (pwForm.new_password !== pwForm.confirm) { setPwMsg({ ok: false, text: 'Passwords do not match.' }); return; }
    if (pwForm.new_password.length < 6)         { setPwMsg({ ok: false, text: 'At least 6 characters required.' }); return; }
    setSavingPw(true);
    try {
      await changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwMsg({ ok: true, text: 'Password updated.' });
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

      {/* ── Personal info ── */}
      <div style={card}>
        <div style={cardHeader}>
          <h2 style={sectionTitle}>Profile</h2>
          {!editing
            ? <button onClick={startEdit} style={btnOutline}><EditIcon /> Edit</button>
            : <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={cancelEdit} style={btnCancel}>Cancel</button>
                <button form="profileForm" type="submit" style={btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>}
        </div>
        {profileMsg && <Msg ok={profileMsg.ok}>{profileMsg.text}</Msg>}
        {editing ? (
          <form id="profileForm" onSubmit={handleSave}>
            <Field label="First name"><input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required /></Field>
            <Field label="Last name"><input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></Field>
            <Field label="Phone"><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(434) 000-0000" /></Field>
          </form>
        ) : (
          <>
            <Row label="First name" value={user.first_name} />
            <Row label="Last name"  value={user.last_name  || '—'} />
            <Row label="Phone"      value={user.phone      || '—'} />
            <Row label="Role"       value={ROLE_LABEL[user.role] || user.role} />
          </>
        )}
      </div>

      {/* ── Change email ── */}
      <div style={card}>
        <div style={cardHeader}>
          <div>
            <h2 style={sectionTitle}>Email address</h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#888' }}>{user.email}</p>
          </div>
          {!emailOpen
            ? <button onClick={openEmailChange} style={btnOutline}><EditIcon /> Change</button>
            : <button type="button" onClick={closeEmailChange} style={btnCancel}>Cancel</button>}
        </div>

        {emailOpen && (
          <div style={{ marginTop: '1.25rem' }}>
            {emailStep === 1 && (
              <form onSubmit={handleRequestCode}>
                <Field label="New email address">
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@example.com" required />
                </Field>
                <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.75rem' }}>
                  We'll send a 6-digit verification code to your <strong>current email</strong> ({user.email}).
                </p>
                {emailMsg && <Msg ok={emailMsg.ok}>{emailMsg.text}</Msg>}
                <button type="submit" style={btnPrimary} disabled={emailSending}>{emailSending ? 'Sending…' : 'Send code'}</button>
              </form>
            )}
            {emailStep === 2 && (
              <form onSubmit={handleConfirmCode}>
                {emailMsg && <Msg ok={emailMsg.ok}>{emailMsg.text}</Msg>}
                <Field label="6-digit code">
                  <input value={emailCode} onChange={e => setEmailCode(e.target.value)} placeholder="000000" maxLength={6} required />
                </Field>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button type="button" onClick={() => { setEmailStep(1); setEmailMsg(null); }} style={btnCancel}>Back</button>
                  <button type="submit" style={btnPrimary} disabled={emailSending}>{emailSending ? 'Verifying…' : 'Confirm'}</button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ── Change password ── */}
      <div style={card}>
        <div style={cardHeader}>
          <h2 style={sectionTitle}>Change Password</h2>
          {!pwOpen
            ? <button onClick={() => { setPwOpen(true); setPwMsg(null); }} style={btnOutline}><EditIcon /> Change</button>
            : <button type="button" onClick={() => { setPwOpen(false); setPwMsg(null); setPwForm({ current_password: '', new_password: '', confirm: '' }); }} style={btnCancel}>Cancel</button>}
        </div>
        {pwMsg && !pwOpen && <Msg ok={pwMsg.ok}>{pwMsg.text}</Msg>}
        {pwOpen && (
          <form onSubmit={handlePasswordSave} style={{ marginTop: '1.5rem' }}>
            <Field label="Current password"><PasswordInput value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} required /></Field>
            <Field label="New password"><PasswordInput value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} placeholder="At least 6 characters" required /></Field>
            <Field label="Confirm new password"><PasswordInput value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required /></Field>
            {pwMsg && <Msg ok={pwMsg.ok}>{pwMsg.text}</Msg>}
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
  return <div className="form-field"><label>{label}</label>{children}</div>;
}
function Msg({ ok, children }) {
  return <p style={{ fontSize: '0.85rem', color: ok ? '#27ae60' : '#c0392b', margin: '0 0 0.75rem' }}>{children}</p>;
}

const card        = { background: 'white', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' };
const cardHeader  = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' };
const sectionTitle = { fontSize: '1.05rem', fontWeight: 700, color: '#111', margin: 0 };
const btnOutline  = { display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.4rem 0.9rem', fontSize: '0.85rem', color: '#555', cursor: 'pointer' };
const btnCancel   = { background: 'none', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.4rem 0.9rem', fontSize: '0.85rem', color: '#555', cursor: 'pointer' };
const btnPrimary  = { background: '#E90A46', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' };
