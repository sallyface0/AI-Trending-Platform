const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const projectsRouter = require('./routes/projects');
const skillsRouter = require('./routes/skills');
const { fetchTrendingAIProjects } = require('./services/scraper');
const { fetchSkillsAndMCPs } = require('./services/skill-scraper');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;

// ====== Status Tracking ======
const scraperStatus = {
    state: 'idle',
    lastFetchTime: null,
    currentTask: '',
    progress: '',
    errorMessage: '',
    totalProjects: 0,
};

const skillScraperStatus = {
    state: 'idle',
    lastFetchTime: null,
    currentTask: '',
    progress: '',
    errorMessage: '',
    totalSkills: 0,
};

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/projects', projectsRouter);
app.use('/api/skills', skillsRouter);

app.get('/api/tools', (req, res) => {
    const { AI_TOOLS } = require('./services/tools-config');
    res.json(AI_TOOLS);
});

app.get('/api/stats', (req, res) => {
    const stats = {};
    db.get('SELECT COUNT(*) as count FROM Projects', (err, row) => {
        stats.totalProjects = err ? 0 : row.count;
        db.get('SELECT COALESCE(SUM(star_count), 0) as total FROM Projects', (err, row) => {
            stats.totalStars = err ? 0 : row.total;
            db.get("SELECT COUNT(*) as count FROM Projects WHERE fetched_at >= datetime('now', '-1 day')", (err, row) => {
                stats.todayNew = err ? 0 : row.count;
                db.all(`SELECT language, COUNT(*) as count FROM Projects WHERE language IS NOT NULL AND language != 'Unknown' GROUP BY language ORDER BY count DESC LIMIT 10`, (err, rows) => {
                    stats.languages = err ? [] : rows;

                    // Also include skills stats
                    db.get('SELECT COUNT(*) as count FROM Skills', (err, row) => {
                        stats.totalSkills = err ? 0 : row.count;
                        db.get("SELECT COUNT(*) as count FROM Skills WHERE is_new = 1", (err, row) => {
                            stats.newSkills = err ? 0 : row.count;
                            res.json(stats);
                        });
                    });
                });
            });
        });
    });
});

app.get('/api/status', (req, res) => {
    db.get('SELECT COUNT(*) as count FROM Projects', (err, pRow) => {
        db.get('SELECT COUNT(*) as count FROM Skills', (err, sRow) => {
            res.json({
                status: 'ok',
                timestamp: new Date(),
                scraper: {
                    ...scraperStatus,
                    totalProjects: err ? 0 : pRow.count,
                },
                skillScraper: {
                    ...skillScraperStatus,
                    totalSkills: err ? 0 : sRow.count,
                },
            });
        });
    });
});

// On-demand refresh
app.post('/api/refresh', async (req, res) => {
    const target = req.body.target || 'all'; // 'projects' | 'skills' | 'all'
    const results = {};

    try {
        if (target === 'projects' || target === 'all') {
            if (scraperStatus.state !== 'fetching') {
                await runProjectScraper();
                results.projects = 'ok';
            } else {
                results.projects = 'skipped (already fetching)';
            }
        }
        if (target === 'skills' || target === 'all') {
            if (skillScraperStatus.state !== 'fetching') {
                await runSkillScraper();
                results.skills = 'ok';
            } else {
                results.skills = 'skipped (already fetching)';
            }
        }
        res.json({ status: 'ok', results });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('[Server] Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// ====== Scraper Runners ======
async function runProjectScraper() {
    scraperStatus.state = 'fetching';
    scraperStatus.currentTask = '正在连接数据源...';
    scraperStatus.progress = '';
    scraperStatus.errorMessage = '';
    scraperStatus.lastFetchTime = Date.now();

    try {
        await fetchTrendingAIProjects((task, progress) => {
            scraperStatus.currentTask = task;
            scraperStatus.progress = progress || '';
        });
        await new Promise((resolve) => {
            db.get('SELECT COUNT(*) as count FROM Projects', (err, row) => {
                scraperStatus.totalProjects = err ? 0 : row.count;
                resolve();
            });
        });
        scraperStatus.state = 'done';
        scraperStatus.currentTask = `抓取完成，共 ${scraperStatus.totalProjects} 个项目`;
    } catch (err) {
        scraperStatus.state = 'error';
        scraperStatus.errorMessage = err.message || 'Unknown error';
        scraperStatus.currentTask = '抓取出错';
        console.error('[ProjectScraper] Error:', err.message);
    }
}

async function runSkillScraper() {
    skillScraperStatus.state = 'fetching';
    skillScraperStatus.currentTask = '正在连接 Skills 数据源...';
    skillScraperStatus.progress = '';
    skillScraperStatus.errorMessage = '';
    skillScraperStatus.lastFetchTime = Date.now();

    try {
        await fetchSkillsAndMCPs((task, progress) => {
            skillScraperStatus.currentTask = task;
            skillScraperStatus.progress = progress || '';
        });
        await new Promise((resolve) => {
            db.get('SELECT COUNT(*) as count FROM Skills', (err, row) => {
                skillScraperStatus.totalSkills = err ? 0 : row.count;
                resolve();
            });
        });
        skillScraperStatus.state = 'done';
        skillScraperStatus.currentTask = `抓取完成，共 ${skillScraperStatus.totalSkills} 个 Skills`;
    } catch (err) {
        skillScraperStatus.state = 'error';
        skillScraperStatus.errorMessage = err.message || 'Unknown error';
        skillScraperStatus.currentTask = 'Skills 抓取出错';
        console.error('[SkillScraper] Error:', err.message);
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Init: start both scrapers, then schedule cron
db.waitForInit().then(async () => {
    console.log('[Init] Database ready, starting scrapers...');

    // Run projects scraper first
    await runProjectScraper();

    // Then run skills scraper
    await runSkillScraper();

    // Cron: fetch projects every 30 minutes
    cron.schedule('*/30 * * * *', () => {
        console.log('[Cron] Triggering project scraper');
        runProjectScraper();
    });

    // Cron: fetch skills every 2 hours (skills change less frequently)
    cron.schedule('0 */2 * * *', () => {
        console.log('[Cron] Triggering skill scraper');
        runSkillScraper();
    });
}).catch(err => {
    console.error('[Init] Database initialization failed:', err.message);
});
