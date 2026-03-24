export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text too long. Maximum 5,000 characters allowed.' });
    }

    // Check if OpenAI API key is available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      // Demo mode - return sample response
      const demoResponse = {
        simplified: `This document is a legal agreement where you (the first party) agree to protect and defend another person or company (the second party) from any legal problems, claims, or costs that might come up.\n\nIn simple terms:\n• If someone sues the second party for something related to this agreement, you will handle the legal costs\n• You will pay for any damages or settlements that result from these legal issues\n• You take responsibility for defending them in court if needed\n\nThis is called an "indemnification clause" and it's commonly found in service contracts, rental agreements, and business partnerships. It's designed to shift legal risk from one party to another.\n\nNote: This is a demo response. Add your OpenAI API key to environment variables to get real AI-powered analysis.`,
        keyPoints: [
          "You agree to protect the other party from legal claims",
          "You will pay for legal costs and damages on their behalf", 
          "This applies to issues related to this specific agreement",
          "You become responsible for their legal defense in related matters",
          "This is a standard risk-shifting clause in contracts"
        ],
        risks: [
          "Unlimited financial liability - costs could be very high",
          "You could pay for problems you didn't directly cause",
          "Legal costs can accumulate quickly even for frivolous claims",
          "You may have little control over how the other party handles situations", 
          "This clause typically favors the other party heavily"
        ]
      };
      
      return res.status(200).json(demoResponse);
    }

    // Real OpenAI processing
    const { Configuration, OpenAIApi } = require('openai');
    
    const configuration = new Configuration({
      apiKey: openaiApiKey,
    });
    
    const openai = new OpenAIApi(configuration);

    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a legal document simplification expert. Your job is to translate complex legal language into plain English that anyone can understand. 

Respond with a JSON object containing:
1. "simplified" - A clear, conversational explanation of what the legal text means (200-400 words)
2. "keyPoints" - An array of 3-7 important points the user should know
3. "risks" - An array of 3-7 potential concerns or risks they should be aware of

Make your explanation:
- Conversational and easy to understand
- Free of legal jargon
- Practical and actionable
- Focused on what matters most to an average person

Do not provide legal advice. Focus on education and understanding.`
        },
        {
          role: "user",
          content: `Please simplify this legal text: ${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const result = completion.data.choices[0].message.content;
    const parsedResult = JSON.parse(result);

    return res.status(200).json(parsedResult);

  } catch (error) {
    console.error('Error processing legal text:', error);
    
    // Fallback to demo response on error
    const demoResponse = {
      simplified: `This document is a legal agreement where you (the first party) agree to protect and defend another person or company (the second party) from any legal problems, claims, or costs that might come up.\n\nIn simple terms:\n• If someone sues the second party for something related to this agreement, you will handle the legal costs\n• You will pay for any damages or settlements that result from these legal issues\n• You take responsibility for defending them in court if needed\n\nThis is called an "indemnification clause" and it's commonly found in service contracts, rental agreements, and business partnerships. It's designed to shift legal risk from one party to another.\n\nNote: This is a demo response due to an API error. The service owner should check the OpenAI configuration.`,
      keyPoints: [
        "You agree to protect the other party from legal claims",
        "You will pay for legal costs and damages on their behalf", 
        "This applies to issues related to this specific agreement",
        "You become responsible for their legal defense in related matters",
        "This is a standard risk-shifting clause in contracts"
      ],
      risks: [
        "Unlimited financial liability - costs could be very high",
        "You could pay for problems you didn't directly cause",
        "Legal costs can accumulate quickly even for frivolous claims",
        "You may have little control over how the other party handles situations", 
        "This clause typically favors the other party heavily"
      ]
    };
    
    return res.status(200).json(demoResponse);
  }
}