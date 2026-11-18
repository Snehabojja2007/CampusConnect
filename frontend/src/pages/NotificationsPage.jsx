import { useCallback, useEffect, useState } from 'react';
import { Bell, Check, RefreshCw } from 'lucide-react';
import { notificationsApi } from '../api/notificationsApi';
import AlertBanner from '../components/AlertBanner';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { extractErrorMessage, formatDateTime, formatNotificationType } from '../utils/formatters';

export default function NotificationsPage() {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingId, setMarkingId] = useState(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificationsApi.getMyNotifications({ page, size });
      setPageData(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load notifications.'));
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      setMarkingId(notificationId);
      await notificationsApi.markAsRead(notificationId);
      setPageData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: (prev.content || []).map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        };
      });
      window.dispatchEvent(new CustomEvent('campusconnect:notifications-updated'));
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not mark notification as read.'));
    } finally {
      setMarkingId(null);
    }
  };

  const notifications = pageData?.content || [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-description">
            Stay updated on claim submissions, approvals, rejections, and handover progress.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={fetchNotifications}
          disabled={loading}
        >
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Inbox</h2>
          <span className="meta-line tabular-nums">
            {pageData?.totalElements ?? 0} total notification(s)
          </span>
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="Notifications appear here when claims are submitted, reviewed, or handed over."
          />
        ) : (
          <>
            <div>
              {notifications.map((notif) => (
                <div key={notif.id} className={`notif-row ${!notif.read ? 'unread' : ''}`}>
                  <div style={{ minWidth: 0 }}>
                    <div className="meta-line">
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatNotificationType(notif.type)}
                      </span>
                      <span className="meta-sep" aria-hidden="true">
                        ·
                      </span>
                      <span className="tabular-nums">{formatDateTime(notif.createdAt)}</span>
                      <span className="meta-sep" aria-hidden="true">
                        ·
                      </span>
                      <span>{notif.read ? 'Read' : 'Unread'}</span>
                    </div>
                    <p className="notif-message">{notif.message}</p>
                  </div>

                  {!notif.read && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={markingId === notif.id}
                      onClick={() => handleMarkAsRead(notif.id)}
                    >
                      <Check size={14} />
                      <span>{markingId === notif.id ? 'Saving...' : 'Mark as Read'}</span>
                    </button>
                  )}
                </div>
              ))}
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
    </>
  );
}
