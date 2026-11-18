import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Sparkles, Pencil, Trash2, SearchX, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { lostItemsApi } from '../api/lostItemsApi';
import { matchesApi } from '../api/matchesApi';
import { claimsApi } from '../api/claimsApi';
import AlertBanner from '../components/AlertBanner';
import StatusTag from '../components/StatusTag';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ItemFormModal from '../components/ItemFormModal';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { extractErrorMessage, formatDate, formatDateTime } from '../utils/formatters';

export default function LostItemsPage() {
  const { user } = useAuth();

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [filters, setFilters] = useState({ title: '', location: '' });
  const [appliedFilters, setAppliedFilters] = useState({ title: '', location: '' });
  const [ownershipFilter, setOwnershipFilter] = useState('ALL'); // 'ALL' | 'MINE'
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [formModal, setFormModal] = useState({ open: false, mode: 'create', item: null });
  const [detailItem, setDetailItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [matchModal, setMatchModal] = useState({
    open: false,
    lostItem: null,
    loading: false,
    matches: [],
    error: '',
  });
  const [claimingId, setClaimingId] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await lostItemsApi.getLostItems({
        title: appliedFilters.title,
        location: appliedFilters.location,
        page,
        size,
      });
      setPageData(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load lost items.'));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters.location, appliedFilters.title, page, size]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setAppliedFilters({ ...filters });
  };

  const handleResetFilters = () => {
    setFilters({ title: '', location: '' });
    setAppliedFilters({ title: '', location: '' });
    setOwnershipFilter('ALL');
    setPage(0);
  };

  const handleCreateOrUpdate = async (payload) => {
    if (formModal.mode === 'edit' && formModal.item) {
      await lostItemsApi.updateLostItem(formModal.item.id, payload);
      setFeedback({ type: 'success', message: 'Lost item report updated successfully.' });
    } else {
      await lostItemsApi.createLostItem(payload);
      setFeedback({
        type: 'success',
        message: 'Lost item report submitted. It will appear here once approved by an admin.',
      });
    }
    fetchItems();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await lostItemsApi.deleteLostItem(deleteTarget.id);
      setDeleteTarget(null);
      setFeedback({ type: 'success', message: 'Lost item report deleted.' });
      fetchItems();
    } catch (err) {
      setFeedback({ type: 'error', message: extractErrorMessage(err, 'Could not delete item.') });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleFindMatches = async (lostItem) => {
    setMatchModal({ open: true, lostItem, loading: true, matches: [], error: '' });
    try {
      const results = await matchesApi.findMatches(lostItem.id);
      setMatchModal((prev) => ({ ...prev, loading: false, matches: results || [] }));
    } catch (err) {
      setMatchModal((prev) => ({
        ...prev,
        loading: false,
        error: extractErrorMessage(err, 'Failed to find matching found items.'),
      }));
    }
  };

  const handleClaimFromMatch = async (foundItemId) => {
    try {
      setClaimingId(foundItemId);
      await claimsApi.createClaim(foundItemId);
      setFeedback({
        type: 'success',
        message: `Claim submitted for Found Item #${foundItemId}. Track progress under My Claims.`,
      });
      setMatchModal((prev) => ({ ...prev, open: false }));
    } catch (err) {
      setMatchModal((prev) => ({
        ...prev,
        error: extractErrorMessage(err, 'Failed to submit claim.'),
      }));
    } finally {
      setClaimingId(null);
    }
  };

  const isOwnerOf = (item) =>
    (item.user?.email && item.user.email === user?.email) ||
    (item.user?.id && item.user.id === user?.id);

  const rawItems = pageData?.content || [];
  const items = ownershipFilter === 'MINE' ? rawItems.filter(isOwnerOf) : rawItems;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Lost Items Registry</h1>
          <p className="page-description">
            Search approved lost-item reports, manage your own submissions, or run automated
            matching against approved found items.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setFormModal({ open: true, mode: 'create', item: null })}
        >
          <Plus size={16} />
          <span>Report Lost Item</span>
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
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-wrap">
              <Search size={15} className="search-input-icon" />
              <input
                type="text"
                className="input search-input"
                placeholder="Search by item title..."
                value={filters.title}
                onChange={(e) => setFilters((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="search-input-wrap">
              <Search size={15} className="search-input-icon" />
              <input
                type="text"
                className="input search-input"
                placeholder="Filter by campus location..."
                value={filters.location}
                onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
            {(appliedFilters.title || appliedFilters.location || ownershipFilter !== 'ALL') && (
              <button type="button" className="btn btn-secondary" onClick={handleResetFilters}>
                Clear
              </button>
            )}
          </form>

          <div className="tabs" role="tablist" aria-label="Filter by ownership">
            <button
              type="button"
              role="tab"
              aria-selected={ownershipFilter === 'ALL'}
              className={`tab-btn ${ownershipFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setOwnershipFilter('ALL')}
            >
              All Approved
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={ownershipFilter === 'MINE'}
              className={`tab-btn ${ownershipFilter === 'MINE' ? 'active' : ''}`}
              onClick={() => setOwnershipFilter('MINE')}
            >
              Reported by Me
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No approved lost items found"
            description={
              ownershipFilter === 'MINE'
                ? 'None of the approved lost items on this page were reported by your account.'
                : appliedFilters.title || appliedFilters.location
                  ? 'Try clearing or broadening your search filters.'
                  : 'No approved lost item reports are currently listed.'
            }
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setFormModal({ open: true, mode: 'create', item: null })}
              >
                Report Lost Item
              </button>
            }
          />
        ) : (
          <>
            <div className="item-list">
              {items.map((item) => {
                const isOwner = isOwnerOf(item);

                return (
                  <article key={item.id} className="item-row">
                    <div className="item-row-main">
                      <div className="item-row-title-line">
                        <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          #{item.id}
                        </span>
                        <h3 className="item-row-title">{item.title}</h3>
                        <StatusTag status={item.status} />
                        <StatusTag status={item.moderationStatus} />
                      </div>
                      <p className="item-row-desc">{item.description}</p>
                      <div className="meta-line">
                        <span>Location: {item.location}</span>
                        <span className="meta-sep" aria-hidden="true">
                          ·
                        </span>
                        <span className="tabular-nums">Lost: {formatDate(item.lostDate)}</span>
                        {item.user?.name && (
                          <>
                            <span className="meta-sep" aria-hidden="true">
                              ·
                            </span>
                            <span>Reported by {item.user.name}</span>
                          </>
                        )}
                        <span className="meta-sep" aria-hidden="true">
                          ·
                        </span>
                        <span className="tabular-nums">Created {formatDateTime(item.createdAt)}</span>
                      </div>
                    </div>

                    <div className="item-row-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setDetailItem(item)}
                      >
                        <Eye size={14} />
                        <span>Details</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleFindMatches(item)}
                      >
                        <Sparkles size={14} />
                        <span>Find Matches</span>
                      </button>

                      {isOwner && (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setFormModal({ open: true, mode: 'edit', item })}
                          >
                            <Pencil size={14} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <Pagination
              pageData={pageData}
              onPageChange={(nextPage) => setPage(nextPage)}
              onSizeChange={(nextSize) => {
                setSize(nextSize);
                setPage(0);
              }}
            />
          </>
        )}
      </section>

      <ItemFormModal
        isOpen={formModal.open}
        mode={formModal.mode}
        itemType="lost"
        initialItem={formModal.item}
        onClose={() => setFormModal({ open: false, mode: 'create', item: null })}
        onSubmit={handleCreateOrUpdate}
      />

      <Modal
        isOpen={Boolean(detailItem)}
        title={`Lost Item #${detailItem?.id || ''}`}
        onClose={() => setDetailItem(null)}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setDetailItem(null)}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const target = detailItem;
                setDetailItem(null);
                handleFindMatches(target);
              }}
            >
              <Sparkles size={15} />
              <span>Find Matches</span>
            </button>
          </>
        }
      >
        {detailItem && (
          <div className="form-grid">
            <div className="item-row-title-line">
              <h3 style={{ fontSize: '18px' }}>{detailItem.title}</h3>
              <StatusTag status={detailItem.status} />
              <StatusTag status={detailItem.moderationStatus} />
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {detailItem.description}
            </p>
            <div className="form-row">
              <div>
                <div className="kpi-label">Location</div>
                <div style={{ marginTop: '4px', fontWeight: 500 }}>{detailItem.location}</div>
              </div>
              <div>
                <div className="kpi-label">Date Lost</div>
                <div className="tabular-nums" style={{ marginTop: '4px', fontWeight: 500 }}>
                  {formatDate(detailItem.lostDate)}
                </div>
              </div>
              <div>
                <div className="kpi-label">Reported By</div>
                <div style={{ marginTop: '4px' }}>
                  {detailItem.user?.name || 'Campus Member'}{' '}
                  {detailItem.user?.email ? `(${detailItem.user.email})` : ''}
                </div>
              </div>
              <div>
                <div className="kpi-label">Created At</div>
                <div className="tabular-nums" style={{ marginTop: '4px' }}>
                  {formatDateTime(detailItem.createdAt)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        title="Delete Lost Item Report"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Report'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to permanently delete{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget?.title}</strong>? This
          action cannot be undone.
        </p>
      </Modal>

      <Modal
        isOpen={matchModal.open}
        title={`Potential Matches for "${matchModal.lostItem?.title || ''}"`}
        onClose={() =>
          setMatchModal({ open: false, lostItem: null, loading: false, matches: [], error: '' })
        }
        wide
      >
        <AlertBanner
          type="error"
          message={matchModal.error}
          onClose={() => setMatchModal((prev) => ({ ...prev, error: '' }))}
        />

        {matchModal.loading ? (
          <LoadingSkeleton rows={3} />
        ) : matchModal.matches.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No matching found items yet"
            description="No approved found items scored above 0 for title, location, or date proximity."
          />
        ) : (
          <div>
            {matchModal.matches.map((match) => (
              <div key={match.foundItemId} className="match-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                  <div className="match-score-box">
                    <div className="match-score-num">{match.matchScore}%</div>
                    <div className="match-score-label">Score</div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="item-row-title">{match.foundItemTitle}</div>
                    <div className="meta-line" style={{ marginTop: '4px' }}>
                      <span className="mono">Found #{match.foundItemId}</span>
                      <span className="meta-sep" aria-hidden="true">
                        ·
                      </span>
                      <span>Found at: {match.foundItemLocation}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={claimingId === match.foundItemId}
                  onClick={() => handleClaimFromMatch(match.foundItemId)}
                >
                  {claimingId === match.foundItemId ? 'Submitting...' : 'Claim Found Item'}
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
