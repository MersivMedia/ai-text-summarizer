# ResumeGlow.com - Build Plan

## Overview

**Product:** AI-powered resume bullet point improver with .docx export
**Monetization:** Google AdSense (employment niche = 3x CPCs)
**Tech Stack:** 
- Frontend: Vanilla HTML/CSS/JS
- Backend: Vercel Edge/Serverless Functions
- AI: OpenAI gpt-4o-mini
- Doc Gen: docx npm package

---

## User Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. Landing Page                                        │
│     - Hero: "Transform Weak Resume Bullets into        │
│              Interview-Winning Achievements"            │
│     - [Top Leaderboard Ad]                             │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  2. Input Section                                       │
│     - Job Title (dropdown/text)                        │
│     - Industry (dropdown)                              │
│     - Paste current bullets (textarea)                 │
│     - [Improve My Resume] button                       │
│     - [Sidebar Ads]                                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  3. Results Section                                     │
│     - Original vs Improved (side by side)              │
│     - Edit improved bullets inline                     │
│     - [Regenerate] individual bullets                  │
│     - [In-Content Ad after results]                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  4. Export Section                                      │
│     - Preview formatted resume section                 │
│     - [Download as .docx] button                       │
│     - [Copy to Clipboard] button                       │
│     - [Start Over] button                              │
└─────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### Project Structure

```
resume-glow/
├── index.html              # Main page
├── styles.css              # Styles (can inline in HTML)
├── app.js                  # Frontend logic
├── api/
│   ├── improve.js          # AI bullet improvement endpoint
│   └── generate-doc.js     # .docx generation endpoint
├── vercel.json             # Vercel config
├── package.json            # Dependencies
├── privacy.html            # Privacy policy (required for AdSense)
├── terms.html              # Terms of service
└── favicon.svg             # Favicon
```

### API Endpoints

#### POST /api/improve
**Input:**
```json
{
  "bullets": ["Managed team of developers", "Increased sales"],
  "jobTitle": "Software Engineering Manager",
  "industry": "Technology"
}
```

**Output:**
```json
{
  "improved": [
    "Led cross-functional team of 8 developers, delivering 12 projects on-time with 99.5% client satisfaction",
    "Drove 47% increase in quarterly sales through implementation of data-driven outreach strategy"
  ],
  "tips": ["Add specific metrics", "Use strong action verbs"]
}
```

#### POST /api/generate-doc
**Input:**
```json
{
  "bullets": ["Improved bullet 1", "Improved bullet 2"],
  "jobTitle": "Software Engineering Manager",
  "company": "Optional Company Name"
}
```

**Output:** Binary .docx file download

---

## Build Phases

### Phase 1: Project Setup (30 min)
- [ ] Create project directory structure
- [ ] Initialize package.json with dependencies
- [ ] Set up vercel.json configuration
- [ ] Create base HTML template from our ad-optimized template

### Phase 2: Frontend UI (1 hour)
- [ ] Adapt template for resume tool
- [ ] Create input form (job title, industry, bullets textarea)
- [ ] Create results display (original vs improved)
- [ ] Add inline editing capability
- [ ] Style for mobile-first (63% of traffic)

### Phase 3: AI Integration (1 hour)
- [ ] Create /api/improve endpoint
- [ ] Write optimized prompt for resume bullets
- [ ] Add rate limiting (20 requests/min per IP)
- [ ] Handle errors gracefully
- [ ] Test with various inputs

### Phase 4: Document Generation (1 hour)
- [ ] Install docx npm package
- [ ] Create /api/generate-doc endpoint
- [ ] Design professional document template
- [ ] Implement download functionality
- [ ] Add copy-to-clipboard fallback

### Phase 5: Polish & SEO (1 hour)
- [ ] Add loading states and animations
- [ ] Create privacy.html and terms.html
- [ ] Add meta tags, Open Graph, schema markup
- [ ] Write FAQ section (SEO value)
- [ ] Add example inputs for first-time users
- [ ] Test on mobile devices

### Phase 6: Deploy & Launch (30 min)
- [ ] Deploy to Vercel
- [ ] Set up custom domain
- [ ] Configure AdSense ad units
- [ ] Submit to Google Search Console
- [ ] Submit to AI tool directories

---

## AI Prompt Engineering

### System Prompt
```
You are an expert resume writer and career coach. Your task is to transform weak, generic resume bullet points into powerful, achievement-focused statements that will impress hiring managers and ATS systems.

Rules:
1. Start every bullet with a strong action verb
2. Include specific metrics and numbers whenever possible (estimate if needed)
3. Focus on achievements and impact, not just duties
4. Keep bullets concise (1-2 lines max)
5. Use industry-appropriate terminology
6. Make the candidate sound proactive and results-driven

If the original bullet is vague, make reasonable assumptions about metrics based on the job title and industry. For example:
- "Managed team" → "Led team of X employees"
- "Improved efficiency" → "Increased efficiency by X%"
- "Worked on projects" → "Delivered X projects on time and under budget"
```

### User Prompt Template
```
Job Title: {jobTitle}
Industry: {industry}

Transform these resume bullets into powerful, achievement-focused statements:

{bullets}

Return a JSON object with:
- "improved": array of improved bullets (same order as input)
- "tips": 2-3 specific tips for this person's resume
```

---

## Document Template Design

### .docx Structure
```
[Job Title] - [Company (if provided)]
─────────────────────────────────

• Improved bullet point 1
• Improved bullet point 2
• Improved bullet point 3
...

─────────────────────────────────
Generated with ResumeGlow.com
```

### Styling
- Font: Calibri 11pt (most ATS-friendly)
- Margins: 1 inch all sides
- Bullet style: Simple round bullets
- Line spacing: 1.15

---

## Rate Limiting Strategy

```javascript
// Simple in-memory rate limiting
const rateLimit = new Map();
const LIMIT = 20;        // requests
const WINDOW = 60000;    // 1 minute

function checkLimit(ip) {
  const now = Date.now();
  const requests = (rateLimit.get(ip) || [])
    .filter(t => t > now - WINDOW);
  
  if (requests.length >= LIMIT) {
    return false; // Rate limited
  }
  
  requests.push(now);
  rateLimit.set(ip, requests);
  return true;
}
```

---

## SEO Strategy

### Target Keywords
- Primary: "resume bullet points generator", "improve resume bullets"
- Secondary: "AI resume writer", "resume action words", "achievement-focused resume"
- Long-tail: "how to write better resume bullets", "transform job duties into achievements"

### Schema Markup
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "ResumeGlow",
  "description": "Free AI-powered tool to transform weak resume bullets into interview-winning achievements",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

---

## Success Metrics

### Week 1
- [ ] Site live and functional
- [ ] AdSense approved
- [ ] 100+ visitors from organic/direct

### Month 1
- [ ] 5,000+ visitors
- [ ] First ad revenue
- [ ] Indexed in Google for target keywords

### Month 3
- [ ] 20,000+ monthly visitors
- [ ] $200+ monthly ad revenue
- [ ] Featured in 2+ AI tool directories

---

## Estimated Costs

| Item | Monthly Cost |
|------|-------------|
| Hosting (Vercel) | $0 |
| Domain | ~$1 |
| API (10k requests) | ~$6 |
| **Total** | **~$7/month** |

## Estimated Revenue (at 20k visitors)

- RPM with employment niche: ~$7.50
- Monthly pageviews: ~30,000 (1.5 pages/visit)
- **Monthly Revenue: ~$225**
- **Monthly Profit: ~$218**

---

## Ready to Build?

Confirm and I'll start with Phase 1: creating the project structure and base files.
