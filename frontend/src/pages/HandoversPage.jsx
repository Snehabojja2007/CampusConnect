import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Handshake, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { handoversApi } from '../api/handoversApi';
import AlertBanner from '../components/AlertBanner';
import StatusTag from '../components/StatusTag';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { extractErrorMessage, formatDateTime } from '../utils/formatters';

export default function HandoversPage() {
  const { user } = useAuth();
  const canComplete = user?.role === 'SECURITY' || user?.role === 'ADMIN';

  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [completingId, setCompletingId] = useState(null);

  const fetchHandovers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await handoversApi.getMyHandovers();
      setHandovers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load handovers.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHandovers();
  }, [fetchHandovers]);

  const handleComplete = async (handoverId) => {
    try {
      setCompletingId(handoverId);
      await handoversApi.completeHandover(handoverId);
      setFeedback({ type: 'success', message: `Handover #${handoverId} marked as completed.` });
      fetchHandovers();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Failed to complete handover.'),
      });
    } finally {
      setCompletingId(null);
    }
  };

  const filtered =
    statusFilter === 'ALL' ? handovers : handovers.filter((h) => h.status === statusFilter);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Handovers</h1>
          <p className="page-description">
            {user?.role === 'STUDENT'
              ? 'View handovers scheduled for your approved claims and confirm completion status.'
              : 'Track and complete handovers you have initiated for approved claims.'}
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={fetchHandovers} disabled={loading}>
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      <AlertBanner
        type={feedback.type || 'info'}
        message={feedback.message}
        onClose={() => setFeedback({ type: '', message: '' })}
      />
      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      <section className="panel">
        <div className="panel-header">
          <div className="tabs" role="tablist" aria-label="Filter handovers by status">
            {['ALL', 'PENDING', 'COMPLETED'].map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab}
                className={`tab-btn ${statusFilter === tab ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab)}
              >
                {tab === 'ALL' ? 'All Handovers' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <span className="meta-line tabular-nums">{filtered.length} handover(s)</span>
        </div>

        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title="No handovers scheduled"
            description="Handovers appear here once a Security officer or Admin creates a handover for an approved claim."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Handover ID</th>
                  <th>Item</th>
                  <th>Claim ID</th>
                  <th>Student</th>
                  <th>Security Officer</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Completed</th>
                  {canComplete && <th className="text-right">Action</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => (
                  <tr key={h.id}>
                    <td className="mono">#{h.id}</td>
                    <td style={{ fontWeight: 600 }}>
                      {h.claim?.foundItem?.title || `Claim #${h.claim?.id || '—'}`}
                    </td>
                    <td className="mono">#{h.claim?.id || '—'}</td>
                    <td>{h.student?.name || h.student?.email || '—'}</td>
                    <td>{h.securityUser?.name || h.securityUser?.email || '—'}</td>
                    <td>
                      <StatusTag status={h.status} />
                    </td>
                    <td className="tabular-nums">{formatDateTime(h.createdAt)}</td>
                    <td className="tabular-nums">{formatDateTime(h.completedAt)}</td>
                    {canComplete && (
                      <td className="text-right">
                        <div className="cell-actions">
                          {h.status === 'PENDING' ? (
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              disabled={completingId === h.id}
                              onClick={() => handleComplete(h.id)}
                            >
                              <CheckCircle2 size={14} />
                              <span>
                                {completingId === h.id ? 'Completing...' : 'Complete'}
                              </span>
                            </button>
                          ) : (
                            <span className="meta-line">Finalized</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
