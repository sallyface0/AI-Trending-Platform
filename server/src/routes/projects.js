const express = require('express');
const axios = require('axios');
const router = express.Router();
const db = require('../db/database');

// GET /api/projects - List projects with filtering, sorting, search, pagination
router.get('/', (req, res) => {
    const range = req.query.range || 'all';
    const sort = req.query.sort || 'stars_desc';
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let whereClauses = ['1=1'];
    let params = [];

    // Time range filter — based on which trending source the project came from
    // daily → today, weekly → week, monthly → month, GitHub Search → all
    if (range !== 'all') {
        const rangeValues = {
            today: ["'today'"],
            week:  ["'today'", "'week'"],
            month: ["'today'", "'week'", "'month'"],
            year:  ["'today'", "'week'", "'month'", "'all'"],
        };
        const ranges = rangeValues[range];
        if (ranges) {
            whereClauses.push(`trending_range IN (${ranges.join(',')})`);
        }
    }

    // Search filter
    if (search) {
        whereClauses.push(`(name LIKE ? OR owner LIKE ? OR description_cn LIKE ? OR description_en LIKE ? OR language LIKE ? OR topics LIKE ?)`);
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereClauses.join(' AND ');

    // Sort
    const sortMap = {
        stars_desc: 'star_count DESC',
        stars_asc: 'star_count ASC',
        updated_desc: "updated_at DESC",
        forks_desc: 'forks_count DESC',
        trending_desc: 'trending_stars DESC, star_count DESC',
    };
    const orderClause = sortMap[sort] || 'star_count DESC';

    const countQuery = `SELECT COUNT(*) as total FROM Projects WHERE ${whereClause}`;
    const dataQuery = `
        SELECT id, repo_full_name, name, owner, description_en, description_cn,
               star_count, forks_count, open_issues_count, language, topics,
               url, avatar_url, homepage, created_at, updated_at, fetched_at,
               star_delta, trending_stars, trending_range
        FROM Projects
        WHERE ${whereClause}
        ORDER BY ${orderClause}
        LIMIT ? OFFSET ?
    `;

    db.get(countQuery, params, (err, countRow) => {
        if (err) {
            console.error('[API] Count error:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }

        const total = countRow.total;

        db.all(dataQuery, [...params, limit, offset], (err, rows) => {
            if (err) {
                console.error('[API] Query error:', err.message);
                return res.status(500).json({ error: 'Database error' });
            }

            const data = rows.map(row => ({
                ...row,
                topics: safeParseJSON(row.topics),
            }));

            res.json({
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                data,
            });
        });
    });
});

// GET /api/projects/detail/:owner/:repo
router.get('/detail/:owner/:repo', (req, res) => {
    const { owner, repo } = req.params;
    const fullName = `${owner}/${repo}`;

    db.get(`SELECT * FROM Projects WHERE repo_full_name = ?`, [fullName], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'Project not found' });
        res.json({ ...row, topics: safeParseJSON(row.topics) });
    });
});

// GET /api/projects/detail/:owner/:repo/readme
router.get('/detail/:owner/:repo/readme', async (req, res) => {
    const { owner, repo } = req.params;
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3.html',
            'User-Agent': 'AI-Trending-Platform/1.0',
        };
        if (process.env.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        }
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/readme`,
            { headers, timeout: 10000 }
        );
        res.json({ content: response.data });
    } catch (err) {
        if (err.response?.status === 404) return res.json({ content: '' });
        console.error(`[API] README error for ${owner}/${repo}:`, err.message);
        res.json({ content: '' });
    }
});

// GET /api/projects/stats
router.get('/stats', (req, res) => {
    const stats = {};
    db.get('SELECT COUNT(*) as count FROM Projects', (err, row) => {
        stats.totalProjects = err ? 0 : row.count;
        db.get('SELECT COALESCE(SUM(star_count), 0) as total FROM Projects', (err, row) => {
            stats.totalStars = err ? 0 : row.total;
            db.get("SELECT COUNT(*) as count FROM Projects WHERE fetched_at >= datetime('now', '-1 day')", (err, row) => {
                stats.todayNew = err ? 0 : row.count;
                db.all(`SELECT language, COUNT(*) as count FROM Projects WHERE language IS NOT NULL AND language != 'Unknown' GROUP BY language ORDER BY count DESC LIMIT 10`, (err, rows) => {
                    stats.languages = err ? [] : rows;
                    res.json(stats);
                });
            });
        });
    });
});

function safeParseJSON(str) {
    try {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
}

module.exports = router;
