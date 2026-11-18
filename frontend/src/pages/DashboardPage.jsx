import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { lostItemsApi } from '../api/lostItemsApi';
import { foundItemsApi } from '../api/foundItemsApi';
import { claimsApi } from '../api/claimsApi';
import { handoversApi } from '../api/handoversApi';
import { notificationsApi } from '../api/notificationsApi';
import { adminApi } from '../api/adminApi';
import AlertBanner from '../components/AlertBanner';
import StatusTag from '../components/StatusTag';
import LoadingSkeleton from '../components/LoadingSkeleton';
import {
  extractErrorMessage,
  formatDate,
  formatDateTime,
  formatNotificationType,
} from '../utils/formatters';

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';
  const isAdmin = role === 'ADMIN';
  const isSecurity = role === 'SECURITY';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [completingHandoverId, setCompletingHandoverId] = useState(null);

  const [summary, setSummary] = useState({
    lostTotal: 0,
    foundTotal: 0,
    myClaims: [],
    myHandovers: [],
    recentLost: [],
    recentFound: [],
    recentNotifications: [],
    adminPendingLost: [],
    adminPendingFound: [],
    adminClaims: [],
    adminUsers: [],
    adminHandovers: [],
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const baseRequests = [
        lostItemsApi.getLostItems({ page: 0, size: 5 }),
        foundItemsApi.getFoundItems({ page: 0, size: 5 }),
        claimsApi.getMyClaims(),
        handoversApi.getMyHandovers(),
        notificationsApi.getMyNotifications({ page: 0, size: 8 }),
      ];

      if (isAdmin) {
        baseRequests.push(
          adminApi.getPendingLostItems(),
          adminApi.getPendingFoundItems(),
          adminApi.getAllClaims(),
          adminApi.getAllUsers(),
          adminApi.getAllHandovers()
        );
      }

      const [
        lostPage,
        foundPage,
        myClaims,
        myHandovers,
        notifPage,
        pendingLost,
        pendingFound,
        allClaims,
        allUsers,
        allHandovers,
      ] = await Promise.all(baseRequests);

      setSummary({
        lostTotal: lostPage?.totalElements || 0,
        foundTotal: foundPage?.totalElements || 0,
        myClaims: Array.isArray(myClaims) ? myClaims : [],
        myHandovers: Array.isArray(myHandovers) ? myHandovers : [],
        recentLost: lostPage?.content || [],
        recentFound: foundPage?.content || [],
        recentNotifications: notifPage?.content || [],
        adminPendingLost: Array.isArray(pendingLost) ? pendingLost : [],
        adminPendingFound: Array.isArray(pendingFound) ? pendingFound : [],
        adminClaims: Array.isArray(allClaims) ? allClaims : [],
        adminUsers: Array.isArray(allUsers) ? allUsers : [],
        adminHandovers: Array.isArray(allHandovers) ? allHandovers : [],
      });
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load dashboard data from backend.'));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleCompleteHandover = async (handoverId) => {
    try {
      setCompletingHandoverId(handoverId);
      await handoversApi.completeHandover(handoverId);
      setActionMessage(`Handover #${handoverId} marked as completed.`);
      loadDashboard();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not complete handover.'));
    } finally {
      setCompletingHandoverId(null);
    }
  };

  const pendingMyHandovers = summary.myHandovers.filter((h) => h.status === 'PENDING');
  const completedMyHandovers = summary.myHandovers.filter((h) => h.status === 'COMPLETED');
  const pendingClaimsCount = summary.myClaims.filter((c) => c.status === 'PENDING').length;
  const approvedClaimsCount = summary.myClaims.filter((c) => c.status === 'APPROVED').length;
  const claimSubmittedNotifs = summary.recentNotifications.filter(
    (n) => n.type === 'CLAIM_SUBMITTED'
  );

  const totalPendingModeration =
    summary.adminPendingLost.length + summary.adminPendingFound.length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isAdmin
              ? `Admin Dashboard — ${user?.name || 'Administrator'}`
              : isSecurity
                ? `Security Desk Overview — ${user?.name || 'Officer'}`
                : `Welcome back, ${user?.name || 'Student'}`}
          </h1>
          <p className="page-description">
            {isAdmin
              ? 'System-wide moderation queue, claims oversight, handovers, and user directory summary.'
              : isSecurity
                ? 'Active handovers assigned to your desk, incoming claim alerts, and approved item registries.'
                : 'Live overview of approved campus lost and found reports, your claims, and scheduled handovers.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadDashboard}
            disabled={loading}
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          {isAdmin ? (
            <Link to="/admin" className="btn btn-primary">
              Open Admin Console
            </Link>
          ) : isSecurity ? (
            <Link to="/security" className="btn btn-primary">
              Open Security Desk
            </Link>
          ) : (
            <Link to="/lost-items" className="btn btn-primary">
              Browse Lost Items
            </Link>
          )}
        </div>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />
      <AlertBanner
        type="success"
        message={actionMessage}
        onClose={() => setActionMessage('')}
      />

      {isAdmin && totalPendingModeration > 0 && (
        <AlertBanner
          type="warning"
          message={`Moderation queue has ${summary.adminPendingLost.length} pending lost item(s) and ${summary.adminPendingFound.length} pending found item(s) awaiting review.`}
        />
      )}

      {/* Role-Specific KPI Strip */}
      {isAdmin ? (
        <div className="kpi-grid">
          <div className="kpi-tile">
            <div className="kpi-label">Pending Moderation</div>
            <div className="kpi-value">{loading ? '—' : totalPendingModeration}</div>
            <div className="kpi-foot">
              {summary.adminPendingLost.length} lost · {summary.adminPendingFound.length} found
            </div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">System Claims</div>
            <div className="kpi-value">{loading ? '—' : summary.adminClaims.length}</div>
            <div className="kpi-foot">
              {summary.adminClaims.filter((c) => c.status === 'PENDING').length} pending review
            </div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">System Handovers</div>
            <div className="kpi-value">{loading ? '—' : summary.adminHandovers.length}</div>
            <div className="kpi-foot">
              {summary.adminHandovers.filter((h) => h.status === 'PENDING').length} pending pickup
            </div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">Registered Users</div>
            <div className="kpi-value">{loading ? '—' : summary.adminUsers.length}</div>
            <div className="kpi-foot">
              {summary.adminUsers.filter((u) => u.active).length} active accounts
            </div>
          </div>
        </div>
      ) : isSecurity ? (
        <div className="kpi-grid">
          <div className="kpi-tile">
            <div className="kpi-label">Pending Handovers</div>
            <div className="kpi-value">{loading ? '—' : pendingMyHandovers.length}</div>
            <div className="kpi-foot">Awaiting student collection</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">Completed Handovers</div>
            <div className="kpi-value">{loading ? '—' : completedMyHandovers.length}</div>
            <div className="kpi-foot">Finalized by your account</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">Claim Alerts</div>
            <div className="kpi-value">{loading ? '—' : claimSubmittedNotifs.length}</div>
            <div className="kpi-foot">Recent claim notifications</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">Approved Found Items</div>
            <div className="kpi-value">{loading ? '—' : summary.foundTotal}</div>
            <div className="kpi-foot">{summary.lostTotal} approved lost items</div>
          </div>
        </div>
      ) : (
        <div className="kpi-grid">
          <div className="kpi-tile">
            <div className="kpi-label">Approved Lost Items</div>
            <div className="kpi-value">{loading ? '—' : summary.lostTotal}</div>
            <div className="kpi-foot">Searchable lost reports</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">Approved Found Items</div>
            <div className="kpi-value">{loading ? '—' : summary.foundTotal}</div>
            <div className="kpi-foot">Available or claimed items</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">My Claims</div>
            <div className="kpi-value">{loading ? '—' : summary.myClaims.length}</div>
            <div className="kpi-foot">
              {pendingClaimsCount} pending · {approvedClaimsCount} approved
            </div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">My Handovers</div>
            <div className="kpi-value">{loading ? '—' : summary.myHandovers.length}</div>
            <div className="kpi-foot">{pendingMyHandovers.length} pending pickup</div>
          </div>
        </div>
      )}

      {/* Security Role Active Handovers Panel */}
      {isSecurity && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Pending Handovers at Your Desk</h2>
              <p className="panel-subtitle">Complete scheduled handovers once the student collects the item</p>
            </div>
            <Link to="/security" className="btn btn-ghost btn-sm">
              <span>Security Desk</span>
              <ArrowRight size={15} />
            </Link>
          </div>
          {loading ? (
            <LoadingSkeleton rows={3} />
          ) : pendingMyHandovers.length === 0 ? (
            <div className="panel-body">
              <p className="panel-subtitle">No pending handovers right now. Create one from an approved claim in Security Desk.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Handover ID</th>
                    <th>Item</th>
                    <th>Student</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingMyHandovers.map((h) => (
                    <tr key={h.id}>
                      <td className="mono">#{h.id}</td>
                      <td style={{ fontWeight: 600 }}>{h.claim?.foundItem?.title || '—'}</td>
                      <td>{h.student?.name || h.student?.email || '—'}</td>
                      <td>
                        <StatusTag status={h.status} />
                      </td>
                      <td className="tabular-nums">{formatDateTime(h.createdAt)}</td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          disabled={completingHandoverId === h.id}
                          onClick={() => handleCompleteHandover(h.id)}
                        >
                          {completingHandoverId === h.id ? 'Completing...' : 'Complete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <div className="two-col-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Recent Approved Lost Items</h2>
              <p className="panel-subtitle">Latest reports awaiting recovery</p>
            </div>
            <Link to="/lost-items" className="btn btn-ghost btn-sm">
              <span>View all</span>
              <ArrowRight size={15} />
            </Link>
          </div>
          {loading ? (
            <LoadingSkeleton rows={3} />
          ) : summary.recentLost.length === 0 ? (
            <div className="panel-body">
              <p className="panel-subtitle">No approved lost items recorded yet.</p>
            </div>
          ) : (
            <div className="item-list">
              {summary.recentLost.map((item) => (
                <div key={item.id} className="item-row">
                  <div className="item-row-main">
                    <div className="item-row-title-line">
                      <span className="item-row-title">{item.title}</span>
                      <StatusTag status={item.status} />
                    </div>
                    <div className="meta-line">
                      <span>{item.location}</span>
                      <span className="meta-sep" aria-hidden="true">
                        ·
                      </span>
                      <span className="tabular-nums">Lost {formatDate(item.lostDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Recent Approved Found Items</h2>
              <p className="panel-subtitle">Verified items turned in across campus</p>
            </div>
            <Link to="/found-items" className="btn btn-ghost btn-sm">
              <span>View all</span>
              <ArrowRight size={15} />
            </Link>
          </div>
          {loading ? (
            <LoadingSkeleton rows={3} />
          ) : summary.recentFound.length === 0 ? (
            <div className="panel-body">
              <p className="panel-subtitle">No approved found items recorded yet.</p>
            </div>
          ) : (
            <div className="item-list">
              {summary.recentFound.map((item) => (
                <div key={item.id} className="item-row">
                  <div className="item-row-main">
                    <div className="item-row-title-line">
                      <span className="item-row-title">{item.title}</span>
                      <StatusTag status={item.status} />
                    </div>
                    <div className="meta-line">
                      <span>{item.location}</span>
                      <span className="meta-sep" aria-hidden="true">
                        ·
                      </span>
                      <span className="tabular-nums">Found {formatDate(item.foundDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Recent Notifications</h2>
            <p className="panel-subtitle">Real-time updates from claims and handovers</p>
          </div>
          <Link to="/notifications" className="btn btn-ghost btn-sm">
            <span>Open inbox</span>
            <ArrowRight size={15} />
          </Link>
        </div>
        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : summary.recentNotifications.length === 0 ? (
          <div className="panel-body">
            <p className="panel-subtitle">You have no notifications yet.</p>
          </div>
        ) : (
          <div>
            {summary.recentNotifications.slice(0, 5).map((notif) => (
              <div key={notif.id} className={`notif-row ${!notif.read ? 'unread' : ''}`}>
                <div>
                  <div className="meta-line">
                    <span>{formatNotificationType(notif.type)}</span>
                    <span className="meta-sep" aria-hidden="true">
                      ·
                    </span>
                    <span className="tabular-nums">{formatDateTime(notif.createdAt)}</span>
                    {!notif.read && (
                      <>
                        <span className="meta-sep" aria-hidden="true">
                          ·
                        </span>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                          Unread
                        </span>
                      </>
                    )}
                  </div>
                  <p className="notif-message">{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
