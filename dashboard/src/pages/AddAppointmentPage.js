import { useState, useEffect } from 'react';
import { getUsers, createAppointment } from '../services/api';

const SERVICE_TYPES = [
  { value: 'general',       label: 'General Cleaning' },
  { value: 'profunda',      label: 'Deep Cleaning' },
  { value: 'move',          label: 'Move-In / Move-Out' },
  { value: 'post_construction', label: 'Post-Construction' },
];

export default function AddAppointmentPage() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    client_id: '',
    date: '',
    time: '',
    type: 'general',
    property: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState(null);

  useEffect(() => {
    getUsers().then(r => setClients(r.data.filter(u => u.role === 'client')));
  }, []);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await createAppointment(form);
      setMsg({ ok: true, text: 'Appointment added successfully.' });
      setForm({ client_id: '', date: '', time: '', type: 'general', property: '', notes: '' });
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.detail || 'Failed to add appointment.' });
    }
    setSaving(false);
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={card}>
        <h2 style={title}>Add Appointment</h2>

        {msg && (
          <p style={{ fontSize: '0.85rem', color: msg.ok ? '#27ae60' : '#c0392b', marginBottom: '1rem' }}>
            {msg.text}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <Field label="Client">
            <select value={form.client_id} onChange={e => set('client_id', e.target.value)} required>
              <option value="">Select a client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </Field>

          <div style={row}>
            <Field label="Date">
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
            </Field>
            <Field label="Time">
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
            </Field>
          </div>

          <Field label="Service type">
            <select value={form.type} onChange={e => set('type', e.target.value)}>
              {SERVICE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Property address">
            <input value={form.property} onChange={e => set('property', e.target.value)} placeholder="Optional" />
          </Field>

          <Field label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" rows={3} style={{ resize: 'vertical' }} />
          </Field>

          <button type="submit" style={btnPrimary} disabled={saving}>
            {saving ? 'Adding…' : 'Add Appointment'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div className="form-field"><label>{label}</label>{children}</div>;
}

const card      = { background: 'white', borderRadius: '0.75rem', padding: '1.75rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' };
const title     = { fontSize: '1.05rem', fontWeight: 700, color: '#111', marginBottom: '1.5rem' };
const row       = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' };
const btnPrimary = { background: '#E90A46', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.6rem 1.4rem', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' };
