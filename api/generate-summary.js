const { OpenAI } = require('openai');

let openai;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text: inputData } = req.body;

    if (!inputData || inputData.trim().length === 0) {
        return res.status(400).json({ error: 'Input text is required' });
    }

    try {
        // Demo mode fallback when no API key
        if (!openai) {
            return res.json({
                result: `**SUMMARY:**\n\n**Main Topic:** Climate Change Impact on Global Ecosystems\n\n**Key Points:**\n• Rising global temperatures causing 30% decline in Arctic ice coverage\n• Ocean acidification affecting marine biodiversity in 15+ regions\n• Extreme weather events increased by 40% over past decade\n• Agricultural yields threatened in developing nations\n\n**Critical Insights:**\n• Immediate action required to limit warming to 1.5°C\n• Renewable energy adoption accelerating but needs 3x current pace\n• Adaptation strategies essential for vulnerable communities\n\n**Conclusion:**\nUrgent coordinated global response needed combining mitigation and adaptation strategies to address accelerating climate impacts.`,
                demo: true,
                message: "This is a demo response. Add OPENAI_API_KEY environment variable for live AI generation."
            });
        }

        // Real OpenAI API call
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an expert text analyst and summarization specialist. Create concise, accurate summaries that capture the most important points, key insights, and main conclusions. Organize information hierarchically with bullet points when appropriate.`
                },
                {
                    role: "user", 
                    content: inputData
                }
            ],
            max_tokens: 2000,
            temperature: 0.7,
        });

        const result = completion.choices[0].message.content;

        res.json({
            result: result,
            demo: false
        });

    } catch (error) {
        console.error('Error:', error);
        
        // Fallback to demo response on error
        res.json({
            result: `**SUMMARY:**\n\n**Main Topic:** Climate Change Impact on Global Ecosystems\n\n**Key Points:**\n• Rising global temperatures causing 30% decline in Arctic ice coverage\n• Ocean acidification affecting marine biodiversity in 15+ regions\n• Extreme weather events increased by 40% over past decade\n• Agricultural yields threatened in developing nations\n\n**Critical Insights:**\n• Immediate action required to limit warming to 1.5°C\n• Renewable energy adoption accelerating but needs 3x current pace\n• Adaptation strategies essential for vulnerable communities\n\n**Conclusion:**\nUrgent coordinated global response needed combining mitigation and adaptation strategies to address accelerating climate impacts.`,
            demo: true,
            message: "Temporary issue with AI service. Showing demo response.",
            error: error.message
        });
    }
}