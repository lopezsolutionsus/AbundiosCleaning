import { useState, useEffect } from 'react';
import { getMe, updateMe, changePassword } from '../services/api';

const ROLE_LABEL = { admin: 'Administrator', staff: 'Staff', client: 'Client' };

export default function ProfilePage() {
  const [user, setUser]           = useState(null);
  const [profileForm, setProfile] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [pwForm, setPw]           = useState({ current_password: '', new_password: '', confirm: '' });
  const [profileMsg, setProfileMsg] = useState(null);
  const [pwMsg, setPwMsg]           = useState(null);
  const [saving, setSaving]         = useState(false);
  const [savingPw, setSavingPw]     = useState(false);

  useEffect(() => {
    getMe().then(r => {
      setUser(r.data);
      setProfile({
        first_name: r.data.first_name || '',
        last_name:  r.data.last_name  || '',
        email:      r.data.email      || '',
        phone:      r.data.phone      || '',
      });
    });
  }, []);

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileMsg(null);
    setSaving(true);
    try {
      const res = await updateMe(profileForm);
      setUser(prev => ({ ...prev, ...res.data }));
      localStorage.setItem('first_name', res.data.first_name);
      setProfileMsg({ ok: true, text: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ ok: false, text: err.response?.data?.detail || 'Failed to update profile.' });
    }
    setSaving(false);
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.new_password !== pwForm.confirm) {
      setPwMsg({ ok: false, text: 'New passwords do not match.' });
      return;
    }
    if (pwForm.new_password.length < 6) {
      setPwMsg({ ok: false, text: 'New password must be at least 6 characters.' });
      return;
    }
    setSavingPw(true);
    try {
      await changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwMsg({ ok: true, text: 'Password changed successfully.' });
      setPw({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwMsg({ ok: false, text: err.response?.data?.detail || 'Failed to change password.' });
    }
    setSavingPw(false);
  }

  if (!user) return <div style={{ padding: '2rem', color: '#888' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 560, padding: '2rem' }}>
      <h2 style={{ marginBottom: '0.25rem' }}>My Profile</h2>
      <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '2rem' }}>
        Logged in as <strong>{user.email}</strong> &mdash;{' '}
        <span style={{ background: '#fde8ee', color: '#E90A46', padding: '2px 8px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600 }}>
          {ROLE_LABEL[user.role] || user.role}
        </span>
      </p>

      {/* Profile info */}
      <section style={cardStyle}>
        <h3 style={sectionTitle}>Personal Info</h3>
        <form onSubmit={handleProfileSave}>
          <div style={rowStyle}>
            <div className="form-field" style={{ flex: 1 }}>
              <label>First Name</label>
              <input value={profileForm.first_name} onChange={e => setProfile({ ...profileForm, first_name: e.target.value })} required />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Last Name</label>
              <input value={profileForm.last_name} onChange={e => setProfile({ ...profileForm, last_name: e.target.value })} />
            </div>
          </div>
          <div className="form-field">
            <label>Email</label>
            <input type="email" value={profileForm.email} onChange={e => setProfile({ ...profileForm, email: e.target.value })} required />
          </div>
          <div className="form-field">
            <label>Phone</label>
            <input type="tel" value={profileForm.phone} onChange={e => setProfile({ ...profileForm, phone: e.target.value })} placeholder="(434) 000-0000" />
          </div>
          {profileMsg && <p style={{ ...msgStyle, color: profileMsg.ok ? '#27ae60' : '#c0392b' }}>{profileMsg.text}</p>}
          <button type="submit" className="btn-save" style={{ marginTop: '0.5rem', padding: '0.5rem 1.4rem' }} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </section>

      {/* Change password */}
      <section style={cardStyle}>
        <h3 style={sectionTitle}>Change Password</h3>
        <form onSubmit={handlePasswordSave}>
          <div className="form-field">
            <label>Current Password</label>
            <input type="password" value={pwForm.current_password} onChange={e => setPw({ ...pwForm, current_password: e.target.value })} required />
          </div>
          <div className="form-field">
            <label>New Password</label>
            <input type="password" value={pwForm.new_password} onChange={e => setPw({ ...pwForm, new_password: e.target.value })} placeholder="At least 6 characters" required />
          </div>
          <div className="form-field">
            <label>Confirm New Password</label>
            <input type="password" value={pwForm.confirm} onChange={e => setPw({ ...pwForm, confirm: e.target.value })} required />
          </div>
          {pwMsg && <p style={{ ...msgStyle, color: pwMsg.ok ? '#27ae60' : '#c0392b' }}>{pwMsg.text}</p>}
          <button type="submit" className="btn-save" style={{ marginTop: '0.5rem', padding: '0.5rem 1.4rem' }} disabled={savingPw}>
            {savingPw ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </section>
    </div>
  );
}

const cardStyle = {
  background: 'white',
  borderRadius: '0.75rem',
  padding: '1.5rem',
  marginBottom: '1.25rem',
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
};
const sectionTitle = { fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#111' };
const rowStyle     = { display: 'flex', gap: '0.75rem' };
const msgStyle     = { fontSize: '0.85rem', marginTop: '0.5rem' };
