import { useEffect, useState } from 'react';
import Modal from './Modal';
import AlertBanner from './AlertBanner';
import { extractErrorMessage, extractFieldErrors } from '../utils/formatters';

export default function ItemFormModal({
  isOpen,
  mode, // 'create' | 'edit'
  itemType, // 'lost' | 'found'
  initialItem,
  onClose,
  onSubmit,
}) {
  const dateField = itemType === 'lost' ? 'lostDate' : 'foundDate';
  const dateLabel = itemType === 'lost' ? 'Date Lost' : 'Date Found';

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        title: initialItem?.title || '',
        description: initialItem?.description || '',
        location: initialItem?.location || '',
        date: initialItem?.[dateField] || new Date().toISOString().split('T')[0],
      });
      setErrors({});
      setSubmitError('');
    }
  }, [isOpen, initialItem, dateField]);

  const validate = () => {
    const nextErrors = {};
    if (!form.title.trim()) {
      nextErrors.title = 'Title is required.';
    } else if (form.title.trim().length > 100) {
      nextErrors.title = 'Title must not exceed 100 characters.';
    }

    if (!form.description.trim()) {
      nextErrors.description = 'Description is required.';
    } else if (form.description.trim().length > 1000) {
      nextErrors.description = 'Description must not exceed 1000 characters.';
    }

    if (!form.location.trim()) {
      nextErrors.location = 'Location is required.';
    } else if (form.location.trim().length > 255) {
      nextErrors.location = 'Location must not exceed 255 characters.';
    }

    if (!form.date) {
      nextErrors[dateField] = `${dateLabel} is required.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      [dateField]: form.date,
    };

    try {
      setSubmitting(true);
      await onSubmit(payload);
      onClose();
    } catch (error) {
      const backendFieldErrors = extractFieldErrors(error);
      if (Object.keys(backendFieldErrors).length > 0) {
        setErrors(backendFieldErrors);
      }
      setSubmitError(extractErrorMessage(error, 'Failed to save item report.'));
    } finally {
      setSubmitting(false);
    }
  };

  const entityLabel = itemType === 'lost' ? 'Lost Item' : 'Found Item';
  const modalTitle = mode === 'edit' ? `Edit ${entityLabel}` : `Report ${entityLabel}`;

  return (
    <Modal
      isOpen={isOpen}
      title={modalTitle}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="submit"
            form="item-report-form"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting
              ? 'Saving...'
              : mode === 'edit'
                ? 'Save Changes'
                : `Submit ${entityLabel}`}
          </button>
        </>
      }
    >
      <form id="item-report-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        <AlertBanner type="error" message={submitError} onClose={() => setSubmitError('')} />

        {mode === 'create' && (
          <AlertBanner
            type="info"
            message="New item reports start in Pending moderation and become publicly searchable once approved by an administrator."
          />
        )}

        <div className="field">
          <label className="field-label" htmlFor="item-title">
            Item Title <span className="field-required">*</span>
          </label>
          <input
            id="item-title"
            type="text"
            className={`input ${errors.title ? 'input-error' : ''}`}
            maxLength={100}
            placeholder="e.g., Black Leather Wallet or MacBook Charger"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </div>

        <div className="form-row">
          <div className="field">
            <label className="field-label" htmlFor="item-location">
              Campus Location <span className="field-required">*</span>
            </label>
            <input
              id="item-location"
              type="text"
              className={`input ${errors.location ? 'input-error' : ''}`}
              maxLength={255}
              placeholder="e.g., CSE Block, Main Library 2F"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            />
            {errors.location && <span className="field-error">{errors.location}</span>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="item-date">
              {dateLabel} <span className="field-required">*</span>
            </label>
            <input
              id="item-date"
              type="date"
              className={`input ${errors[dateField] ? 'input-error' : ''}`}
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            />
            {errors[dateField] && <span className="field-error">{errors[dateField]}</span>}
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="item-description">
            Description <span className="field-required">*</span>
          </label>
          <textarea
            id="item-description"
            className={`textarea ${errors.description ? 'input-error' : ''}`}
            maxLength={1000}
            placeholder="Describe distinguishing features, color, brand, or contents..."
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <span className="field-hint tabular-nums">{form.description.length}/1000 characters</span>
          {errors.description && <span className="field-error">{errors.description}</span>}
        </div>
      </form>
    </Modal>
  );
}
