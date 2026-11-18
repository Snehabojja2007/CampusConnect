export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function parseJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export function extractErrorMessage(error, fallback = 'An unexpected error occurred.') {
  if (!error) return fallback;

  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please verify the CampusConnect Spring Boot server is running.';
    }
    return 'Cannot reach the CampusConnect backend server. Ensure Spring Boot is running on http://localhost:8081.';
  }

  const { status, data } = error.response;

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data && typeof data === 'object') {
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
    if (typeof data.error === 'string' && data.error.trim() && status >= 500) {
      return `${data.error} (HTTP ${status})`;
    }
    const fieldValues = Object.values(data).filter((val) => typeof val === 'string');
    if (fieldValues.length > 0) {
      return fieldValues.join(' · ');
    }
  }

  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 409) return 'This action conflicts with the current state of the record.';

  return fallback;
}

export function extractFieldErrors(error) {
  const data = error?.response?.data;
  if (data && typeof data === 'object' && !Array.isArray(data) && !data.message && !data.error) {
    return data;
  }
  return {};
}

export function formatNotificationType(type) {
  switch (type) {
    case 'CLAIM_SUBMITTED':
      return 'Claim Submitted';
    case 'CLAIM_APPROVED':
      return 'Claim Approved';
    case 'CLAIM_REJECTED':
      return 'Claim Rejected';
    case 'ITEM_MATCHED':
      return 'Item Matched';
    case 'HANDOVER_CREATED':
      return 'Handover Scheduled';
    case 'HANDOVER_COMPLETED':
      return 'Handover Completed';
    default:
      return type || 'Notification';
  }
}
