export default function LoadingSkeleton({ rows = 5 }) {
  return (
    <div className="skeleton-list" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-row" />
      ))}
    </div>
  );
}
