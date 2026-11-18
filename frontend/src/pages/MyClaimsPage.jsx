import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { claimsApi } from '../api/claimsApi';
import AlertBanner from '../components/AlertBanner';
import StatusTag from '../components/StatusTag';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { extractErrorMessage, formatDateTime } from '../utils/formatters';

export default function MyClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await claimsApi.getMyClaims();
      setClaims(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load your claims.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const filteredClaims =
    statusFilter === 'ALL' ? claims : claims.filter((c) => c.status === statusFilter);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Claims</h1>
          <p className="page-description">
            Track the status of ownership claims you have submitted on approved found items.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={fetchClaims} disabled={loading}>
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <Link to="/found-items" className="btn btn-primary">
            Browse Found Items
          </Link>
        </div>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      <section className="panel">
        <div className="panel-header">
          <div className="tabs" role="tablist" aria-label="Filter claims by status">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab}
                className={`tab-btn ${statusFilter === tab ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab)}
              >
                {tab === 'ALL' ? 'All Claims' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <span className="meta-line tabular-nums">{filteredClaims.length} claim(s)</span>
        </div>

        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : filteredClaims.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No claims found"
            description={
              statusFilter === 'ALL'
                ? 'You have not submitted any item claims yet.'
                : `You have no ${statusFilter.toLowerCase()} claims.`
            }
            action={
              <Link to="/found-items" className="btn btn-primary">
                Browse Found Items
              </Link>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Found Item</th>
                  <th>Item ID</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td className="mono">#{claim.id}</td>
                    <td style={{ fontWeight: 600 }}>{claim.foundItemTitle}</td>
                    <td className="mono">#{claim.foundItemId}</td>
                    <td>
                      <StatusTag status={claim.status} />
                    </td>
                    <td className="tabular-nums">{formatDateTime(claim.createdAt)}</td>
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
