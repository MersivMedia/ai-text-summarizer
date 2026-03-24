// Full Resume Generator API Endpoint

// Rate limiting - per minute and daily caps
const rateLimit = new Map();
const dailyUsage = new Map();

const RATE_LIMIT_PER_MIN = 5;
const RATE_WINDOW = 60 * 1000;
const DAILY_LIMIT = 2;  // Tight limit - encourages return visits, reduces costs
const DAY_MS = 24 * 60 * 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  
  const requests = (rateLimit.get(ip) || []).filter(t => t > now - RATE_WINDOW);
  if (requests.length >= RATE_LIMIT_PER_MIN) {
    return { allowed: false, reason: 'rate', remaining: 0 };
  }
  
  const dailyData = dailyUsage.get(ip) || { count: 0, resetAt: now + DAY_MS };
  
  if (now > dailyData.resetAt) {
    dailyData.count = 0;
    dailyData.resetAt = now + DAY_MS;
  }
  
  if (dailyData.count >= DAILY_LIMIT) {
    return { allowed: false, reason: 'daily', remaining: 0 };
  }
  
  requests.push(now);
  rateLimit.set(ip, requests);
  
  dailyData.count++;
  dailyUsage.set(ip, dailyData);
  
  return { allowed: true, remaining: DAILY_LIMIT - dailyData.count };
}

const SYSTEM_PROMPT = `You are an elite professional resume writer with 20+ years of experience helping candidates land jobs at top companies. Your task is to generate a complete, ATS-optimized, professional resume.

## YOUR EXPERTISE:
- Expert at transforming basic job descriptions into powerful achievement statements
- Deep knowledge of ATS (Applicant Tracking System) optimization
- Skilled at quantifying achievements with metrics and numbers
- Master of industry-specific terminology and keywords

## RESUME WRITING RULES:

### Professional Summary (2-3 sentences):
- Start with years of experience + professional title
- Highlight 2-3 key achievements or specialties
- Include relevant industry keywords
- Make it compelling and specific, not generic

### Work Experience Bullets:
- Start EVERY bullet with a strong action verb (Led, Drove, Spearheaded, Delivered, Implemented, Achieved, etc.)
- Include SPECIFIC METRICS in every bullet (%, $, numbers, time saved)
- Focus on ACHIEVEMENTS and IMPACT, not just duties
- Use the CAR format: Challenge → Action → Result
- Keep bullets to 1-2 lines max
- Use industry-appropriate terminology

### Bullet Transformation Examples:
❌ "Managed a team" 
✅ "Led cross-functional team of 12 engineers, delivering 8 major product releases on schedule with 99.5% uptime"

❌ "Responsible for sales"
✅ "Drove $3.2M in annual revenue growth through strategic enterprise account development, exceeding quota by 145%"

❌ "Handled customer service"
✅ "Resolved 200+ customer inquiries weekly with 98% satisfaction rating, reducing escalations by 40%"

❌ "Worked on marketing campaigns"
✅ "Spearheaded digital marketing campaigns reaching 2M+ users, generating 50% increase in qualified leads and $500K pipeline"

### Skills Section:
- List 8-12 most relevant technical and soft skills
- Prioritize skills mentioned in typical job postings for this role
- Include industry-standard tools and technologies
- Mix hard skills and soft skills appropriately

## OUTPUT FORMAT:
You MUST respond with valid JSON matching this exact structure:

{
  "summary": "Professional summary paragraph (2-3 impactful sentences)",
  "experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "location": "City, State",
      "startDate": "MMM YYYY",
      "endDate": "MMM YYYY or Present",
      "bullets": [
        "Achievement-focused bullet with metrics",
        "Achievement-focused bullet with metrics",
        "Achievement-focused bullet with metrics",
        "Achievement-focused bullet with metrics"
      ]
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3", "..."]
}

## IMPORTANT:
- Generate 4-5 strong bullets per job
- If user provides weak bullets, TRANSFORM them into powerful achievements
- If user provides minimal info, INFER reasonable achievements based on the role/industry
- Estimate realistic metrics based on job title and company size
- Make the candidate sound proactive, results-driven, and valuable`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
  const limitCheck = checkRateLimit(ip);
  
  if (!limitCheck.allowed) {
    const errorMsg = limitCheck.reason === 'daily' 
      ? 'Daily limit reached (2 resumes). Please come back tomorrow!'
      : 'Too many requests. Please wait a minute and try again.';
    
    return res.status(429).json({ error: errorMsg });
  }

  try {
    const { personalInfo, experience, education, skills, targetRole, targetIndustry } = req.body;

    // Validation
    if (!personalInfo || !personalInfo.name) {
      return res.status(400).json({ error: 'Please provide your name' });
    }

    if (!experience || !Array.isArray(experience) || experience.length === 0) {
      return res.status(400).json({ error: 'Please add at least one work experience' });
    }

    // Build the user prompt with all their info
    const userPrompt = `Generate a professional resume for the following candidate:

## TARGET POSITION
Role: ${targetRole || 'Not specified'}
Industry: ${targetIndustry || 'Not specified'}

## CANDIDATE INFORMATION
Name: ${personalInfo.name}
${personalInfo.email ? `Email: ${personalInfo.email}` : ''}
${personalInfo.phone ? `Phone: ${personalInfo.phone}` : ''}
${personalInfo.location ? `Location: ${personalInfo.location}` : ''}
${personalInfo.linkedin ? `LinkedIn: ${personalInfo.linkedin}` : ''}

## WORK EXPERIENCE
${experience.map((job, i) => `
### Job ${i + 1}
Company: ${job.company || 'Company not specified'}
Title: ${job.title || 'Title not specified'}
Location: ${job.location || ''}
Duration: ${job.startDate || ''} - ${job.endDate || 'Present'}
${job.description ? `Description/Duties: ${job.description}` : ''}
${job.bullets && job.bullets.length > 0 ? `Current bullets:\n${job.bullets.map(b => `- ${b}`).join('\n')}` : ''}
`).join('\n')}

## EDUCATION
${education && education.length > 0 ? education.map(edu => `
- ${edu.degree || ''} ${edu.field ? `in ${edu.field}` : ''} from ${edu.school || 'School not specified'}${edu.graduationDate ? ` (${edu.graduationDate})` : ''}${edu.gpa ? ` - GPA: ${edu.gpa}` : ''}
`).join('') : 'Not provided'}

## SKILLS (user provided)
${skills && skills.length > 0 ? skills.join(', ') : 'Not provided - please suggest appropriate skills'}

---

Now generate a complete, polished, ATS-optimized resume. Transform any weak bullets into powerful achievement statements with metrics. Return valid JSON only.`;

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'API configuration error' });
    }

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenAI API error:', errorText);
      return res.status(503).json({ error: 'AI service temporarily unavailable. Please try again.' });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      return res.status(500).json({ error: 'Failed to generate resume' });
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return res.status(500).json({ error: 'Failed to process AI response' });
    }

    // Return the generated resume data
    return res.status(200).json({
      success: true,
      resume: {
        personalInfo,
        summary: result.summary || '',
        experience: result.experience || [],
        education: education || [],
        skills: result.skills || skills || []
      },
      remaining: limitCheck.remaining
    });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
