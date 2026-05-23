import { useState, useEffect } from 'react';
import { getMyProperties, createProperty, deleteProperty } from '../services/api';

const emptyForm = {
  name: '', type: 'house', address: '', city: '', state: 'VA', zip_code: '', notes: ''
};

const TYPE_ICONS = { house: '🏠', apartment: '🏢', office: '🏛️', other: '📍' };

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [loading, setLoading]       = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    getMyProperties()
      .then(r => setProperties(r.data))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await createProperty(form);
    setProperties(prev => [...prev, res.data]);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function handleDelete() {
    await deleteProperty(deleteTarget.id);
    setProperties(prev => prev.filter(p => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  if (loading) return <p className="empty-msg">Loading...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p className="page-title" style={{ margin: 0 }}>My Properties</p>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Property</button>
      </div>

      {properties.length === 0 && (
        <div className="card">
          <p className="empty-msg">No properties yet. Add your first property to request a quote.</p>
        </div>
      )}

      <div className="property-grid">
        {properties.map(p => (
          <div key={p.id} className="property-card">
            <div className="property-name">
              {TYPE_ICONS[p.type] || '📍'} {p.name}
            </div>
            <div className="property-address">{p.address}, {p.city}, {p.state}</div>
            <span className="property-type">{p.type}</span>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-secondary"
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => setDeleteTarget(p)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add property modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Property</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Property Name *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. My Home, Downtown Office" required />
              </div>
              <div className="form-field">
                <label>Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="office">Office</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-field">
                <label>Address *</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                  placeholder="123 Main St" required />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>City *</label>
                  <input value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                    placeholder="Charlottesville" required />
                </div>
                <div className="form-field">
                  <label>Zip Code</label>
                  <input value={form.zip_code} onChange={e => setForm({...form, zip_code: e.target.value})}
                    placeholder="22901" />
                </div>
              </div>
              <div className="form-field">
                <label>Notes</label>
                <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  placeholder="Gate code, parking instructions..." />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Property</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Property</h3>
            <p>Are you sure you want to delete <strong>{deleteTarget.name}</strong>?</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-primary" style={{ background: '#e74c3c' }} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
