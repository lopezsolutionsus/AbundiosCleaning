import { useState, useEffect } from 'react';
import { getAppointments, deleteAppointment } from '../services/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const TYPES  = { general: 'General Cleaning', profunda: 'Deep Cleaning', move: 'Move-In / Move-Out', post_construction: 'Post-Construction' };

function dateKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [appointments, setAppointments] = useState([]);
  const [dayModal, setDayModal]         = useState(null); // { key, appts }
  const [detailModal, setDetailModal]   = useState(null); // single appt

  useEffect(() => {
    getAppointments().then(r => setAppointments(r.data));
  }, []);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y-1); }
    else setMonth(m => m-1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y+1); }
    else setMonth(m => m+1);
  }

  const firstDay  = new Date(year, month, 1).getDay();
  const daysTotal = new Date(year, month+1, 0).getDate();

  function apptsByDate(key) {
    return appointments.filter(a => a.date === key);
  }

  function handleDayClick(key) {
    const appts = apptsByDate(key);
    if (appts.length > 0) setDayModal({ key, appts });
  }

  async function handleDelete(id) {
    await deleteAppointment(id);
    setAppointments(prev => prev.filter(a => a.id !== id));
    setDetailModal(null);
    setDayModal(prev => prev ? { ...prev, appts: prev.appts.filter(a => a.id !== id) } : null);
  }

  const dayLabel = key => {
    const [y, m, d] = key.split('-');
    return `${MONTHS[parseInt(m)-1]} ${parseInt(d)}, ${y}`;
  };

  return (
    <div className="calendar-wrap">
      <div className="calendar-box">
        <div className="calendar-header">
          <button onClick={prevMonth}>‹</button>
          <h2>{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth}>›</button>
        </div>
        <div className="calendar-grid">
          {DAYS.map(d => <div key={d} className="day-label">{d}</div>)}
          {Array(firstDay).fill(null).map((_, i) => <div key={'e'+i} className="calendar-day empty" />)}
          {Array(daysTotal).fill(null).map((_, i) => {
            const d     = i + 1;
            const key   = dateKey(year, month, d);
            const appts = apptsByDate(key);
            const isToday = today.getFullYear()===year && today.getMonth()===month && today.getDate()===d;
            return (
              <div
                key={key}
                className={`calendar-day${isToday ? ' today' : ''}`}
                onClick={() => handleDayClick(key)}
              >
                <span className="day-num">{d}</span>
                {appts.length > 0 && (
                  <div className="dot-container">
                    {appts.slice(0,4).map((_, j) => <div key={j} className="dot" />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day appointments modal */}
      {dayModal && !detailModal && (
        <div className="modal-overlay" onClick={() => setDayModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{dayLabel(dayModal.key)}</h3>
            {dayModal.appts.length === 0
              ? <p style={{ color: '#aaa', fontSize: '0.9rem' }}>No appointments.</p>
              : dayModal.appts.map(a => (
                  <div key={a.id} className="appt-card" onClick={() => setDetailModal(a)}>
                    <div className="appt-client">{a.client}</div>
                    {a.property && <div className="appt-meta">{a.property}</div>}
                    <div className="appt-meta">{a.time || '—'}</div>
                    <span className="appt-badge">{TYPES[a.type] || a.type}</span>
                  </div>
                ))
            }
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDayModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment detail modal */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{detailModal.client}</h3>
            <p><strong>Date:</strong> {detailModal.date}</p>
            <p><strong>Time:</strong> {detailModal.time || '—'}</p>
            <p><strong>Type:</strong> {TYPES[detailModal.type] || detailModal.type}</p>
            {detailModal.property && <p><strong>Property:</strong> {detailModal.property}</p>}
            {detailModal.notes    && <p><strong>Notes:</strong>    {detailModal.notes}</p>}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDetailModal(null)}>Back</button>
              <button className="btn-danger" onClick={() => handleDelete(detailModal.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
