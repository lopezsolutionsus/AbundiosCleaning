import { useState, useEffect } from 'react';
import { getMyProperties, getServiceTypes, createQuote } from '../services/api';

const emptyForm = {
  property_id: '', service_type_id: '', sqft: '', bedrooms: '', bathrooms: '',
  cleanliness_level: '3', notes: ''
};

const CLEANLINESS = [
  { value: '1', label: '1 - Very Clean' },
  { value: '2', label: '2 - Clean' },
  { value: '3', label: '3 - Average' },
  { value: '4', label: '4 - Dirty' },
  { value: '5', label: '5 - Very Dirty' },
];

export default function QuotePage() {
  const [properties, setProperties]     = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [form, setForm]                 = useState(emptyForm);
  const [submitted, setSubmitted]       = useState(false);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([getMyProperties(), getServiceTypes()])
      .then(([props, svcs]) => {
        setProperties(props.data);
        setServiceTypes(svcs.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await createQuote({
      ...form,
      sqft: form.sqft ? parseFloat(form.sqft) : null,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
      bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
      cleanliness_level: parseInt(form.cleanliness_level),
    });
    setSubmitted(true);
  }

  if (loading) return <p className="empty-msg">Loading...</p>;

  if (submitted) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h3 style={{ color: 'var(--pink-dark)', marginBottom: '0.75rem' }}>Quote Request Sent!</h3>
        <p style={{ color: '#888', marginBottom: '1.5rem' }}>
          We'll review your request and send you a price shortly.
        </p>
        <button className="btn-primary" onClick={() => setSubmitted(false)}>Request Another</button>
      </div>
    );
  }

  return (
    <div>
      <p className="page-title">Request a Quote</p>

      {properties.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#888', marginBottom: '1rem' }}>
            You need to add a property before requesting a quote.
          </p>
          <a href="/client/properties" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Add a Property
          </a>
        </div>
      ) : (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>Property *</label>
              <select value={form.property_id} onChange={e => setForm({...form, property_id: e.target.value})} required>
                <option value="">Select a property...</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.address}, {p.city}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Service Type *</label>
              <select value={form.service_type_id} onChange={e => setForm({...form, service_type_id: e.target.value})} required>
                <option value="">Select a service...</option>
                {serviceTypes.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Square Feet</label>
                <input type="number" value={form.sqft} onChange={e => setForm({...form, sqft: e.target.value})}
                  placeholder="e.g. 1200" min="0" />
              </div>
              <div className="form-field">
                <label>Bedrooms</label>
                <input type="number" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: e.target.value})}
                  placeholder="e.g. 3" min="0" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Bathrooms</label>
                <input type="number" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: e.target.value})}
                  placeholder="e.g. 2" min="0" />
              </div>
              <div className="form-field">
                <label>Cleanliness Level</label>
                <select value={form.cleanliness_level} onChange={e => setForm({...form, cleanliness_level: e.target.value})}>
                  {CLEANLINESS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-field">
              <label>Additional Notes</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="Any special instructions, areas of concern, pet information..." rows={4} />
            </div>

            <button type="submit" className="btn-primary">Submit Quote Request</button>
          </form>
        </div>
      )}
    </div>
  );
}
