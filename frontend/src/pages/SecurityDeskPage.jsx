import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { claimsApi } from '../api/claimsApi';
import { handoversApi } from '../api/handoversApi';
import { adminApi } from '../api/adminApi';
import { notificationsApi } from '../api/notificationsApi';
import AlertBanner from '../components/AlertBanner';
import StatusTag from '../components/StatusTag';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { extractErrorMessage, formatDateTime } from '../utils/formatters';

export default function SecurityDeskPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [claimIdInput, setClaimIdInput] = useState('');
  const [handoverClaimIdInput, setHandoverClaimIdInput] = useState('');
  const [submittingClaimAction, setSubmittingClaimAction] = useState(false);
  const [submittingHandover, setSubmittingHandover] = useState(false);

  const [handovers, setHandovers] = useState([]);
  const [adminClaims, setAdminClaims] = useState([]);
  const [claimNotifications, setClaimNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [actionBusyId, setActionBusyId] = useState(null);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    try {
      const myHandoversPromise = handoversApi.getMyHandovers();
      const extraPromise = isAdmin
        ? adminApi.getAllClaims()
        : notificationsApi.getMyNotifications({ page: 0, size: 20 });

      const [handoverList, extraData] = await Promise.all([myHandoversPromise, extraPromise]);
      setHandovers(Array.isArray(handoverList) ? handoverList : []);

      if (isAdmin) {
        setAdminClaims(Array.isArray(extraData) ? extraData : []);
      } else {
        const list = extraData?.content || [];
        setClaimNotifications(list.filter((n) => n.type === 'CLAIM_SUBMITTED'));
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Failed to load security desk data.'),
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const handleUpdateClaimStatus = async (targetClaimId, status) => {
    const parsedId = Number(targetClaimId);
    if (!parsedId || parsedId <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid numeric Claim ID.' });
      return;
    }

    try {
      setSubmittingClaimAction(true);
      setActionBusyId(`claim-${parsedId}`);
      const updated = await claimsApi.updateClaimStatus(parsedId, status);
      setFeedback({
        type: 'success',
        message: `Claim #${updated.id} (${updated.foundItemTitle}) marked as ${updated.status}.`,
      });
      setClaimIdInput('');
      loadWorkspace();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Could not update claim status.'),
      });
    } finally {
      setSubmittingClaimAction(false);
      setActionBusyId(null);
    }
  };

  const handleCreateHandover = async (targetClaimId) => {
    const parsedId = Number(targetClaimId);
    if (!parsedId || parsedId <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid numeric approved Claim ID.' });
      return;
    }

    try {
      setSubmittingHandover(true);
      setActionBusyId(`handover-${parsedId}`);
      const created = await handoversApi.createHandover(parsedId);
      setFeedback({
        type: 'success',
        message: `Handover #${created.id} created for Claim #${parsedId}.`,
      });
      setHandoverClaimIdInput('');
      loadWorkspace();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Failed to create handover.'),
      });
    } finally {
      setSubmittingHandover(false);
      setActionBusyId(null);
    }
  };

  const handleCompleteHandover = async (handoverId) => {
    try {
      setActionBusyId(`complete-${handoverId}`);
      await handoversApi.completeHandover(handoverId);
      setFeedback({
        type: 'success',
        message: `Handover #${handoverId} completed and student notified.`,
      });
      loadWorkspace();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Failed to complete handover.'),
      });
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Security Operations Desk</h1>
          <p className="page-description">
            Review claim decisions, initiate handovers for approved claims, and finalize item
            collection.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={loadWorkspace} disabled={loading}>
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      <AlertBanner
        type={feedback.type || 'info'}
        message={feedback.message}
        onClose={() => setFeedback({ type: '', message: '' })}
      />

      <div className="two-col-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Process Claim Decision</h2>
              <p className="panel-subtitle">Approve or reject a pending claim by ID</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="sec-claim-id">
                  Claim ID <span className="field-required">*</span>
                </label>
                <input
                  id="sec-claim-id"
                  type="number"
                  min="1"
                  className="input mono"
                  placeholder="Enter Claim ID (e.g., 12)"
                  value={claimIdInput}
                  onChange={(e) => setClaimIdInput(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={submittingClaimAction}
                  onClick={() => handleUpdateClaimStatus(claimIdInput, 'APPROVED')}
                >
                  <CheckCircle2 size={15} />
                  <span>Approve Claim</span>
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={submittingClaimAction}
                  onClick={() => handleUpdateClaimStatus(claimIdInput, 'REJECTED')}
                >
                  <XCircle size={15} />
                  <span>Reject Claim</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Create Handover</h2>
              <p className="panel-subtitle">Initiate handover for an approved claim</p>
            </div>
          </div>
          <div className="panel-body">
            <form
              className="form-grid"
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateHandover(handoverClaimIdInput);
              }}
            >
              <div className="field">
                <label className="field-label" htmlFor="sec-handover-claim-id">
                  Approved Claim ID <span className="field-required">*</span>
                </label>
                <input
                  id="sec-handover-claim-id"
                  type="number"
                  min="1"
                  className="input mono"
                  placeholder="Enter Approved Claim ID"
                  value={handoverClaimIdInput}
                  onChange={(e) => setHandoverClaimIdInput(e.target.value)}
                />
              </div>
              <div>
                <button type="submit" className="btn btn-primary" disabled={submittingHandover}>
                  <ShieldCheck size={15} />
                  <span>{submittingHandover ? 'Creating...' : 'Create Handover'}</span>
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      {isAdmin ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">All Claims Queue</h2>
              <p className="panel-subtitle">Direct claim actions available for Administrator accounts</p>
            </div>
          </div>
          {loading ? (
            <LoadingSkeleton rows={4} />
          ) : adminClaims.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No claims in queue"
              description="Submitted claims will appear here for review."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Found Item</th>
                    <th>Claimant</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminClaims.map((c) => (
                    <tr key={c.id}>
                      <td className="mono">#{c.id}</td>
                      <td style={{ fontWeight: 600 }}>{c.foundItem?.title || '—'}</td>
                      <td>{c.user?.name || c.user?.email || '—'}</td>
                      <td>
                        <StatusTag status={c.status} />
                      </td>
                      <td className="tabular-nums">{formatDateTime(c.createdAt)}</td>
                      <td className="text-right">
                        <div className="cell-actions">
                          {c.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                disabled={actionBusyId === `claim-${c.id}`}
                                onClick={() => handleUpdateClaimStatus(c.id, 'APPROVED')}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                disabled={actionBusyId === `claim-${c.id}`}
                                onClick={() => handleUpdateClaimStatus(c.id, 'REJECTED')}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {c.status === 'APPROVED' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={actionBusyId === `handover-${c.id}`}
                              onClick={() => handleCreateHandover(c.id)}
                            >
                              Create Handover
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Incoming Claim Alerts</h2>
              <p className="panel-subtitle">
                Recent claim submission notifications sent to your Security account
              </p>
            </div>
          </div>
          {loading ? (
            <LoadingSkeleton rows={3} />
          ) : claimNotifications.length === 0 ? (
            <div className="panel-body">
              <p className="panel-subtitle">No incoming claim notifications yet.</p>
            </div>
          ) : (
            <div>
              {claimNotifications.map((n) => (
                <div key={n.id} className="notif-row">
                  <div>
                    <div className="meta-line">
                      <span className="tabular-nums">{formatDateTime(n.createdAt)}</span>
                      <span className="meta-sep" aria-hidden="true">
                        ·
                      </span>
                      <span>{n.read ? 'Read' : 'Unread'}</span>
                    </div>
                    <p className="notif-message">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">My Managed Handovers</h2>
            <p className="panel-subtitle">Handovers initiated by your account</p>
          </div>
        </div>
        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : handovers.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No handovers initiated"
            description="Create a handover from an approved claim above to track collection."
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
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {handovers.map((h) => (
                  <tr key={h.id}>
                    <td className="mono">#{h.id}</td>
                    <td style={{ fontWeight: 600 }}>{h.claim?.foundItem?.title || '—'}</td>
                    <td className="mono">#{h.claim?.id || '—'}</td>
                    <td>{h.student?.name || h.student?.email || '—'}</td>
                    <td>
                      <StatusTag status={h.status} />
                    </td>
                    <td className="tabular-nums">{formatDateTime(h.createdAt)}</td>
                    <td className="text-right">
                      {h.status === 'PENDING' ? (
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          disabled={actionBusyId === `complete-${h.id}`}
                          onClick={() => handleCompleteHandover(h.id)}
                        >
                          {actionBusyId === `complete-${h.id}` ? 'Completing...' : 'Complete Handover'}
                        </button>
                      ) : (
                        <span className="meta-line">Completed</span>
                      )}
                    </td>
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
