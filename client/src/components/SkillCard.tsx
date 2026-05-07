import { Link } from 'react-router-dom';
import { Star, GitFork, ExternalLink, Clock, Zap, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { Skill, AITool } from '../types';
import './SkillCard.css';

interface Props {
  skill: Skill;
  index: number;
  tools?: AITool[];
}

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  return `${months}个月前`;
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

export default function SkillCard({ skill, index, tools }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopyInstall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (skill.install_command) {
      navigator.clipboard.writeText(skill.install_command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: index * 0.03 } },
  };

  const repoPath = `/skill/${skill.owner}/${skill.name}`;

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      <Link to={repoPath} className="skill-card">
        <div className="skill-card-header">
          <div className="skill-card-identity">
            <img
              src={skill.avatar_url || `https://github.com/${skill.owner}.png?size=40`}
              alt={skill.owner}
              className="skill-card-avatar"
              loading="lazy"
            />
            <div className="skill-card-names">
              <span className="skill-card-owner">{skill.owner}</span>
              <span className="skill-card-name">{skill.name}</span>
            </div>
          </div>
          <div className="skill-card-badges">
            <span className={`skill-type-badge ${skill.skill_type}`}>
              {TYPE_LABELS[skill.skill_type] || skill.skill_type}
            </span>
            {skill.is_new === 1 && (
              <span className="skill-new-badge">
                <Zap size={10} /> 新
              </span>
            )}
          </div>
        </div>

        <p className="skill-card-desc">
          {skill.description_cn || skill.description_en || '暂无简介'}
        </p>

        {/* Compatible tools */}
        {skill.compatible_tools.length > 0 && (
          <div className="skill-card-tools">
            {skill.compatible_tools.map(toolId => (
              <span key={toolId} className="tool-tag">
                {TOOL_NAMES[toolId] || toolId}
              </span>
            ))}
          </div>
        )}

        {/* Tags */}
        {skill.tags.length > 0 && (
          <div className="skill-card-tags">
            {skill.tags.slice(0, 3).map(tag => (
              <span key={tag} className="skill-tag">{tag}</span>
            ))}
          </div>
        )}

        <div className="skill-card-footer">
          <div className="skill-card-stats">
            <span className="skill-stat"><Star size={13} /> {formatNumber(skill.star_count)}</span>
            <span className="skill-stat"><GitFork size={13} /> {formatNumber(skill.forks_count || 0)}</span>
            {skill.category && (
              <span className="skill-category">{CATEGORY_LABELS[skill.category] || skill.category}</span>
            )}
          </div>

          <div className="skill-card-actions">
            {skill.install_command && (
              <button
                className="install-btn"
                onClick={handleCopyInstall}
                title={skill.install_command}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? '已复制' : '安装命令'}</span>
              </button>
            )}
            <a
              href={skill.url}
              target="_blank"
              rel="noopener noreferrer"
              className="skill-link-btn"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {skill.created_at && (
          <div className="skill-card-meta">
            <Clock size={11} /> {timeAgo(skill.created_at)}创建
          </div>
        )}
      </Link>
    </motion.div>
  );
}
