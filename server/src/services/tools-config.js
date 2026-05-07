// AI 工具配置 - 定义平台支持的所有 AI 工具及其抓取策略
const AI_TOOLS = [
    {
        id: 'openclaw',
        name: 'OpenClaw',
        icon: '🐾',
        description: '开源 AI Agent 平台，多渠道智能助手',
        skillsSource: 'clawhub.ai',
        searchQueries: [
            'topic:openclaw-skill',
            'openclaw skill in:name',
            'clawhub in:name,description',
        ],
    },
    {
        id: 'claude-code',
        name: 'Claude Code',
        icon: '🧠',
        description: 'Anthropic 官方 AI 编程助手',
        skillsSource: 'claude.ai/code',
        searchQueries: [
            'claude-code in:name',
            'topic:claude-code',
            'awesome-claude-code in:name',
        ],
    },
    {
        id: 'codex',
        name: 'Codex (OpenAI)',
        icon: '🤖',
        description: 'OpenAI 代码生成与编程助手',
        skillsSource: 'openai.com/codex',
        searchQueries: [
            'codex-agent in:name',
            'topic:openai-codex',
            'openai codex in:description',
        ],
    },
    {
        id: 'cursor',
        name: 'Cursor',
        icon: '📝',
        description: 'AI-first 代码编辑器',
        skillsSource: 'cursor.com',
        searchQueries: [
            'cursor extension in:name,description',
            'cursor-plugin in:name',
            'awesome-cursor in:name',
        ],
    },
    {
        id: 'cline',
        name: 'Cline',
        icon: '⚡',
        description: 'VS Code 自主编码代理插件',
        skillsSource: 'cline.bot',
        searchQueries: [
            'cline in:name,description',
            'topic:cline',
            'cline-plugin in:name',
        ],
    },
    {
        id: 'copilot',
        name: 'GitHub Copilot',
        icon: '🐙',
        description: 'GitHub 官方 AI 编程助手',
        skillsSource: 'github.com/copilot',
        searchQueries: [
            'copilot extension in:name,description',
            'copilot-plugin in:name',
            'github-copilot in:description',
        ],
    },
    {
        id: 'windsurf',
        name: 'Windsurf',
        icon: '🌊',
        description: 'Codeium 出品的 AI IDE',
        skillsSource: 'codeium.com',
        searchQueries: [
            'windsurf extension in:name,description',
            'windsurf-plugin in:name',
            'codeium in:description',
        ],
    },
    {
        id: 'trae',
        name: 'Trae',
        icon: '🔧',
        description: '字节跳动出品的 AI IDE',
        skillsSource: 'trae.ai',
        searchQueries: [
            'trae-ide in:name',
            'topic:trae-ide',
            'trae plugin in:name,description',
        ],
    },
    {
        id: 'mcp',
        name: 'MCP 生态',
        icon: '🔌',
        description: 'Model Context Protocol 通用服务端',
        skillsSource: 'smithery.ai',
        searchQueries: [
            'topic:mcp-server',
            'mcp-server in:name',
            'model-context-protocol in:name,description',
        ],
    },
    {
        id: 'amp',
        name: 'Amp (Sourcegraph)',
        icon: '🔎',
        description: 'Sourcegraph 出品的 AI 编码代理',
        skillsSource: 'ampcode.com',
        searchQueries: [
            'amp-code in:name',
            'sourcegraph amp in:description',
            'ampcode in:name',
        ],
    },
];

// 工具 ID → 兼容工具映射（用于自动判断一个 repo 适用哪些工具）
const TOOL_KEYWORD_MAP = {
    openclaw: ['openclaw', 'clawhub', 'claw', 'agent-skill'],
    'claude-code': ['claude-code', 'claude code', 'claude_code', 'anthropic'],
    codex: ['codex', 'openai-codex', 'openai codex'],
    cursor: ['cursor', 'cursor-', 'cursor_'],
    cline: ['cline', 'cline-'],
    copilot: ['copilot', 'github-copilot'],
    windsurf: ['windsurf', 'codeium'],
    trae: ['trae', 'trae-ide'],
    mcp: ['mcp-server', 'mcp', 'model-context-protocol', 'model context protocol'],
    amp: ['amp-code', 'ampcode', 'sourcegraph-amp'],
};

// 技能分类关键词
const CATEGORY_KEYWORDS = {
    dev: ['code', 'programming', 'debug', 'test', 'lint', 'format', 'git', 'deploy', 'build', 'ci', 'cd', 'docker', 'api', 'sdk'],
    productivity: ['calendar', 'email', 'todo', 'task', 'note', 'reminder', 'schedule', 'workflow', 'automation', 'organize'],
    desktop: ['desktop', 'screen', 'window', 'mouse', 'keyboard', 'gui', 'screenshot', 'clipboard', 'system', 'process'],
    media: ['image', 'video', 'audio', 'tts', 'stt', 'voice', 'music', 'photo', 'media', 'speech', 'whisper'],
    web: ['browser', 'scraping', 'crawl', 'fetch', 'http', 'web', 'search', 'url', 'api-client', 'proxy'],
    data: ['database', 'sql', 'csv', 'excel', 'json', 'xml', 'parse', 'transform', 'etl', 'analytics'],
    document: ['docx', 'pdf', 'markdown', 'document', 'ppt', 'excel', 'office', 'typora', 'editor'],
    system: ['monitor', 'health', 'backup', 'log', 'config', 'admin', 'security', 'firewall', 'ssh'],
};

function categorizeByText(text) {
    const lower = (text || '').toLowerCase();
    let bestCategory = 'other';
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        const score = keywords.filter(kw => lower.includes(kw)).length;
        if (score > bestScore) {
            bestScore = score;
            bestCategory = category;
        }
    }
    return bestCategory;
}

function detectCompatibleTools(text) {
    const lower = (text || '').toLowerCase();
    const compatible = [];

    for (const [toolId, keywords] of Object.entries(TOOL_KEYWORD_MAP)) {
        if (keywords.some(kw => lower.includes(kw))) {
            compatible.push(toolId);
        }
    }
    return compatible;
}

module.exports = {
    AI_TOOLS,
    TOOL_KEYWORD_MAP,
    CATEGORY_KEYWORDS,
    categorizeByText,
    detectCompatibleTools,
};
