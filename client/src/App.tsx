import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import DetailPage from './pages/DetailPage'
import SkillDetailPage from './pages/SkillDetailPage'
import RecommendPage from './pages/RecommendPage'
import './App.css'

function App() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/recommend" element={<RecommendPage />} />
        <Route path="/project/:owner/:repo" element={<DetailPage />} />
        <Route path="/skill/:owner/:repo" element={<SkillDetailPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: '16px'
    }}>
      <h1 style={{ fontSize: '4rem', opacity: 0.2 }}>404</h1>
      <p style={{ color: 'var(--text-muted)' }}>页面不存在</p>
      <a href="/" style={{ color: 'var(--primary)' }}>返回首页</a>
    </div>
  )
}

export default App
