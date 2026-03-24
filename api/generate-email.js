const OpenAI = require('openai');

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Invalid input text' });
        }

        if (text.length > 2000) {
            return res.status(400).json({ error: 'Text too long. Maximum 2,000 characters allowed.' });
        }

        // Rate limiting: 3 emails per day per IP
        const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
        const today = new Date().toDateString();
        const rateLimitKey = `${clientIP}_${today}`;

        if (!global.rateLimitStore) {
            global.rateLimitStore = {};
        }

        if (!global.rateLimitStore[rateLimitKey]) {
            global.rateLimitStore[rateLimitKey] = 0;
        }

        if (global.rateLimitStore[rateLimitKey] >= 3) {
            return res.status(429).json({ 
                error: 'Rate limit exceeded',
                message: 'You have reached your daily limit of 3 emails. Please try again tomorrow!'
            });
        }

        global.rateLimitStore[rateLimitKey]++;

        // Check if OpenAI API key is available
        const openaiApiKey = process.env.OPENAI_API_KEY;
        
        if (!openaiApiKey) {
            // Demo mode - return sample response
            const demoResponse = {
                email: `Subject: Following Up on Our Project Discussion

Dear [Recipient Name],

I hope this email finds you well. I wanted to follow up on our recent conversation about the project delays we discussed.

After reviewing the situation, I understand that there have been some unforeseen challenges that have impacted our original timeline. I appreciate your patience as we work through these issues.

I'd like to schedule a brief call this week to discuss:
• Revised project timeline and milestones
• Resource allocation adjustments
• Communication protocols moving forward

Please let me know your availability for a 30-minute discussion. I'm flexible with timing and can accommodate your schedule.

Thank you for your continued partnership and understanding.

Best regards,
[Your Name]
[Your Title]
[Your Contact Information]

---
This is a demo email generated for testing purposes. Add your OpenAI API key to get AI-powered email generation.`,
                tone: "Professional and courteous",
                purpose: "Follow-up communication addressing project delays",
                structure: "Clear subject line, polite opening, specific discussion points, call-to-action"
            };
            
            return res.status(200).json(demoResponse);
        }

        // Initialize OpenAI
        const openai = new OpenAI({
            apiKey: openaiApiKey
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a professional business communication expert with 15+ years of experience writing effective emails. Create professional, well-structured emails that achieve their intended purpose.

Requirements:
1) Include appropriate subject line
2) Professional yet personable tone
3) Clear structure with logical flow
4) Specific call-to-action when appropriate
5) Proper business email formatting
6) Considerate of recipient's time
7) Error-free grammar and spelling

Format your response as a complete email with subject line and properly formatted content.`
                },
                {
                    role: "user", 
                    content: text
                }
            ],
            max_tokens: 2500,
            temperature: 0.7
        });

        const emailContent = completion.choices[0].message.content;

        // Extract subject line and body
        const lines = emailContent.split('\n');
        const subjectLine = lines.find(line => line.toLowerCase().startsWith('subject:'))?.replace(/^subject:\s*/i, '') || 'Professional Email';
        const bodyStart = lines.findIndex(line => line.toLowerCase().startsWith('subject:')) + 1;
        const emailBody = lines.slice(bodyStart).join('\n').trim();

        const response = {
            email: emailContent,
            subject: subjectLine,
            body: emailBody,
            tone: "Professional",
            wordCount: emailContent.split(' ').length
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: 'Failed to generate email. Please try again.' 
        });
    }
}