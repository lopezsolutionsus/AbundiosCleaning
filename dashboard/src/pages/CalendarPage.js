import { useState, useEffect } from 'react';
import { getUsers, getAppointments, deleteAppointment } from '../services/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const TYPES  = { general: 'General Cleaning', profunda: 'Deep Cleaning' };

function dateKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear]         = useState(today.getFullYear());
  const [month, setMonth]       = useState(today.getMonth());
  const [selected, setSelected] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [showModal, setShowModal] = useState(null);

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

  async function handleDelete(id) {
    await deleteAppointment(id);
    setAppointments(prev => prev.filter(a => a.id !== id));
    setShowModal(null);
  }

  const dayAppts = selected ? apptsByDate(selected) : [];
  const selectedLabel = selected
    ? `${MONTHS[parseInt(selected.split('-')[1])-1]} ${parseInt(selected.split('-')[2])}, ${selected.split('-')[0]}`
    : 'Select a day';

  return (
    <div className="calendar-wrap">
      {/* Calendar grid */}
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
                className={`calendar-day${isToday ? ' today' : ''}${selected===key ? ' selected' : ''}`}
                onClick={() => setSelected(key)}
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

      {/* Day agenda */}
      <div className="agenda-box">
        {selected && <h3>{selectedLabel}</h3>}
        {selected && dayAppts.length === 0 && <p className="empty-msg" style={{ marginTop: '1rem' }}>No appointments this day.</p>}
        {dayAppts.map(a => (
          <div key={a.id} className="appt-card" onClick={() => setShowModal(a)}>
            <div className="appt-client">{a.client}</div>
            {a.property && <div className="appt-meta">{a.property}</div>}
            <div className="appt-meta">{a.time || '—'}</div>
            <span className="appt-badge">{TYPES[a.type] || a.type}</span>
          </div>
        ))}
      </div>

      {/* Appointment detail modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{showModal.client}</h3>
            <p><strong>Date:</strong> {showModal.date}</p>
            <p><strong>Time:</strong> {showModal.time || '—'}</p>
            <p><strong>Type:</strong> {TYPES[showModal.type] || showModal.type}</p>
            {showModal.property && <p><strong>Property:</strong> {showModal.property}</p>}
            {showModal.notes    && <p><strong>Notes:</strong>    {showModal.notes}</p>}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(null)}>Close</button>
              <button className="btn-danger" onClick={() => handleDelete(showModal.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
