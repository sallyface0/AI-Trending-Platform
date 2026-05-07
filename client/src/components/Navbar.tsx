import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Code2, Flame, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const isRecommend = location.pathname === '/recommend';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <Flame size={24} className="brand-icon" />
          <span className="brand-text">AI Trending</span>
        </Link>

        <div className="navbar-links">
          <Link
            to="/"
            className={`nav-link ${isHome ? 'active' : ''}`}
          >
            <Flame size={15} />
            热门项目
          </Link>
          <Link
            to="/recommend"
            className={`nav-link ${isRecommend ? 'active' : ''}`}
          >
            <Sparkles size={15} />
            Skills & MCP
          </Link>
        </div>

        <div className="navbar-actions">
          <button className="icon-btn" onClick={toggleTheme} title="切换主题">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="icon-btn"
            title="GitHub"
          >
            <Code2 size={18} />
          </a>
        </div>
      </div>
    </nav>
  );
}
