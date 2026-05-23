import { useState, useEffect } from 'react';
import { getMyAppointments, getMyQuotes } from '../services/api';

const STATUS_LABELS = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const TYPE_LABELS = {
  general:  'General Cleaning',
  profunda: 'Deep Cleaning',
};

export default function DashboardPage() {
  const [appointments, setAppointments] = useState([]);
  const [quotes, setQuotes]             = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([getMyAppointments(), getMyQuotes()])
      .then(([appts, qs]) => {
        setAppointments(appts.data);
        setQuotes(qs.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="empty-msg">Loading...</p>;

  return (
    <div>
      <p className="page-title">My Appointments</p>

      <div className="card">
        <h3>Upcoming & Recent</h3>
        {appointments.length === 0 && (
          <p className="empty-msg">No appointments yet. Request a quote to get started!</p>
        )}
        {appointments.map(a => (
          <div key={a.id} className="appt-item">
            <div>
              <div className="appt-date">{a.date} {a.time ? `· ${a.time}` : ''}</div>
              <div className="appt-meta">
                {TYPE_LABELS[a.type] || a.type}
                {a.property_address ? ` · ${a.property_address}` : ''}
              </div>
            </div>
            <span className={`badge badge-${a.status}`}>
              {STATUS_LABELS[a.status] || a.status}
            </span>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>My Quotes</h3>
        {quotes.length === 0 && (
          <p className="empty-msg">No quotes yet.</p>
        )}
        {quotes.map(q => (
          <div key={q.id} className="appt-item">
            <div>
              <div className="appt-date">{q.service_type_name || 'Service'}</div>
              <div className="appt-meta">
                {q.property_address || ''}
                {q.sqft ? ` · ${q.sqft} sqft` : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`badge badge-${q.status}`}>
                {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
              </span>
              {q.final_price && (
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#388e3c', marginTop: '0.3rem' }}>
                  ${q.final_price}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
