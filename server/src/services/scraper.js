const axios = require('axios');
const db = require('../db/database');
const { translateToChinese } = require('./ai');

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

// ============================================================
// Strategy 1: GitHub Search API — find hot repos by stars
// ============================================================

async function searchByTopic(topic, dateRange, perPage = 50) {
    const dateThreshold = new Date();
    const daysMap = { today: 1, week: 7, month: 30, year: 365 };
    const days = daysMap[dateRange] || 365;
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const dateStr = dateThreshold.toISOString().split('T')[0];

    const query = `topic:${topic} pushed:>${dateStr}`;
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

async function searchByKeyword(keyword, dateRange, perPage = 30) {
    const dateThreshold = new Date();
    const daysMap = { today: 1, week: 7, month: 30, year: 365 };
    const days = daysMap[dateRange] || 365;
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const dateStr = dateThreshold.toISOString().split('T')[0];

    const query = `${keyword} in:name,description pushed:>${dateStr} stars:>100`;
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

// ============================================================
// Strategy 2: GitHub Search API — simulate trending by stars in date range
// ============================================================

async function fetchTrendingSince(since = 'daily') {
    const daysMap = { daily: 1, weekly: 7, monthly: 30 };
    const days = daysMap[since] || 1;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const dateStr = dateThreshold.toISOString().split('T')[0];

    const query = `stars:>10 pushed:>${dateStr}`;
    const url = `https://api.github.com/search/repositories`;

    try {
        const response = await axios.get(url, {
            headers: getHeaders(),
            params: {
                q: query,
                sort: 'stars',
                order: 'desc',
                per_page: 50,
            },
            timeout: 15000,
        });

        const items = (response.data.items || []).filter(isAIRelated);
        return items.map(item => ({
            full_name: item.full_name,
            name: item.name,
            owner: { login: item.owner.login, avatar_url: item.owner.avatar_url || '' },
            description: item.description || '',
            stargazers_count: item.stargazers_count || 0,
            forks_count: item.forks_count || 0,
            open_issues_count: item.open_issues_count || 0,
            language: item.language || 'Unknown',
            html_url: item.html_url || `https://github.com/${item.full_name}`,
            topics: item.topics || [],
            homepage: item.homepage || '',
            created_at: item.created_at || null,
            updated_at: item.updated_at || null,
            _trending_stars: item.stargazers_count || 0,
        }));
    } catch (err) {
        console.error(`[Scraper] Trending ${since} fetch failed:`, err.message);
        return [];
    }
}

// ============================================================
// Main fetch function
// ============================================================

async function fetchTrendingAIProjects(onStatus) {
    const report = (task, progress) => {
        console.log(`[Scraper] ${task} ${progress || ''}`);
        if (onStatus) onStatus(task, progress);
    };

    report('正在初始化抓取任务...');

    try {
        // We collect items tagged by their source range
        // daily → today, weekly → week, monthly → month, search → all
        const itemsByRange = { today: [], week: [], month: [], all: [] };

        // --- Source 1: GitHub Search by date range (simulates trending) ---
        report('正在搜索近期热门项目...', '1/3');

        const trendingMap = { daily: 'today', weekly: 'week', monthly: 'month' };
        for (const [since, rangeTag] of Object.entries(trendingMap)) {
            try {
                const items = await fetchTrendingSince(since);
                items.forEach(item => { item._range = rangeTag; });
                itemsByRange[rangeTag].push(...items);
                console.log(`[Scraper] Trending ${since}: ${items.length} AI projects → tagged as '${rangeTag}'`);
                await sleep(1500);
            } catch (err) {
                console.error(`[Scraper] Trending ${since} error:`, err.message);
            }
        }
        const trendingTotal = Object.values(itemsByRange).reduce((sum, arr) => sum + arr.length, 0);
        report(`Trending 榜单抓取完成，找到 ${trendingTotal} 个项目`);

        // --- Source 2: GitHub Search by AI topics (tag as 'all' since they span all ranges) ---
        report('正在搜索 AI 热门主题...', '2/3');
        const aiTopics = ['artificial-intelligence', 'machine-learning', 'deep-learning', 'llm', 'large-language-model'];
        for (const topic of aiTopics) {
            try {
                const items = await searchByTopic(topic, 'week', 30);
                items.forEach(item => { item._range = 'all'; });
                itemsByRange.all.push(...items);
                await sleep(1500);
            } catch (err) {
                console.error(`[Scraper] Topic ${topic} error:`, err.message);
            }
        }

        // --- Source 3: GitHub Search by keywords (tag as 'all') ---
        report('正在搜索 AI 关键词...', '3/3');
        const keywords = ['AI agent', 'LLM framework', 'RAG', 'AI coding', 'generative AI'];
        for (const kw of keywords) {
            try {
                const items = await searchByKeyword(kw, 'month', 20);
                items.forEach(item => { item._range = 'all'; });
                itemsByRange.all.push(...items);
                await sleep(1500);
            } catch (err) {
                console.error(`[Scraper] Keyword ${kw} error:`, err.message);
            }
        }

        // Merge all, but preserve the BEST range tag for each item
        // Priority: today > week > month > all
        const rangePriority = { today: 4, week: 3, month: 2, all: 1 };
        const uniqueMap = new Map();

        for (const [range, items] of Object.entries(itemsByRange)) {
            for (const item of items) {
                if (!item.full_name) continue;
                const key = item.full_name.toLowerCase();
                const existing = uniqueMap.get(key);
                if (!existing || rangePriority[range] > rangePriority[existing._range]) {
                    item._range = range; // keep the best range
                    uniqueMap.set(key, item);
                }
            }
        }

        const uniqueItems = Array.from(uniqueMap.values());
        report(`去重完成，共 ${uniqueItems.length} 个独立项目，正在入库...`);

        // Count by range
        const rangeCounts = {};
        for (const item of uniqueItems) {
            rangeCounts[item._range] = (rangeCounts[item._range] || 0) + 1;
        }
        console.log('[Scraper] Range distribution:', rangeCounts);

        // Process
        let processed = 0;
        let newCount = 0;
        for (const repo of uniqueItems) {
            try {
                const isNew = await processRepo(repo);
                if (isNew) newCount++;
                processed++;
                if (processed % 10 === 0 || processed === uniqueItems.length) {
                    report(`正在入库...`, `${processed}/${uniqueItems.length} (新增 ${newCount})`);
                }
            } catch (err) {
                console.error(`[Scraper] Error processing ${repo.full_name}:`, err.message);
            }
        }

        report(`抓取完成！新增 ${newCount} 个项目，更新 ${processed - newCount} 个`);
    } catch (error) {
        const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error('[Scraper] Fatal error:', errMsg);
        throw new Error(errMsg);
    }
}

function isAIRelated(repo) {
    const text = [
        repo.name || '',
        repo.description || '',
        repo.language || '',
        ...(repo.topics || []),
    ].join(' ').toLowerCase();

    const aiKeywords = [
        'ai', 'artificial-intelligence', 'machine-learning', 'deep-learning',
        'llm', 'gpt', 'chatgpt', 'openai', 'claude', 'gemini',
        'neural', 'transformer', 'diffusion', 'nlp', 'computer-vision',
        'rag', 'agent', 'langchain', 'stable-diffusion', 'midjourney',
        'generative', 'foundation-model', 'fine-tun', 'lora', 'embedding',
        'vector-database', 'ml', 'deep-learn', 'reinforcement-learn',
        'huggingface', 'ollama', 'vllm', 'tensorflow', 'pytorch',
    ];

    return aiKeywords.some(kw => text.includes(kw));
}

function processRepo(repo) {
    return new Promise((resolve, reject) => {
        const fullName = repo.full_name;
        const name = repo.name;
        const owner = repo.owner.login;
        const descEn = repo.description || '';
        const stars = repo.stargazers_count;
        const forks = repo.forks_count || 0;
        const issues = repo.open_issues_count || 0;
        const language = repo.language || 'Unknown';
        const htmlUrl = repo.html_url || `https://github.com/${fullName}`;
        const topics = JSON.stringify(repo.topics || []);
        const avatarUrl = repo.owner.avatar_url || '';
        const homepage = repo.homepage || '';
        const createdAt = repo.created_at || null;
        const updatedAt = repo.updated_at || null;
        const trendingStars = repo._trending_stars || 0;
        const range = repo._range || 'all';

        db.get(
            `SELECT id, description_en, star_count, trending_range FROM Projects WHERE repo_full_name = ?`,
            [fullName],
            async (err, row) => {
                if (err) return reject(err);

                if (row) {
                    // Update existing - preserve the best range tag
                    const existingRange = row.trending_range || 'all';
                    const rangePriority = { today: 4, week: 3, month: 2, all: 1 };
                    const bestRange = (rangePriority[range] > rangePriority[existingRange]) ? range : existingRange;
                    const starDelta = stars - (row.star_count || 0);

                    const updateQuery = `
                        UPDATE Projects
                        SET star_count = ?, forks_count = ?, open_issues_count = ?,
                            topics = ?, avatar_url = ?, homepage = ?,
                            updated_at = ?, fetched_at = CURRENT_TIMESTAMP,
                            star_delta = ?, trending_stars = ?, trending_range = ?
                        WHERE id = ?
                    `;
                    db.run(updateQuery, [stars, forks, issues, topics, avatarUrl, homepage,
                        updatedAt, starDelta, trendingStars, bestRange, row.id], function (err) {
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
                        descCn = '[翻译失败] ' + descEn;
                    }

                    const insertQuery = `
                        INSERT INTO Projects
                        (repo_full_name, name, owner, description_en, description_cn,
                         star_count, forks_count, open_issues_count, language, topics,
                         url, avatar_url, homepage, created_at, updated_at,
                         star_delta, trending_stars, trending_range)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    db.run(insertQuery, [
                        fullName, name, owner, descEn, descCn,
                        stars, forks, issues, language, topics,
                        htmlUrl, avatarUrl, homepage, createdAt, updatedAt,
                        0, trendingStars, range
                    ], function (err) {
                        if (err) return reject(err);
                        console.log(`[Scraper] New: ${fullName} (${stars}⭐, range=${range})`);
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

module.exports = { fetchTrendingAIProjects };
