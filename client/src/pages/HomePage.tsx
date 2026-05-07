import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, AlertTriangle, Search, X, RefreshCw, Loader2, Database, CheckCircle } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import FilterBar from '../components/FilterBar';
import ProjectCard from '../components/ProjectCard';
import SkeletonCard from '../components/SkeletonCard';
import { useProjects, useRefreshAll, useScraperStatus } from '../hooks/useApi';
import { useQueryClient } from '@tanstack/react-query';
import type { TimeRange, SortOption, ViewMode } from '../types';
import './HomePage.css';

export default function HomePage() {
  const [range, setRange] = useState<TimeRange>('all');
  const [sort, setSort] = useState<SortOption>('stars_desc');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('viewMode') as ViewMode) || 'grid';
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const refreshAll = useRefreshAll();
  const queryClient = useQueryClient();

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    setPage(1);
  }, [range, sort, search]);

  const { data, isLoading, isError, error, dataUpdatedAt } = useProjects(range, sort, page, search || undefined);

  const projects = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;

  // Scraper status - poll faster when scraper is running
  const isScraperFetching = false; // will be updated by the query
  const { data: statusData } = useScraperStatus(isScraperFetching);
  const scraper = statusData?.scraper;
  const isFetching = scraper?.state === 'fetching';
  const isDone = scraper?.state === 'done';
  const isScraperError = scraper?.state === 'error';

  // When scraper finishes, auto-refresh project list
  const prevScraperState = useRef<string>('');
  useEffect(() => {
    if (prevScraperState.current === 'fetching' && (isDone || scraper?.state === 'done')) {
      // Scraper just finished - invalidate project queries to reload data
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
    prevScraperState.current = scraper?.state || '';
  }, [scraper?.state, isDone, queryClient]);

  // Update last updated timestamp
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdated(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return '刚刚';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    return `${hours} 小时前`;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearch('');
    setSearchInput('');
  };

  // Determine what to show in the main content area
  const showFetchingBanner = isFetching && projects.length === 0;
  const showErrorBanner = isScraperError && projects.length === 0;
  const showEmpty = !isFetching && !isError && !isLoading && projects.length === 0;

  return (
    <>
      <HeroSection />
      <main className="app-main">
        {/* Search bar */}
        <form className="search-bar" onSubmit={handleSearchSubmit}>
          <Search size={16} className="search-bar-icon" />
          <input
            ref={searchRef}
            type="text"
            placeholder="搜索项目名称、语言、关键词..."
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

        {/* Auto-refresh info bar */}
        <div className="refresh-bar">
          <div className="refresh-info">
            {isFetching && (
              <span className="scraper-status fetching">
                <Loader2 size={14} className="spinning" /> {scraper?.currentTask || '正在抓取...'}
                {scraper?.progress && <span className="scraper-progress">({scraper.progress})</span>}
              </span>
            )}
            {!isFetching && lastUpdated && (
              <span className="last-updated">
                数据更新于 {formatTimeAgo(lastUpdated)} · 每 5 分钟自动刷新
              </span>
            )}
          </div>
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={isRefreshing || isFetching}
            title="立即刷新数据"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spinning' : ''} />
            <span>{isRefreshing ? '刷新中...' : isFetching ? '抓取中...' : '刷新'}</span>
          </button>
        </div>

        <FilterBar
          range={range}
          sort={sort}
          viewMode={viewMode}
          onRangeChange={setRange}
          onSortChange={setSort}
          onViewModeChange={setViewMode}
        />

        {search && (
          <div className="search-banner">
            搜索结果: <strong>"{search}"</strong> — 共 {data?.total ?? 0} 个项目
          </div>
        )}

        {isError && (
          <div className="error-state">
            <AlertTriangle size={24} />
            <p>加载失败：{(error as Error)?.message || '无法连接到服务器'}</p>
            <p className="error-hint">请确认后端服务已启动 (http://localhost:3001)</p>
          </div>
        )}

        {/* Scraper fetching - show progress */}
        {showFetchingBanner && (
          <div className="scraper-banner">
            <div className="scraper-banner-icon">
              <Database size={32} />
            </div>
            <h3>正在抓取 AI 热门项目数据</h3>
            <p className="scraper-banner-task">{scraper?.currentTask || '正在连接数据源...'}</p>
            {scraper?.progress && <p className="scraper-banner-progress">{scraper.progress}</p>}
            <div className="scraper-banner-hint">
              <Loader2 size={14} className="spinning" />
              <span>首次抓取需要 2-3 分钟，抓取完成后将自动显示</span>
            </div>
          </div>
        )}

        {/* Scraper error */}
        {showErrorBanner && (
          <div className="error-state">
            <AlertTriangle size={24} />
            <p>数据抓取失败</p>
            <p className="error-hint">{scraper?.errorMessage || '未知错误'}</p>
            <p className="error-hint">请检查网络连接或代理设置，然后点击「刷新」重试</p>
          </div>
        )}

        {isLoading && !showFetchingBanner ? (
          <SkeletonCard count={6} />
        ) : isError ? null : showEmpty && !showFetchingBanner ? (
          <div className="empty-state">
            <p className="empty-icon">📭</p>
            <p>暂无项目数据</p>
            <p className="empty-hint">{search ? '没有找到匹配的项目，换个关键词试试' : '换个时间范围试试？'}</p>
          </div>
        ) : projects.length > 0 ? (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${range}-${sort}-${page}-${search}`}
                className={viewMode === 'grid' ? 'project-grid' : 'project-list'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {projects.map((proj, i) => (
                  <ProjectCard key={proj.id} project={proj} index={i} viewMode={viewMode} />
                ))}
              </motion.div>
            </AnimatePresence>

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
        ) : null}
      </main>
    </>
  );
}
