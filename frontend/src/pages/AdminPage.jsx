import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search, Settings2 } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { claimsApi } from '../api/claimsApi';
import { handoversApi } from '../api/handoversApi';
import AlertBanner from '../components/AlertBanner';
import StatusTag from '../components/StatusTag';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { extractErrorMessage, formatDate, formatDateTime } from '../utils/formatters';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('moderation');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [busyKey, setBusyKey] = useState('');

  const [itemSearch, setItemSearch] = useState('');
  const [itemModFilter, setItemModFilter] = useState('ALL');
  const [claimStatusFilter, setClaimStatusFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  const [data, setData] = useState({
    pendingLost: [],
    pendingFound: [],
    allLost: [],
    allFound: [],
    claims: [],
    handovers: [],
    users: [],
  });

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingLost, pendingFound, allLost, allFound, claims, handovers, users] =
        await Promise.all([
          adminApi.getPendingLostItems(),
          adminApi.getPendingFoundItems(),
          adminApi.getAllLostItems(),
          adminApi.getAllFoundItems(),
          adminApi.getAllClaims(),
          adminApi.getAllHandovers(),
          adminApi.getAllUsers(),
        ]);

      setData({
        pendingLost: Array.isArray(pendingLost) ? pendingLost : [],
        pendingFound: Array.isArray(pendingFound) ? pendingFound : [],
        allLost: Array.isArray(allLost) ? allLost : [],
        allFound: Array.isArray(allFound) ? allFound : [],
        claims: Array.isArray(claims) ? claims : [],
        handovers: Array.isArray(handovers) ? handovers : [],
        users: Array.isArray(users) ? users : [],
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Failed to load admin management data.'),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleModerateLost = async (itemId, moderationStatus) => {
    try {
      setBusyKey(`mod-lost-${itemId}`);
      await adminApi.moderateLostItem(itemId, moderationStatus);
      setFeedback({
        type: 'success',
        message: `Lost Item #${itemId} ${moderationStatus.toLowerCase()}.`,
      });
      loadAdminData();
    } catch (err) {
      setFeedback({ type: 'error', message: extractErrorMessage(err, 'Moderation failed.') });
    } finally {
      setBusyKey('');
    }
  };

  const handleModerateFound = async (itemId, moderationStatus) => {
    try {
      setBusyKey(`mod-found-${itemId}`);
      await adminApi.moderateFoundItem(itemId, moderationStatus);
      setFeedback({
        type: 'success',
        message: `Found Item #${itemId} ${moderationStatus.toLowerCase()}.`,
      });
      loadAdminData();
    } catch (err) {
      setFeedback({ type: 'error', message: extractErrorMessage(err, 'Moderation failed.') });
    } finally {
      setBusyKey('');
    }
  };

  const handleClaimAction = async (claimId, status) => {
    try {
      setBusyKey(`claim-${claimId}`);
      await claimsApi.updateClaimStatus(claimId, status);
      setFeedback({ type: 'success', message: `Claim #${claimId} marked ${status.toLowerCase()}.` });
      loadAdminData();
    } catch (err) {
      setFeedback({ type: 'error', message: extractErrorMessage(err, 'Claim update failed.') });
    } finally {
      setBusyKey('');
    }
  };

  const handleCreateHandover = async (claimId) => {
    try {
      setBusyKey(`ho-create-${claimId}`);
      await handoversApi.createHandover(claimId);
      setFeedback({ type: 'success', message: `Handover created for Claim #${claimId}.` });
      loadAdminData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Could not create handover.'),
      });
    } finally {
      setBusyKey('');
    }
  };

  const handleCompleteHandover = async (handoverId) => {
    try {
      setBusyKey(`ho-done-${handoverId}`);
      await handoversApi.completeHandover(handoverId);
      setFeedback({ type: 'success', message: `Handover #${handoverId} completed.` });
      loadAdminData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Could not complete handover.'),
      });
    } finally {
      setBusyKey('');
    }
  };

  const handleToggleUserStatus = async (userRecord) => {
    try {
      setBusyKey(`user-${userRecord.id}`);
      const nextActive = !userRecord.active;
      await adminApi.updateUserStatus(userRecord.id, nextActive);
      setFeedback({
        type: 'success',
        message: `${userRecord.name} is now ${nextActive ? 'active' : 'inactive'}.`,
      });
      loadAdminData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Could not update user status.'),
      });
    } finally {
      setBusyKey('');
    }
  };

  const totalPending = data.pendingLost.length + data.pendingFound.length;

  const filterItem = (item) => {
    const matchesStatus = itemModFilter === 'ALL' || item.moderationStatus === itemModFilter;
    const q = itemSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.title?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q) ||
      item.user?.name?.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  };

  const filteredLost = data.allLost.filter(filterItem);
  const filteredFound = data.allFound.filter(filterItem);
  const filteredClaims =
    claimStatusFilter === 'ALL'
      ? data.claims
      : data.claims.filter((c) => c.status === claimStatusFilter);

  const filteredUsers = data.users.filter((u) => {
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const q = userSearch.trim().toLowerCase();
    const matchesQuery =
      !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Console</h1>
          <p className="page-description">
            Moderate pending item submissions, review system-wide claims and handovers, and manage
            campus user accounts.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={loadAdminData} disabled={loading}>
          <RefreshCw size={15} />
          <span>Refresh All</span>
        </button>
      </div>

      <AlertBanner
        type={feedback.type || 'info'}
        message={feedback.message}
        onClose={() => setFeedback({ type: '', message: '' })}
      />

      <div className="kpi-grid">
        <div className="kpi-tile">
          <div className="kpi-label">Pending Moderation</div>
          <div className="kpi-value">{loading ? '—' : totalPending}</div>
          <div className="kpi-foot">
            {data.pendingLost.length} lost · {data.pendingFound.length} found
          </div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Total Items</div>
          <div className="kpi-value">
            {loading ? '—' : data.allLost.length + data.allFound.length}
          </div>
          <div className="kpi-foot">
            {data.allLost.length} lost · {data.allFound.length} found
          </div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Total Claims</div>
          <div className="kpi-value">{loading ? '—' : data.claims.length}</div>
          <div className="kpi-foot">
            {data.claims.filter((c) => c.status === 'PENDING').length} pending review
          </div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Registered Users</div>
          <div className="kpi-value">{loading ? '—' : data.users.length}</div>
          <div className="kpi-foot">
            {data.users.filter((u) => u.active).length} active accounts
          </div>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Admin management sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'moderation'}
          className={`tab-btn ${activeTab === 'moderation' ? 'active' : ''}`}
          onClick={() => setActiveTab('moderation')}
        >
          Pending Moderation ({totalPending})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'items'}
          className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          All Lost &amp; Found
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'claims'}
          className={`tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
          onClick={() => setActiveTab('claims')}
        >
          Claims &amp; Handovers
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'users'}
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({data.users.length})
        </button>
      </div>

      {loading ? (
        <section className="panel">
          <LoadingSkeleton rows={5} />
        </section>
      ) : (
        <>
          {activeTab === 'moderation' && (
            <div className="two-col-grid">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Pending Lost Items</h2>
                    <p className="panel-subtitle">Approve or reject before public listing</p>
                  </div>
                </div>
                {data.pendingLost.length === 0 ? (
                  <EmptyState
                    icon={Settings2}
                    title="No pending lost items"
                    description="All lost item submissions have been moderated."
                  />
                ) : (
                  <div className="item-list">
                    {data.pendingLost.map((item) => (
                      <div key={item.id} className="item-row">
                        <div className="item-row-main">
                          <div className="item-row-title-line">
                            <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              #{item.id}
                            </span>
                            <span className="item-row-title">{item.title}</span>
                          </div>
                          <p className="item-row-desc">{item.description}</p>
                          <div className="meta-line">
                            <span>{item.location}</span>
                            <span className="meta-sep">·</span>
                            <span>{formatDate(item.lostDate)}</span>
                            {item.user?.name && (
                              <>
                                <span className="meta-sep">·</span>
                                <span>{item.user.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="item-row-actions">
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            disabled={busyKey === `mod-lost-${item.id}`}
                            onClick={() => handleModerateLost(item.id, 'APPROVED')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={busyKey === `mod-lost-${item.id}`}
                            onClick={() => handleModerateLost(item.id, 'REJECTED')}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Pending Found Items</h2>
                    <p className="panel-subtitle">Approve to allow claims and matching</p>
                  </div>
                </div>
                {data.pendingFound.length === 0 ? (
                  <EmptyState
                    icon={Settings2}
                    title="No pending found items"
                    description="All found item submissions have been moderated."
                  />
                ) : (
                  <div className="item-list">
                    {data.pendingFound.map((item) => (
                      <div key={item.id} className="item-row">
                        <div className="item-row-main">
                          <div className="item-row-title-line">
                            <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              #{item.id}
                            </span>
                            <span className="item-row-title">{item.title}</span>
                          </div>
                          <p className="item-row-desc">{item.description}</p>
                          <div className="meta-line">
                            <span>{item.location}</span>
                            <span className="meta-sep">·</span>
                            <span>{formatDate(item.foundDate)}</span>
                            {item.user?.name && (
                              <>
                                <span className="meta-sep">·</span>
                                <span>{item.user.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="item-row-actions">
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            disabled={busyKey === `mod-found-${item.id}`}
                            onClick={() => handleModerateFound(item.id, 'APPROVED')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={busyKey === `mod-found-${item.id}`}
                            onClick={() => handleModerateFound(item.id, 'REJECTED')}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'items' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <section className="panel">
                <div className="panel-header">
                  <div className="search-form">
                    <div className="search-input-wrap">
                      <Search size={15} className="search-input-icon" />
                      <input
                        type="text"
                        className="input search-input"
                        placeholder="Filter items by title, location, or reporter..."
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="tabs" role="tablist" aria-label="Filter items by moderation status">
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        role="tab"
                        aria-selected={itemModFilter === status}
                        className={`tab-btn ${itemModFilter === status ? 'active' : ''}`}
                        onClick={() => setItemModFilter(status)}
                      >
                        {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">All Lost Items ({filteredLost.length})</h2>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Location</th>
                        <th>Lost Date</th>
                        <th>Reporter</th>
                        <th>Moderation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLost.map((item) => (
                        <tr key={item.id}>
                          <td className="mono">#{item.id}</td>
                          <td style={{ fontWeight: 600 }}>{item.title}</td>
                          <td>{item.location}</td>
                          <td className="tabular-nums">{formatDate(item.lostDate)}</td>
                          <td>{item.user?.name || item.user?.email || '—'}</td>
                          <td>
                            <StatusTag status={item.moderationStatus} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">All Found Items ({filteredFound.length})</h2>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Location</th>
                        <th>Found Date</th>
                        <th>Item Status</th>
                        <th>Moderation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFound.map((item) => (
                        <tr key={item.id}>
                          <td className="mono">#{item.id}</td>
                          <td style={{ fontWeight: 600 }}>{item.title}</td>
                          <td>{item.location}</td>
                          <td className="tabular-nums">{formatDate(item.foundDate)}</td>
                          <td>
                            <StatusTag status={item.status} />
                          </td>
                          <td>
                            <StatusTag status={item.moderationStatus} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'claims' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <section className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">All Claims ({filteredClaims.length})</h2>
                  <div className="tabs" role="tablist" aria-label="Filter claims">
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        role="tab"
                        aria-selected={claimStatusFilter === status}
                        className={`tab-btn ${claimStatusFilter === status ? 'active' : ''}`}
                        onClick={() => setClaimStatusFilter(status)}
                      >
                        {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Claim ID</th>
                        <th>Found Item</th>
                        <th>Claimant</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClaims.map((claim) => (
                        <tr key={claim.id}>
                          <td className="mono">#{claim.id}</td>
                          <td style={{ fontWeight: 600 }}>{claim.foundItem?.title || '—'}</td>
                          <td>{claim.user?.name || claim.user?.email || '—'}</td>
                          <td>
                            <StatusTag status={claim.status} />
                          </td>
                          <td className="tabular-nums">{formatDateTime(claim.createdAt)}</td>
                          <td className="text-right">
                            <div className="cell-actions">
                              {claim.status === 'PENDING' && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    disabled={busyKey === `claim-${claim.id}`}
                                    onClick={() => handleClaimAction(claim.id, 'APPROVED')}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    disabled={busyKey === `claim-${claim.id}`}
                                    onClick={() => handleClaimAction(claim.id, 'REJECTED')}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {claim.status === 'APPROVED' && (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  disabled={busyKey === `ho-create-${claim.id}`}
                                  onClick={() => handleCreateHandover(claim.id)}
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
              </section>

              <section className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">All Handovers ({data.handovers.length})</h2>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Handover ID</th>
                        <th>Item</th>
                        <th>Student</th>
                        <th>Security</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.handovers.map((h) => (
                        <tr key={h.id}>
                          <td className="mono">#{h.id}</td>
                          <td style={{ fontWeight: 600 }}>{h.claim?.foundItem?.title || '—'}</td>
                          <td>{h.student?.name || h.student?.email || '—'}</td>
                          <td>{h.securityUser?.name || h.securityUser?.email || '—'}</td>
                          <td>
                            <StatusTag status={h.status} />
                          </td>
                          <td className="tabular-nums">{formatDateTime(h.createdAt)}</td>
                          <td className="text-right">
                            {h.status === 'PENDING' ? (
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                disabled={busyKey === `ho-done-${h.id}`}
                                onClick={() => handleCompleteHandover(h.id)}
                              >
                                Complete
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
              </section>
            </div>
          )}

          {activeTab === 'users' && (
            <section className="panel">
              <div className="panel-header">
                <div className="search-form">
                  <div className="search-input-wrap">
                    <Search size={15} className="search-input-icon" />
                    <input
                      type="text"
                      className="input search-input"
                      placeholder="Search users by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="tabs" role="tablist" aria-label="Filter users by role">
                  {['ALL', 'STUDENT', 'SECURITY', 'ADMIN'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      role="tab"
                      aria-selected={userRoleFilter === role}
                      className={`tab-btn ${userRoleFilter === role ? 'active' : ''}`}
                      onClick={() => setUserRoleFilter(role)}
                    >
                      {role === 'ALL' ? 'All Roles' : role.charAt(0) + role.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th className="text-right">Account Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="mono">#{u.id}</td>
                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <StatusTag status={u.role} />
                        </td>
                        <td>
                          <StatusTag status={u.active ? 'ACTIVE' : 'INACTIVE'} />
                        </td>
                        <td className="tabular-nums">{formatDateTime(u.createdAt)}</td>
                        <td className="text-right">
                          <button
                            type="button"
                            className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-success'}`}
                            disabled={busyKey === `user-${u.id}`}
                            onClick={() => handleToggleUserStatus(u)}
                          >
                            {u.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
