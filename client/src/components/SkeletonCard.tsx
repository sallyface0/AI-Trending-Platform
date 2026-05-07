import './SkeletonCard.css';

interface Props {
  count?: number;
}

export default function SkeletonCard({ count = 6 }: Props) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-header">
            <div className="skeleton skeleton-avatar" />
            <div className="skeleton-text-group">
              <div className="skeleton skeleton-line short" />
              <div className="skeleton skeleton-line medium" />
            </div>
          </div>
          <div className="skeleton-body">
            <div className="skeleton skeleton-line full" />
            <div className="skeleton skeleton-line full" />
            <div className="skeleton skeleton-line medium" />
          </div>
          <div className="skeleton-tags">
            <div className="skeleton skeleton-tag" />
            <div className="skeleton skeleton-tag" />
            <div className="skeleton skeleton-tag" />
          </div>
          <div className="skeleton-footer">
            <div className="skeleton skeleton-line short" />
            <div className="skeleton skeleton-line tiny" />
          </div>
        </div>
      ))}
    </div>
  );
}
