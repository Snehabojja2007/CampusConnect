export default function Pagination({ pageData, onPageChange, onSizeChange }) {
  if (!pageData || pageData.totalElements === 0) return null;

  const { number = 0, totalPages = 1, totalElements = 0, size = 10, first, last } = pageData;
  const startItem = number * size + 1;
  const endItem = Math.min((number + 1) * size, totalElements);

  return (
    <div className="pagination-bar">
      <div className="pagination-info tabular-nums">
        Showing {startItem}–{endItem} of {totalElements} records
      </div>

      <div className="pagination-controls">
        {onSizeChange && (
          <select
            className="select"
            style={{ width: 'auto', minHeight: '34px', padding: '4px 10px' }}
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            aria-label="Items per page"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
        )}

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={first || number <= 0}
          onClick={() => onPageChange(number - 1)}
        >
          Previous
        </button>

        <span className="pagination-info tabular-nums">
          Page {number + 1} of {Math.max(totalPages, 1)}
        </span>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={last || number + 1 >= totalPages}
          onClick={() => onPageChange(number + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
