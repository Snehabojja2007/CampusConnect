import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Hand, Pencil, Trash2, PackageCheck, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { foundItemsApi } from '../api/foundItemsApi';
import { claimsApi } from '../api/claimsApi';
import AlertBanner from '../components/AlertBanner';
import StatusTag from '../components/StatusTag';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ItemFormModal from '../components/ItemFormModal';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { extractErrorMessage, formatDate, formatDateTime } from '../utils/formatters';

export default function FoundItemsPage() {
  const { user } = useAuth();

  const [pageData, setPageData] = useState(null);
  const [myClaimsByItemId, setMyClaimsByItemId] = useState({});
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

  const [claimTarget, setClaimTarget] = useState(null);
  const [claiming, setClaiming] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [data, myClaims] = await Promise.all([
        foundItemsApi.getFoundItems({
          title: appliedFilters.title,
          location: appliedFilters.location,
          page,
          size,
        }),
        claimsApi.getMyClaims().catch(() => []),
      ]);

      setPageData(data);

      const claimsMap = {};
      if (Array.isArray(myClaims)) {
        myClaims.forEach((claim) => {
          claimsMap[claim.foundItemId] = claim;
        });
      }
      setMyClaimsByItemId(claimsMap);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load found items.'));
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
      await foundItemsApi.updateFoundItem(formModal.item.id, payload);
      setFeedback({ type: 'success', message: 'Found item report updated successfully.' });
    } else {
      await foundItemsApi.createFoundItem(payload);
      setFeedback({
        type: 'success',
        message: 'Found item report submitted. It will be listed publicly once approved by an admin.',
      });
    }
    fetchItems();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await foundItemsApi.deleteFoundItem(deleteTarget.id);
      setDeleteTarget(null);
      setFeedback({ type: 'success', message: 'Found item report deleted.' });
      fetchItems();
    } catch (err) {
      setFeedback({ type: 'error', message: extractErrorMessage(err, 'Could not delete item.') });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmClaim = async () => {
    if (!claimTarget) return;
    try {
      setClaiming(true);
      await claimsApi.createClaim(claimTarget.id);
      setClaimTarget(null);
      setFeedback({
        type: 'success',
        message: 'Claim submitted! Security or Admin will review your claim shortly.',
      });
      fetchItems();
    } catch (err) {
      setFeedback({ type: 'error', message: extractErrorMessage(err, 'Could not submit claim.') });
      setClaimTarget(null);
    } finally {
      setClaiming(false);
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
          <h1 className="page-title">Found Items Registry</h1>
          <p className="page-description">
            Browse verified found items turned in on campus, report a newly found item, or submit an
            ownership claim.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setFormModal({ open: true, mode: 'create', item: null })}
        >
          <Plus size={16} />
          <span>Report Found Item</span>
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
            icon={PackageCheck}
            title="No approved found items listed"
            description={
              ownershipFilter === 'MINE'
                ? 'None of the approved found items on this page were reported by your account.'
                : appliedFilters.title || appliedFilters.location
                  ? 'Try clearing or adjusting your search filters.'
                  : 'No approved found items are currently in the registry.'
            }
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setFormModal({ open: true, mode: 'create', item: null })}
              >
                Report Found Item
              </button>
            }
          />
        ) : (
          <>
            <div className="item-list">
              {items.map((item) => {
                const isOwner = isOwnerOf(item);
                const isClaimed = item.status === 'CLAIMED';
                const existingClaim = myClaimsByItemId[item.id];

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
                        {existingClaim && (
                          <StatusTag
                            status={existingClaim.status}
                            label={`Your Claim: ${existingClaim.status}`}
                          />
                        )}
                      </div>
                      <p className="item-row-desc">{item.description}</p>
                      <div className="meta-line">
                        <span>Location: {item.location}</span>
                        <span className="meta-sep" aria-hidden="true">
                          ·
                        </span>
                        <span className="tabular-nums">Found: {formatDate(item.foundDate)}</span>
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

                      {!isClaimed && item.moderationStatus === 'APPROVED' && !existingClaim && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setClaimTarget(item)}
                        >
                          <Hand size={14} />
                          <span>Claim Item</span>
                        </button>
                      )}

                      {isOwner && !isClaimed && (
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
        itemType="found"
        initialItem={formModal.item}
        onClose={() => setFormModal({ open: false, mode: 'create', item: null })}
        onSubmit={handleCreateOrUpdate}
      />

      <Modal
        isOpen={Boolean(detailItem)}
        title={`Found Item #${detailItem?.id || ''}`}
        onClose={() => setDetailItem(null)}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setDetailItem(null)}>
              Close
            </button>
            {detailItem &&
              detailItem.status !== 'CLAIMED' &&
              detailItem.moderationStatus === 'APPROVED' &&
              !myClaimsByItemId[detailItem.id] && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const target = detailItem;
                    setDetailItem(null);
                    setClaimTarget(target);
                  }}
                >
                  <Hand size={15} />
                  <span>Claim Item</span>
                </button>
              )}
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
                <div className="kpi-label">Date Found</div>
                <div className="tabular-nums" style={{ marginTop: '4px', fontWeight: 500 }}>
                  {formatDate(detailItem.foundDate)}
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
        isOpen={Boolean(claimTarget)}
        title="Confirm Item Claim"
        onClose={() => setClaimTarget(null)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setClaimTarget(null)}
              disabled={claiming}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmClaim}
              disabled={claiming}
            >
              {claiming ? 'Submitting Claim...' : 'Submit Claim'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Submit an ownership claim for{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{claimTarget?.title}</strong> (Found at{' '}
          {claimTarget?.location})? Campus Security will review your request and notify you when
          approved.
        </p>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        title="Delete Found Item Report"
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
          Are you sure you want to delete{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget?.title}</strong>? Claimed
          items cannot be deleted.
        </p>
      </Modal>
    </>
  );
}
