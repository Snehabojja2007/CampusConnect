import { useState } from 'react';
import { RefreshCw, Shield, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AlertBanner from '../components/AlertBanner';
import StatusTag from '../components/StatusTag';
import { extractErrorMessage, formatDateTime } from '../utils/formatters';

const ROLE_CAPABILITIES = {
  STUDENT: [
    'Report lost and found items for administrator moderation',
    'Search approved campus lost and found item registries',
    'Run automated matching on approved lost items',
    'Submit claims on approved found items and track handovers',
    'Receive and manage claim and handover notifications',
  ],
  SECURITY: [
    'All student lost/found reporting, matching, and notification capabilities',
    'Approve or reject pending ownership claims at the security desk',
    'Create handovers for approved claims',
    'Complete pending handovers and notify claimants',
  ],
  ADMIN: [
    'Full access to Student and Security workflows',
    'Moderate pending lost and found item submissions (Approve / Reject)',
    'View all lost items, found items, claims, and handovers system-wide',
    'Activate or deactivate user accounts in the User Directory',
  ],
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const handleSync = async () => {
    try {
      setSyncing(true);
      setFeedback({ type: '', message: '' });
      const updated = await refreshUser();
      if (updated) {
        setFeedback({ type: 'success', message: 'Profile synced with server.' });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: extractErrorMessage(err, 'Could not refresh profile from /api/users/me.'),
      });
    } finally {
      setSyncing(false);
    }
  };

  const capabilities = ROLE_CAPABILITIES[user?.role] || ROLE_CAPABILITIES.STUDENT;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-description">
            Account details retrieved from your CampusConnect JWT session and user directory record.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleSync} disabled={syncing}>
          <RefreshCw size={15} />
          <span>{syncing ? 'Syncing...' : 'Sync from Server'}</span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserCheck size={18} />
              <h2 className="panel-title">Account Information</h2>
            </div>
            <StatusTag status={user?.role} />
          </div>
          <div className="panel-body">
            <div className="form-grid">
              <div>
                <div className="kpi-label">User ID</div>
                <div className="mono" style={{ fontSize: '15px', marginTop: '4px' }}>
                  #{user?.id ?? '—'}
                </div>
              </div>
              <div>
                <div className="kpi-label">Full Name</div>
                <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>
                  {user?.name || '—'}
                </div>
              </div>
              <div>
                <div className="kpi-label">Email Address</div>
                <div style={{ fontSize: '15px', marginTop: '4px' }}>{user?.email || '—'}</div>
              </div>
              <div>
                <div className="kpi-label">Account Created</div>
                <div className="tabular-nums" style={{ fontSize: '14px', marginTop: '4px' }}>
                  {formatDateTime(user?.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={18} />
              <h2 className="panel-title">Role Permissions ({user?.role || 'USER'})</h2>
            </div>
          </div>
          <div className="panel-body">
            <ul
              style={{
                margin: 0,
                paddingLeft: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                color: 'var(--text-secondary)',
                fontSize: '14px',
              }}
            >
              {capabilities.map((cap) => (
                <li key={cap}>{cap}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
