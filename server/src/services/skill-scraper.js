const axios = require('axios');
const db = require('../db/database');
const { translateToChinese } = require('./ai');
const { AI_TOOLS, categorizeByText, detectCompatibleTools } = require('./tools-config');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

function getHeaders() {
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AI-Trending-Platform/1.0',
    };
    if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }
    return headers;
}

// Search GitHub repos by query
async function searchRepos(query, perPage = 30) {
    const url = `https://api.github.com/search/repositories`;
    const response = await axios.get(url, {
        headers: getHeaders(),
        params: {
            q: query,
            sort: 'stars',
            order: 'desc',
            per_page: Math.min(perPage, 100),
        },
    });
    return response.data.items || [];
}

// Fetch skills from ClawHub (OpenClaw skills marketplace)
async function fetchFromClawHub() {
    try {
        // Search GitHub for openclaw-related repos
        const queries = [
            'topic:openclaw-skill stars:>1',
            'openclaw skill in:name,description stars:>1',
            'clawhub in:name,description stars:>1',
        ];

        const allItems = [];
        for (const q of queries) {
            try {
                const items = await searchRepos(q, 30);
                allItems.push(...items);
                await sleep(1500);
            } catch (err) {
                console.error(`[SkillScraper] ClawHub query failed: ${q}`, err.message);
            }
        }
        return allItems;
    } catch (err) {
        console.error('[SkillScraper] ClawHub fetch error:', err.message);
        return [];
    }
}

// Fetch MCP servers from GitHub
async function fetchMCPServers() {
    try {
        const queries = [
            'topic:mcp-server stars:>5',
            'topic:model-context-protocol stars:>5',
            'mcp-server in:name stars:>10',
        ];

        const allItems = [];
        for (const q of queries) {
            try {
                const items = await searchRepos(q, 30);
                allItems.push(...items);
                await sleep(1500);
            } catch (err) {
                console.error(`[SkillScraper] MCP query failed: ${q}`, err.message);
            }
        }
        return allItems;
    } catch (err) {
        console.error('[SkillScraper] MCP fetch error:', err.message);
        return [];
    }
}

// Fetch tool-specific skills/plugins/extensions
async function fetchToolSkills(tool) {
    const allItems = [];
    for (const query of tool.searchQueries) {
        try {
            const items = await searchRepos(query + ' stars:>3', 20);
            allItems.push(...items);
            await sleep(1500);
        } catch (err) {
            console.error(`[SkillScraper] Query failed for ${tool.id}: ${query}`, err.message);
        }
    }
    return allItems;
}

// Main fetch function
async function fetchSkillsAndMCPs(onStatus) {
    const report = (task, progress) => {
        console.log(`[SkillScraper] ${task} ${progress || ''}`);
        if (onStatus) onStatus(task, progress);
    };

    report('正在抓取 Skills & MCP 数据...');

    try {
        const allItems = [];

        // Source 1: ClawHub / OpenClaw skills
        report('正在抓取 OpenClaw Skills...', '1/4');
        const clawItems = await fetchFromClawHub();
        clawItems.forEach(item => { item._defaultTool = 'openclaw'; });
        allItems.push(...clawItems);
        report(`OpenClaw Skills: ${clawItems.length} 个`);

        // Source 2: MCP servers
        report('正在抓取 MCP 服务端...', '2/4');
        const mcpItems = await fetchMCPServers();
        mcpItems.forEach(item => { item._defaultTool = 'mcp'; });
        allItems.push(...mcpItems);
        report(`MCP 服务端: ${mcpItems.length} 个`);

        // Source 3: Tool-specific skills (skip openclaw and mcp, already done)
        const toolsToFetch = AI_TOOLS.filter(t => t.id !== 'openclaw' && t.id !== 'mcp');
        let toolIdx = 0;
        for (const tool of toolsToFetch) {
            toolIdx++;
            report(`正在抓取 ${tool.name} 相关扩展...`, `3/4 (${toolIdx}/${toolsToFetch.length})`);
            const toolItems = await fetchToolSkills(tool);
            toolItems.forEach(item => { item._defaultTool = tool.id; });
            allItems.push(...toolItems);
        }

        // Source 4: Awesome lists
        report('正在抓取 Awesome Lists...', '4/4');
        const awesomeQueries = [
            'awesome-ai-tools in:name stars:>50',
            'awesome-llm in:name stars:>100',
            'awesome-gpt in:name stars:>50',
            'awesome-copilot in:name stars:>10',
        ];
        for (const q of awesomeQueries) {
            try {
                const items = await searchRepos(q, 10);
                allItems.push(...items);
                await sleep(1500);
            } catch (err) {
                console.error(`[SkillScraper] Awesome query failed: ${q}`, err.message);
            }
        }

        // Deduplicate
        const uniqueMap = new Map();
        for (const item of allItems) {
            if (!item.full_name) continue;
            const key = item.full_name.toLowerCase();
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, item);
            }
        }

        const uniqueItems = Array.from(uniqueMap.values());
        report(`去重完成，共 ${uniqueItems.length} 个独立项目，正在入库...`);

        // Process
        let processed = 0;
        let newCount = 0;
        for (const repo of uniqueItems) {
            try {
                const isNew = await processSkillRepo(repo);
                if (isNew) newCount++;
                processed++;
                if (processed % 10 === 0 || processed === uniqueItems.length) {
                    report(`正在入库...`, `${processed}/${uniqueItems.length} (新增 ${newCount})`);
                }
            } catch (err) {
                console.error(`[SkillScraper] Error processing ${repo.full_name}:`, err.message);
            }
        }

        report(`Skills 抓取完成！新增 ${newCount} 个，更新 ${processed - newCount} 个`);
        return { processed, newCount };
    } catch (error) {
        const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error('[SkillScraper] Fatal error:', errMsg);
        throw new Error(errMsg);
    }
}

function processSkillRepo(repo) {
    return new Promise((resolve, reject) => {
        const fullName = repo.full_name;
        const name = repo.name;
        const owner = repo.owner.login;
        const descEn = repo.description || '';
        const stars = repo.stargazers_count;
        const forks = repo.forks_count || 0;
        const language = repo.language || 'Unknown';
        const htmlUrl = repo.html_url || `https://github.com/${fullName}`;
        const avatarUrl = repo.owner.avatar_url || '';
        const createdAt = repo.created_at || null;
        const updatedAt = repo.updated_at || null;

        // Auto-detect properties
        const textForAnalysis = `${name} ${descEn} ${(repo.topics || []).join(' ')}`;
        const category = categorizeByText(textForAnalysis);
        const compatibleTools = detectCompatibleTools(textForAnalysis);
        const defaultTool = repo._defaultTool;

        // If no tools detected from text, use the default tool from the source
        if (compatibleTools.length === 0 && defaultTool) {
            compatibleTools.push(defaultTool);
        }

        // Determine skill type
        let skillType = 'skill';
        const lowerText = textForAnalysis.toLowerCase();
        if (lowerText.includes('mcp-server') || lowerText.includes('model context protocol')) {
            skillType = 'mcp';
        } else if (lowerText.includes('extension') || lowerText.includes('plugin')) {
            skillType = 'extension';
        } else if (lowerText.includes('awesome-') || lowerText.includes('awesome ')) {
            skillType = 'awesome-list';
        }

        // Generate install command
        let installCommand = '';
        if (compatibleTools.includes('openclaw')) {
            installCommand = `openclaw skill install ${name}`;
        } else if (skillType === 'mcp') {
            installCommand = `npx ${name}`;
        }

        // Check if new (created within 30 days)
        const ageDays = createdAt
            ? (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
            : 999;
        const isNew = ageDays <= 30 ? 1 : 0;

        // Calculate popularity score
        const starScore = Math.log10(Math.max(stars, 1)) / 5;
        const recencyBonus = Math.max(0, 1 - (ageDays / 90));
        const forkScore = Math.log10(Math.max(forks, 1)) / 5;
        const popularity = starScore * 0.5 + recencyBonus * 0.3 + forkScore * 0.2;

        // Tags from topics
        const tags = JSON.stringify(repo.topics || []);

        db.get(
            `SELECT id, description_en, star_count FROM Skills WHERE repo_full_name = ?`,
            [fullName],
            async (err, row) => {
                if (err) return reject(err);

                if (row) {
                    const updateQuery = `
                        UPDATE Skills
                        SET star_count = ?, forks_count = ?, language = ?,
                            compatible_tools = ?, category = ?, tags = ?,
                            is_new = ?, popularity_score = ?,
                            updated_at = ?, fetched_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `;
                    db.run(updateQuery, [
                        stars, forks, language,
                        JSON.stringify(compatibleTools), category, tags,
                        isNew, popularity,
                        updatedAt, row.id
                    ], function (err) {
                        if (err) return reject(err);
                        resolve(false);
                    });
                } else {
                    let descCn = '';
                    try {
                        if (descEn) {
                            descCn = await translateToChinese(descEn);
                        }
                    } catch (e) {
                        descCn = descEn;
                    }

                    const insertQuery = `
                        INSERT INTO Skills
                        (repo_full_name, name, owner, description_en, description_cn,
                         star_count, forks_count, language, skill_type,
                         compatible_tools, category, tags, install_command,
                         is_new, popularity_score, url, avatar_url,
                         created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    db.run(insertQuery, [
                        fullName, name, owner, descEn, descCn,
                        stars, forks, language, skillType,
                        JSON.stringify(compatibleTools), category, tags, installCommand,
                        isNew, popularity, htmlUrl, avatarUrl,
                        createdAt, updatedAt
                    ], function (err) {
                        if (err) return reject(err);
                        console.log(`[SkillScraper] New: ${fullName} (${stars}⭐, type=${skillType})`);
                        resolve(true);
                    });
                }
            }
        );
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { fetchSkillsAndMCPs };
