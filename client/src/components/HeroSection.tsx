import { Star, TrendingUp, Package } from 'lucide-react';
import { useStats } from '../hooks/useApi';
import { motion } from 'framer-motion';
import './HeroSection.css';

function AnimatedCounter({ value }: { value: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {value.toLocaleString()}
    </motion.span>
  );
}

export default function HeroSection() {
  const { data: stats } = useStats();

  const statItems = [
    { icon: Package, label: '收录项目', value: stats?.totalProjects ?? 0, color: '#818cf8' },
    { icon: Star, label: '总 Star 数', value: stats?.totalStars ?? 0, color: '#fbbf24' },
    { icon: TrendingUp, label: '今日新增', value: stats?.todayNew ?? 0, color: '#34d399' },
  ];

  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-orb orb-1" />
        <div className="hero-orb orb-2" />
        <div className="hero-orb orb-3" />
      </div>

      <div className="hero-content">
        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          发现 AI 开源世界的
          <span className="gradient-text">每一次脉搏</span>
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          实时追踪 GitHub 热门 AI 项目，自动中文解读，助你把握技术前沿
        </motion.p>

        <motion.div
          className="hero-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {statItems.map((item) => (
            <div key={item.label} className="stat-card">
              <div className="stat-icon" style={{ color: item.color, background: `${item.color}15` }}>
                <item.icon size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-value">
                  <AnimatedCounter value={item.value} />
                </span>
                <span className="stat-label">{item.label}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
