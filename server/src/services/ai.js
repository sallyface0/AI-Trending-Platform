const axios = require('axios');
require('dotenv').config();

async function translateToChinese(englishText) {
    if (!englishText) return '';
    
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
        // 如果没有配置真实的API Key，返回模拟数据
        return `[Mock翻译] ${englishText}`;
    }

    try {
        const response = await axios.post(
            process.env.DEEPSEEK_API_URL,
            {
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的技术翻译。请将以下英文项目简介翻译并润色成流畅的简体中文，要求简明扼要。'
                    },
                    {
                        role: 'user',
                        content: englishText
                    }
                ],
                temperature: 0.3
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error translating text with DeepSeek:', error.message);
        // 出错时返回原文
        return englishText;
    }
}

module.exports = {
    translateToChinese
};
