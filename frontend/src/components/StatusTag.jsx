const STATUS_MAP = {
  APPROVED: { className: 'status-success', label: 'Approved' },
  COMPLETED: { className: 'status-success', label: 'Completed' },
  ACTIVE: { className: 'status-success', label: 'Active' },
  PENDING: { className: 'status-warning', label: 'Pending' },
  REJECTED: { className: 'status-danger', label: 'Rejected' },
  INACTIVE: { className: 'status-danger', label: 'Inactive' },
  LOST: { className: 'status-warning', label: 'Lost' },
  FOUND: { className: 'status-info', label: 'Found' },
  CLAIMED: { className: 'status-success', label: 'Claimed' },
  ADMIN: { className: 'status-info', label: 'Admin' },
  SECURITY: { className: 'status-warning', label: 'Security' },
  STUDENT: { className: 'status-neutral', label: 'Student' },
};

export default function StatusTag({ status, label }) {
  const normalized = String(status || '').toUpperCase();
  const config = STATUS_MAP[normalized] || {
    className: 'status-neutral',
    label: status || 'Unknown',
  };

  return <span className={`status-tag ${config.className}`}>{label || config.label}</span>;
}
