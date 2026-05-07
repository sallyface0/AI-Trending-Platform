# AI Trending Platform

GitHub 热门 AI 项目聚合平台 —— 自动抓取、AI 翻译摘要、Skills/MCP 智能推荐。

## ✨ 功能

- 🔥 **GitHub 项目热榜**：聚合 GitHub Trending / Search 多源数据，展示每日热门 AI 项目
- 📝 **AI 智能摘要**：接入 DeepSeek API 自动翻译和生成项目中文摘要
- 🔧 **Skills/MCP 推荐**：根据项目技术栈智能匹配 Agent Skills 和 MCP 工具
- 🎨 **现代化 UI**：React 19 + TypeScript + Vite 8 构建的响应式前端

## 🏗 技术栈

| 层 | 技术 |
|---|---|
| **前端** | React 19 + TypeScript + Vite 8 |
| **后端** | Node.js + Express 5 |
| **数据库** | SQLite3 |
| **AI 服务** | DeepSeek V4 API |
| **数据源** | GitHub Trending API · GitHub Search API |

## 🚀 快速开始

### 后端

```bash
cd server
npm install
cp .env.example .env    # 配置 DeepSeek API Key
node src/index.js
```

### 前端

```bash
cd client
npm install
npm run dev
```

### 访问

```
http://localhost:3000    # 后端 API
http://localhost:5173    # 前端开发服务器
```

## 📂 项目结构

```
AI-Trending-Platform/
├── client/               # React 前端
│   ├── src/
│   │   ├── components/   # 通用组件
│   │   ├── pages/        # 页面
│   │   ├── hooks/        # 自定义 hooks
│   │   └── context/      # 状态管理
│   └── ...
├── server/               # Node.js 后端
│   ├── src/
│   │   ├── routes/       # API 路由
│   │   ├── services/     # 业务逻辑
│   │   └── db/           # 数据库
│   └── ...
└── start.ps1             # 一键启动脚本
```

## 🧩 Agent 工作流

```
GitHub Trending API ─┬─→ Scraper Agent ─→ Translation Agent ─→ Recommendation Agent ─→ 前端展示
GitHub Search API  ──┘        ↓                    ↓                       ↓
                          数据采集              AI 摘要               Skills/MCP 匹配
```

---

*Made with OpenClaw AI Agent*
