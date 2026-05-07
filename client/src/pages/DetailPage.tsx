import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, GitFork, AlertCircle, ExternalLink,
  Clock, Globe, Tag
} from 'lucide-react';
import { useProjectDetail, useReadme } from '../hooks/useApi';
import './DetailPage.css';

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default function DetailPage() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const { data: project, isLoading, isError } = useProjectDetail(owner!, repo!);
  const { data: readme } = useReadme(owner!, repo!);

  if (isLoading) {
    return (
      <main className="app-main">
        <div className="detail-skeleton">
          <div className="skeleton skeleton-line" style={{ width: 120, height: 20 }} />
          <div className="skeleton skeleton-line" style={{ width: '60%', height: 32, marginTop: 20 }} />
          <div className="skeleton skeleton-line" style={{ width: '40%', height: 20, marginTop: 12 }} />
          <div className="skeleton skeleton-line" style={{ width: '100%', height: 200, marginTop: 32 }} />
        </div>
      </main>
    );
  }

  if (isError || !project) {
    return (
      <main className="app-main">
        <div className="detail-error">
          <p>项目未找到</p>
          <Link to="/" className="back-link"><ArrowLeft size={16} /> 返回首页</Link>
        </div>
      </main>
    );
  }

  const topics: string[] = Array.isArray(project.topics) ? project.topics : [];

  return (
    <main className="app-main">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="detail-container"
      >
        <Link to="/" className="back-link">
          <ArrowLeft size={16} /> 返回列表
        </Link>

        <div className="detail-header">
          <img
            src={project.avatar_url || `https://github.com/${project.owner}.png?size=64`}
            alt={project.owner}
            className="detail-avatar"
          />
          <div className="detail-title-area">
            <h1 className="detail-title">
              <span className="detail-owner">{owner}</span>
              <span className="detail-sep">/</span>
              <span className="detail-repo">{repo}</span>
            </h1>
            {project.description_cn && (
              <p className="detail-desc-cn">{project.description_cn}</p>
            )}
            {project.description_en && (
              <p className="detail-desc-en">{project.description_en}</p>
            )}
          </div>
        </div>

        <div className="detail-stats-row">
          <div className="detail-stat-item">
            <Star size={16} />
            <span className="detail-stat-value">{formatNumber(project.star_count)}</span>
            <span className="detail-stat-label">Stars</span>
          </div>
          <div className="detail-stat-item">
            <GitFork size={16} />
            <span className="detail-stat-value">{formatNumber(project.forks_count || 0)}</span>
            <span className="detail-stat-label">Forks</span>
          </div>
          <div className="detail-stat-item">
            <AlertCircle size={16} />
            <span className="detail-stat-value">{project.open_issues_count || 0}</span>
            <span className="detail-stat-label">Issues</span>
          </div>
        </div>

        {topics.length > 0 && (
          <div className="detail-topics">
            <Tag size={14} />
            {topics.map(t => (
              <span key={t} className="topic-tag">{t}</span>
            ))}
          </div>
        )}

        <div className="detail-links">
          <a href={project.url} target="_blank" rel="noopener noreferrer" className="detail-link-btn primary">
            <ExternalLink size={15} /> GitHub 仓库
          </a>
          {project.homepage && (
            <a href={project.homepage} target="_blank" rel="noopener noreferrer" className="detail-link-btn">
              <Globe size={15} /> 项目主页
            </a>
          )}
        </div>

        <div className="detail-meta">
          {project.language && (
            <span className="meta-item">语言: <strong>{project.language}</strong></span>
          )}
          {project.created_at && (
            <span className="meta-item"><Clock size={13} /> 创建于 {new Date(project.created_at).toLocaleDateString('zh-CN')}</span>
          )}
          {project.updated_at && (
            <span className="meta-item"><Clock size={13} /> 更新于 {new Date(project.updated_at).toLocaleDateString('zh-CN')}</span>
          )}
        </div>

        {readme && (
          <div className="readme-section">
            <h2 className="readme-title">README</h2>
            <div
              className="readme-content"
              dangerouslySetInnerHTML={{ __html: readme }}
            />
          </div>
        )}
      </motion.div>
    </main>
  );
}
