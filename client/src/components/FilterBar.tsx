import { Grid3X3, List, ArrowDownAZ, Clock, Star, GitFork, TrendingUp } from 'lucide-react';
import type { TimeRange, SortOption, ViewMode } from '../types';
import './FilterBar.css';

interface Props {
  range: TimeRange;
  sort: SortOption;
  viewMode: ViewMode;
  onRangeChange: (r: TimeRange) => void;
  onSortChange: (s: SortOption) => void;
  onViewModeChange: (v: ViewMode) => void;
}

const ranges: { value: TimeRange; label: string }[] = [
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'year', label: '近一年' },
  { value: 'all', label: '全部' },
];

const sorts: { value: SortOption; label: string; icon: React.ElementType }[] = [
  { value: 'stars_desc', label: 'Star 最多', icon: Star },
  { value: 'trending_desc', label: '最热门', icon: TrendingUp },
  { value: 'stars_asc', label: 'Star 最少', icon: ArrowDownAZ },
  { value: 'updated_desc', label: '最近更新', icon: Clock },
  { value: 'forks_desc', label: 'Fork 最多', icon: GitFork },
];

export default function FilterBar({ range, sort, viewMode, onRangeChange, onSortChange, onViewModeChange }: Props) {
  return (
    <div className="filter-bar">
      <div className="filter-tabs">
        {ranges.map(r => (
          <button
            key={r.value}
            className={`filter-tab ${range === r.value ? 'active' : ''}`}
            onClick={() => onRangeChange(r.value)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="filter-right">
        <div className="sort-select-wrapper">
          <select
            className="sort-select"
            value={sort}
            onChange={e => onSortChange(e.target.value as SortOption)}
          >
            {sorts.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => onViewModeChange('grid')}
            title="网格视图"
          >
            <Grid3X3 size={16} />
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => onViewModeChange('list')}
            title="列表视图"
          >
            <List size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
