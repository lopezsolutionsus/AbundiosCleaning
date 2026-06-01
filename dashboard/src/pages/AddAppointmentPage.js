import { useState, useEffect } from 'react';
import { getUsers, createAppointment } from '../services/api';

const SERVICE_TYPES = [
  { value: 'general',           label: 'General Cleaning' },
  { value: 'profunda',          label: 'Deep Cleaning' },
  { value: 'move',              label: 'Move-In / Move-Out' },
  { value: 'post_construction', label: 'Post-Construction' },
];

const EMPTY = { client_id: '', date: '', time: '', type: 'general', property: '', notes: '' };

export default function AddAppointmentPage() {
  const [clients, setClients] = useState([]);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  useEffect(() => {
    getUsers().then(r => setClients(r.data.filter(u => u.role === 'client')));
  }, []);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await createAppointment(form);
      setMsg({ ok: true, text: 'Appointment added successfully.' });
      setForm(EMPTY);
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.detail || 'Failed to add appointment.' });
    }
    setSaving(false);
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <form className="appt-form-card" onSubmit={handleSubmit}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111', marginBottom: '1.5rem' }}>Add Appointment</h2>
        {msg && (
          <div className={`appt-msg ${msg.ok ? 'appt-msg-ok' : 'appt-msg-err'}`}>
            {msg.text}
          </div>
        )}

        {/* Row 1: Client full width */}
        <div className="appt-field">
          <label>Client</label>
          <select value={form.client_id} onChange={e => set('client_id', e.target.value)} required>
            <option value="">Select a client...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
            ))}
          </select>
        </div>

        <div className="appt-field">
          <label>Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
        </div>

        <div className="appt-field">
          <label>Time</label>
          <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
        </div>

        <div className="appt-field">
          <label>Service type</label>
          <select value={form.type} onChange={e => set('type', e.target.value)}>
            {SERVICE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="appt-field">
          <label>Property address <span className="appt-optional">optional</span></label>
          <input value={form.property} onChange={e => set('property', e.target.value)} placeholder="e.g. 123 Main St" />
        </div>

        <div className="appt-field">
          <label>Notes <span className="appt-optional">optional</span></label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any special instructions..." rows={4} />
        </div>

        <div className="appt-actions">
          <button type="submit" className="appt-btn-submit" disabled={saving}>
            {saving ? 'Adding…' : 'Add Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}
