const { OpenAI } = require('openai');

let openai;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text: inputData } = req.body;

    if (!inputData || inputData.trim().length === 0) {
        return res.status(400).json({ error: 'Input data is required' });
    }

    try {
        // Demo response when no OpenAI key
        if (!openai) {
            console.log('No OpenAI API key found, returning demo response');
            return res.json(getDemoResponse(inputData));
        }

        // Real OpenAI API call would go here
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: getSystemPrompt()
                },
                {
                    role: "user",
                    content: getUserPrompt(inputData)
                }
            ],
            max_tokens: 2000,
            temperature: 0.7,
        });

        // Parse and return AI response
        const result = parseAIResponse(completion.choices[0].message.content);
        res.json(result);

    } catch (error) {
        console.error('AI generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate content',
            details: error.message 
        });
    }
}

function getSystemPrompt() {
    // Tool-specific expert system prompt
    return "You are a professional ai text summarizer expert...";
}

function getUserPrompt(inputData) {
    // Tool-specific user prompt
    return `Create professional content based on: ${inputData}`;
}

function getDemoResponse(inputData) {
    // Tool-specific demo response
    return { message: "Demo response for ai-text-summarizer" };
}

function parseAIResponse(content) {
    // Parse AI response into structured format
    return { content: content };
}