import { useState, useEffect } from 'react';
import { getReviews, approveReview, rejectReview } from '../services/api';

function Stars({ rating }) {
  return (
    <span style={{ color: '#f59e0b', fontSize: '1rem', letterSpacing: '0.05em' }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending:  { background: '#fef3c7', color: '#92400e' },
    approved: { background: '#d1fae5', color: '#065f46' },
    rejected: { background: '#fee2e2', color: '#991b1b' },
  };
  const s = styles[status] || styles.pending;
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.15rem 0.55rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      ...s,
    }}>
      {status}
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actionMsg, setActionMsg] = useState(null);

  useEffect(() => {
    getReviews()
      .then(r => setReviews(r.data))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(id) {
    try {
      await approveReview(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
      setActionMsg({ ok: true, text: 'Review approved.' });
    } catch {
      setActionMsg({ ok: false, text: 'Failed to approve review.' });
    }
    setTimeout(() => setActionMsg(null), 3000);
  }

  async function handleReject(id) {
    try {
      await rejectReview(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
      setActionMsg({ ok: true, text: 'Review rejected.' });
    } catch {
      setActionMsg({ ok: false, text: 'Failed to reject review.' });
    }
    setTimeout(() => setActionMsg(null), 3000);
  }

  return (
    <div className="clients-wrap">
      <div className="clients-header">
        <h2>Reviews ({reviews.length})</h2>
      </div>

      {actionMsg && (
        <p style={{
          fontSize: '0.85rem',
          color: actionMsg.ok ? '#27ae60' : '#c0392b',
          margin: '0 0 1rem',
          padding: '0.5rem 0.75rem',
          background: actionMsg.ok ? '#f0fdf4' : '#fff5f5',
          borderRadius: '0.5rem',
          border: `1px solid ${actionMsg.ok ? '#86efac' : '#fca5a5'}`,
        }}>
          {actionMsg.text}
        </p>
      )}

      {loading ? (
        <p style={{ color: '#888', fontSize: '0.9rem' }}>Loading reviews…</p>
      ) : (
        <table className="client-table">
          <thead>
            <tr>
              <th>Reviewer</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 && (
              <tr><td colSpan={6} className="empty-msg">No reviews yet.</td></tr>
            )}
            {reviews.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 500 }}>{r.reviewer_name || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Anonymous</span>}</td>
                <td><Stars rating={r.rating || 0} /></td>
                <td style={{ maxWidth: 300, fontSize: '0.85rem', color: '#555' }}>
                  {r.comment ? (
                    <span title={r.comment}>
                      {r.comment.length > 80 ? r.comment.slice(0, 80) + '…' : r.comment}
                    </span>
                  ) : <span style={{ color: '#aaa', fontStyle: 'italic' }}>No comment</span>}
                </td>
                <td><StatusBadge status={r.status} /></td>
                <td style={{ fontSize: '0.82rem', color: '#888', whiteSpace: 'nowrap' }}>
                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {r.status !== 'approved' && (
                      <button
                        onClick={() => handleApprove(r.id)}
                        style={btnApprove}
                      >
                        Approve
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button
                        onClick={() => handleReject(r.id)}
                        style={btnReject}
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const btnApprove = { background: '#4aba6e', color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.3rem 0.7rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' };
const btnReject  = { background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.3rem 0.7rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' };
