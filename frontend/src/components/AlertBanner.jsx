import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function AlertBanner({ type = 'info', message, onClose }) {
  if (!message) return null;
  const Icon = ICONS[type] || Info;

  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <div className="alert-content">
        <Icon size={18} className="alert-icon" aria-hidden="true" />
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          className="alert-dismiss"
          onClick={onClose}
          aria-label="Dismiss message"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
