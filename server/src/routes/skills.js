const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { AI_TOOLS } = require('../services/tools-config');

// GET /api/tools - Return supported AI tools list
router.get('/tools', (req, res) => {
    res.json(AI_TOOLS);
});

// GET /api/skills - List skills with filtering, sorting, search, pagination
router.get('/', (req, res) => {
    const tool = req.query.tool || '';
    const category = req.query.category || '';
    const type = req.query.type || '';
    const sort = req.query.sort || 'popularity_desc';
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = req.query.search || '';
    const onlyNew = req.query.new === '1';
    const offset = (page - 1) * limit;

    let whereClauses = ['1=1'];
    let params = [];

    // Filter by compatible tool
    if (tool) {
        whereClauses.push(`compatible_tools LIKE ?`);
        params.push(`%"${tool}"%`);
    }

    // Filter by category
    if (category) {
        whereClauses.push(`category = ?`);
        params.push(category);
    }

    // Filter by skill type
    if (type) {
        whereClauses.push(`skill_type = ?`);
        params.push(type);
    }

    // Filter new only
    if (onlyNew) {
        whereClauses.push(`is_new = 1`);
    }

    // Search filter
    if (search) {
        whereClauses.push(`(name LIKE ? OR owner LIKE ? OR description_cn LIKE ? OR description_en LIKE ? OR tags LIKE ?)`);
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereClauses.join(' AND ');

    // Sort
    const sortMap = {
        popularity_desc: 'popularity_score DESC',
        stars_desc: 'star_count DESC',
        stars_asc: 'star_count ASC',
        newest: 'created_at DESC',
        recently_updated: 'updated_at DESC',
    };
    const orderClause = sortMap[sort] || 'popularity_score DESC';

    const countQuery = `SELECT COUNT(*) as total FROM Skills WHERE ${whereClause}`;
    const dataQuery = `
        SELECT id, repo_full_name, name, owner, description_en, description_cn,
               star_count, forks_count, language, skill_type,
               compatible_tools, category, tags, install_command,
               is_new, popularity_score, url, avatar_url,
               created_at, updated_at, fetched_at
        FROM Skills
        WHERE ${whereClause}
        ORDER BY ${orderClause}
        LIMIT ? OFFSET ?
    `;

    db.get(countQuery, params, (err, countRow) => {
        if (err) {
            console.error('[API] Skills count error:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }

        const total = countRow.total;

        db.all(dataQuery, [...params, limit, offset], (err, rows) => {
            if (err) {
                console.error('[API] Skills query error:', err.message);
                return res.status(500).json({ error: 'Database error' });
            }

            const data = rows.map(row => ({
                ...row,
                compatible_tools: safeParseJSON(row.compatible_tools),
                tags: safeParseJSON(row.tags),
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

// GET /api/skills/stats - Skills statistics
router.get('/stats', (req, res) => {
    const stats = {};

    db.get('SELECT COUNT(*) as count FROM Skills', (err, row) => {
        stats.totalSkills = err ? 0 : row.count;

        db.get('SELECT COALESCE(SUM(star_count), 0) as total FROM Skills', (err, row) => {
            stats.totalStars = err ? 0 : row.total;

            db.get("SELECT COUNT(*) as count FROM Skills WHERE is_new = 1", (err, row) => {
                stats.newSkills = err ? 0 : row.count;

                // Count by skill type
                db.all(`SELECT skill_type, COUNT(*) as count FROM Skills GROUP BY skill_type ORDER BY count DESC`, (err, typeRows) => {
                    stats.byType = err ? [] : typeRows;

                    // Count by category
                    db.all(`SELECT category, COUNT(*) as count FROM Skills GROUP BY category ORDER BY count DESC`, (err, catRows) => {
                        stats.byCategory = err ? [] : catRows;

                        // Count by tool compatibility
                        const toolCounts = {};
                        db.all(`SELECT compatible_tools FROM Skills`, (err, allRows) => {
                            if (!err && allRows) {
                                for (const row of allRows) {
                                    const tools = safeParseJSON(row.compatible_tools);
                                    for (const t of tools) {
                                        toolCounts[t] = (toolCounts[t] || 0) + 1;
                                    }
                                }
                            }
                            stats.byTool = toolCounts;
                            res.json(stats);
                        });
                    });
                });
            });
        });
    });
});

// GET /api/skills/detail/:owner/:repo - Skill detail
router.get('/detail/:owner/:repo', (req, res) => {
    const { owner, repo } = req.params;
    const fullName = `${owner}/${repo}`;

    db.get(`SELECT * FROM Skills WHERE repo_full_name = ?`, [fullName], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Skill not found' });
        }

        res.json({
            ...row,
            compatible_tools: safeParseJSON(row.compatible_tools),
            tags: safeParseJSON(row.tags),
        });
    });
});

// GET /api/skills/categories - List all categories with counts
router.get('/categories', (req, res) => {
    db.all(`SELECT category, COUNT(*) as count FROM Skills GROUP BY category ORDER BY count DESC`, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

function safeParseJSON(str) {
    try {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

module.exports = router;
