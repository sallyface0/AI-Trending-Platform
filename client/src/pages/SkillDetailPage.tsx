import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, GitFork, ExternalLink,
  Clock, Globe, Zap, Copy, Check
} from 'lucide-react';
import { useState } from 'react';
import { useSkillDetail } from '../hooks/useApi';
import './DetailPage.css';

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

const TYPE_LABELS: Record<string, string> = {
  skill: 'Skill',
  mcp: 'MCP',
  extension: '扩展',
  'awesome-list': '合集',
};

const CATEGORY_LABELS: Record<string, string> = {
  dev: '🛠️ 开发',
  productivity: '⚡ 效率',
  desktop: '🖥️ 桌面',
  media: '🎬 媒体',
  web: '🌐 网络',
  data: '📊 数据',
  document: '📄 文档',
  system: '⚙️ 系统',
  other: '📦 其他',
};

const TOOL_NAMES: Record<string, string> = {
  openclaw: 'OpenClaw',
  'claude-code': 'Claude Code',
  codex: 'Codex',
  cursor: 'Cursor',
  cline: 'Cline',
  copilot: 'Copilot',
  windsurf: 'Windsurf',
  trae: 'Trae',
  mcp: 'MCP',
  amp: 'Amp',
};

export default function SkillDetailPage() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const { data: skill, isLoading, isError } = useSkillDetail(owner!, repo!);
  const [copied, setCopied] = useState(false);

  const handleCopyInstall = () => {
    if (skill?.install_command) {
      navigator.clipboard.writeText(skill.install_command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

  if (isError || !skill) {
    return (
      <main className="app-main">
        <div className="detail-error">
          <p>资源未找到</p>
          <Link to="/recommend" className="back-link"><ArrowLeft size={16} /> 返回推荐页</Link>
        </div>
      </main>
    );
  }

  const tags: string[] = Array.isArray(skill.tags) ? skill.tags : [];
  const tools: string[] = Array.isArray(skill.compatible_tools) ? skill.compatible_tools : [];

  return (
    <main className="app-main">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="detail-container"
      >
        <Link to="/recommend" className="back-link">
          <ArrowLeft size={16} /> 返回推荐页
        </Link>

        <div className="detail-header">
          <img
            src={skill.avatar_url || `https://github.com/${skill.owner}.png?size=64`}
            alt={skill.owner}
            className="detail-avatar"
          />
          <div className="detail-title-area">
            <div className="detail-badges">
              <span className={`skill-type-badge ${skill.skill_type}`}>
                {TYPE_LABELS[skill.skill_type] || skill.skill_type}
              </span>
              {skill.is_new === 1 && (
                <span className="skill-new-badge">
                  <Zap size={10} /> 新发布
                </span>
              )}
            </div>
            <h1 className="detail-title">
              <span className="detail-owner">{owner}</span>
              <span className="detail-sep">/</span>
              <span className="detail-repo">{repo}</span>
            </h1>
            {skill.description_cn && (
              <p className="detail-desc-cn">{skill.description_cn}</p>
            )}
            {skill.description_en && (
              <p className="detail-desc-en">{skill.description_en}</p>
            )}
          </div>
        </div>

        <div className="detail-stats-row">
          <div className="detail-stat-item">
            <Star size={16} />
            <span className="detail-stat-value">{formatNumber(skill.star_count)}</span>
            <span className="detail-stat-label">Stars</span>
          </div>
          <div className="detail-stat-item">
            <GitFork size={16} />
            <span className="detail-stat-value">{formatNumber(skill.forks_count || 0)}</span>
            <span className="detail-stat-label">Forks</span>
          </div>
          <div className="detail-stat-item">
            <span className="detail-stat-value">{skill.popularity_score?.toFixed(2) ?? '—'}</span>
            <span className="detail-stat-label">热度分</span>
          </div>
        </div>

        {tools.length > 0 && (
          <div className="detail-topics">
            <span className="topic-label">兼容工具:</span>
            {tools.map(toolId => (
              <span key={toolId} className="topic-tag">{TOOL_NAMES[toolId] || toolId}</span>
            ))}
          </div>
        )}

        {tags.length > 0 && (
          <div className="detail-topics">
            {tags.map(t => (
              <span key={t} className="topic-tag">{t}</span>
            ))}
          </div>
        )}

        <div className="detail-links">
          <a href={skill.url} target="_blank" rel="noopener noreferrer" className="detail-link-btn primary">
            <ExternalLink size={15} /> GitHub 仓库
          </a>
          {skill.install_command && (
            <button className="detail-link-btn" onClick={handleCopyInstall}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? '已复制' : skill.install_command}
            </button>
          )}
        </div>

        <div className="detail-meta">
          {skill.language && (
            <span className="meta-item">语言: <strong>{skill.language}</strong></span>
          )}
          {skill.category && (
            <span className="meta-item">分类: <strong>{CATEGORY_LABELS[skill.category] || skill.category}</strong></span>
          )}
          {skill.created_at && (
            <span className="meta-item"><Clock size={13} /> 创建于 {new Date(skill.created_at).toLocaleDateString('zh-CN')}</span>
          )}
          {skill.updated_at && (
            <span className="meta-item"><Clock size={13} /> 更新于 {new Date(skill.updated_at).toLocaleDateString('zh-CN')}</span>
          )}
        </div>
      </motion.div>
    </main>
  );
}
