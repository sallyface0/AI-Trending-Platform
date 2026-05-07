import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search, X, Loader2, Flame, Clock, Sparkles, Filter } from 'lucide-react';
import ToolSelector from '../components/ToolSelector';
import SkillCard from '../components/SkillCard';
import SkeletonCard from '../components/SkeletonCard';
import { useSkills, useSkillStats, useTools, useScraperStatus } from '../hooks/useApi';
import { useQueryClient } from '@tanstack/react-query';
import type { SkillSortOption } from '../types';
import './RecommendPage.css';

const CATEGORIES = [
  { value: '', label: '全部' },
  { value: 'dev', label: '🛠️ 开发' },
  { value: 'productivity', label: '⚡ 效率' },
  { value: 'desktop', label: '🖥️ 桌面' },
  { value: 'media', label: '🎬 媒体' },
  { value: 'web', label: '🌐 网络' },
  { value: 'data', label: '📊 数据' },
  { value: 'document', label: '📄 文档' },
  { value: 'system', label: '⚙️ 系统' },
  { value: 'other', label: '📦 其他' },
];

const TYPES = [
  { value: '', label: '全部类型' },
  { value: 'skill', label: 'Skill' },
  { value: 'mcp', label: 'MCP' },
  { value: 'extension', label: '扩展' },
  { value: 'awesome-list', label: '合集' },
];

const SORTS: { value: SkillSortOption; label: string; icon: React.ElementType }[] = [
  { value: 'popularity_desc', label: '最热门', icon: Flame },
  { value: 'stars_desc', label: 'Star 最多', icon: Sparkles },
  { value: 'newest', label: '最新发布', icon: Clock },
];

export default function RecommendPage() {
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState<SkillSortOption>('popularity_desc');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();

  // Build tool filter: if multiple tools selected, use the first one (backend supports one)
  // OR we can combine results. For simplicity, use first selected or empty (all)
  const toolFilter = selectedTools.length > 0 ? selectedTools[0] : '';

  const { data, isLoading, isError, error } = useSkills(
    toolFilter, category, type, sort, page, search || undefined
  );

  const { data: toolsData } = useTools();
  const { data: skillStats } = useSkillStats();

  // Scraper status
  const { data: statusData } = useScraperStatus(false);
  const skillScraper = statusData?.skillScraper;
  const isSkillFetching = skillScraper?.state === 'fetching';

  // Auto-refresh when scraper finishes
  const prevState = useRef('');
  useEffect(() => {
    if (prevState.current === 'fetching' && skillScraper?.state === 'done') {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skillStats'] });
    }
    prevState.current = skillScraper?.state || '';
  }, [skillScraper?.state, queryClient]);

  useEffect(() => {
    setPage(1);
  }, [toolFilter, category, type, sort, search]);

  const skills = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearch('');
    setSearchInput('');
  };

  return (
    <div className="recommend-page">
      {/* Tool Selector */}
      <ToolSelector
        selectedTools={selectedTools}
        onSelectionChange={setSelectedTools}
      />

      {/* Stats bar */}
      {skillStats && (
        <div className="skill-stats-bar">
          <span>共 <strong>{skillStats.totalSkills}</strong> 个资源</span>
          {skillStats.newSkills > 0 && (
            <span className="stat-new">{skillStats.newSkills} 个新发布</span>
          )}
        </div>
      )}

      {/* Scraper fetching banner */}
      {isSkillFetching && (
        <div className="skill-fetching-banner">
          <Loader2 size={14} className="spinning" />
          <span>{skillScraper?.currentTask || '正在抓取 Skills 数据...'}</span>
          {skillScraper?.progress && <span className="muted">({skillScraper.progress})</span>}
        </div>
      )}

      {/* Search bar */}
      <form className="search-bar" onSubmit={handleSearchSubmit}>
        <Search size={16} className="search-bar-icon" />
        <input
          type="text"
          placeholder="搜索 Skills、MCP、插件..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="search-bar-input"
        />
        {search && (
          <button type="button" className="search-bar-clear" onClick={clearSearch}>
            <X size={14} /> 清除
          </button>
        )}
        <button type="submit" className="search-bar-btn">搜索</button>
      </form>

      {/* Filter bar */}
      <div className="recommend-filter-bar">
        <div className="filter-tabs-row">
          {/* Sort tabs */}
          <div className="sort-tabs">
            {SORTS.map(s => (
              <button
                key={s.value}
                className={`sort-tab ${sort === s.value ? 'active' : ''}`}
                onClick={() => setSort(s.value)}
              >
                <s.icon size={14} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Filter toggle */}
          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} />
            筛选
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="filter-expanded">
            {/* Category */}
            <div className="filter-group">
              <label className="filter-label">分类</label>
              <div className="filter-pills">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    className={`filter-pill ${category === c.value ? 'active' : ''}`}
                    onClick={() => setCategory(c.value)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div className="filter-group">
              <label className="filter-label">类型</label>
              <div className="filter-pills">
                {TYPES.map(t => (
                  <button
                    key={t.value}
                    className={`filter-pill ${type === t.value ? 'active' : ''}`}
                    onClick={() => setType(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-tool info */}
            {selectedTools.length > 1 && (
              <div className="multi-tool-hint">
                已选 {selectedTools.length} 个工具，当前显示
                <strong> {toolsData?.find(t => t.id === toolFilter)?.name || toolFilter} </strong>
                的推荐。后续版本将支持合并显示。
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search result banner */}
      {search && (
        <div className="search-banner">
          搜索结果: <strong>"{search}"</strong> — 共 {data?.total ?? 0} 个资源
        </div>
      )}

      {/* Content */}
      {isError && (
        <div className="error-state">
          <p>加载失败：{(error as Error)?.message || '无法连接到服务器'}</p>
        </div>
      )}

      {isLoading ? (
        <SkeletonCard count={6} />
      ) : skills.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">🔍</p>
          <p>暂无匹配的 Skills</p>
          <p className="empty-hint">
            {selectedTools.length > 0
              ? '试试选择其他工具，或清除筛选条件'
              : '选择你的 AI 工具来查看推荐'}
          </p>
        </div>
      ) : (
        <>
          <div className="skill-grid">
            <AnimatePresence mode="wait">
              {skills.map((skill, i) => (
                <SkillCard key={skill.id} skill={skill} index={i} tools={toolsData} />
              ))}
            </AnimatePresence>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={16} /> 上一页
              </button>
              <span className="page-info">{page} / {totalPages}</span>
              <button
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                下一页 <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
