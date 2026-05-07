import { Link } from 'react-router-dom';
import { Star, GitFork, AlertCircle, ExternalLink, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Project, ViewMode } from '../types';
import './ProjectCard.css';

interface Props {
  project: Project;
  index: number;
  viewMode: ViewMode;
}

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  return `${months}个月前`;
}

const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#3572A5', TypeScript: '#3178c6', JavaScript: '#f1e05a',
  Jupyter: '#DA5B0B', 'C++': '#f34b7d', C: '#555555',
  Go: '#00ADD8', Rust: '#dea584', Java: '#b07219',
  'C#': '#178600', Ruby: '#701516', PHP: '#4F5D95',
  Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB',
  Shell: '#89e051', HTML: '#e34c26', CSS: '#563d7c',
  Vue: '#41b883', Svelte: '#ff3e00',
};

export default function ProjectCard({ project, index, viewMode }: Props) {
  const langColor = LANGUAGE_COLORS[project.language] || '#8b949e';
  const topics = Array.isArray(project.topics) ? project.topics.slice(0, 4) : [];
  const repoPath = `/project/${project.owner}/${project.name}`;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, delay: index * 0.04 } },
  };

  if (viewMode === 'list') {
    return (
      <motion.div variants={cardVariants} initial="hidden" animate="visible">
        <Link to={repoPath} className="project-card list-card">
          <div className="list-card-left">
            <img
              src={project.avatar_url || `https://github.com/${project.owner}.png?size=48`}
              alt={project.owner}
              className="card-avatar"
              loading="lazy"
            />
            <div className="list-card-info">
              <div className="card-title-row">
                <span className="card-owner">{project.owner} /</span>
                <span className="card-name">{project.name}</span>
              </div>
              <p className="card-desc">{project.description_cn || project.description_en || '暂无简介'}</p>
            </div>
          </div>
          <div className="list-card-right">
            <span className="card-stat"><Star size={14} /> {formatNumber(project.star_count)}</span>
            <span className="card-stat"><GitFork size={14} /> {formatNumber(project.forks_count || 0)}</span>
            {project.trending_stars > 0 && (
              <span className="card-stat trending"><TrendingUp size={13} /> +{formatNumber(project.trending_stars)}</span>
            )}
            <span className="card-lang-dot" style={{ background: langColor }} />
            <span className="card-lang-text">{project.language}</span>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      <Link to={repoPath} className="project-card grid-card">
        <div className="card-top">
          <div className="card-avatar-row">
            <img
              src={project.avatar_url || `https://github.com/${project.owner}.png?size=40`}
              alt={project.owner}
              className="card-avatar"
              loading="lazy"
            />
            <div className="card-identity">
              <span className="card-owner">{project.owner}</span>
              <span className="card-name">{project.name}</span>
            </div>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-external"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={14} />
            </a>
          </div>

          <p className="card-desc">{project.description_cn || project.description_en || '暂无简介'}</p>
        </div>

        {topics.length > 0 && (
          <div className="card-topics">
            {topics.map(t => (
              <span key={t} className="topic-tag">{t}</span>
            ))}
          </div>
        )}

        <div className="card-bottom">
          <div className="card-stats">
            <span className="card-stat"><Star size={13} /> {formatNumber(project.star_count)}</span>
            <span className="card-stat"><GitFork size={13} /> {formatNumber(project.forks_count || 0)}</span>
            {project.trending_stars > 0 && (
              <span className="card-stat trending"><TrendingUp size={13} /> +{formatNumber(project.trending_stars)}</span>
            )}
          </div>
          <div className="card-meta">
            <span className="card-lang">
              <span className="card-lang-dot" style={{ background: langColor }} />
              {project.language}
            </span>
            <span className="card-time"><Clock size={11} /> {timeAgo(project.fetched_at)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
