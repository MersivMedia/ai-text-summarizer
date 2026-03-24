// Full Resume Document Generator
const { Document, Packer, Paragraph, TextRun, BorderStyle, AlignmentType, HeadingLevel, TabStopType, TabStopPosition } = require('docx');

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

  try {
    const { personalInfo, summary, experience, education, skills } = req.body;

    if (!personalInfo || !personalInfo.name) {
      return res.status(400).json({ error: 'Personal info required' });
    }

    const children = [];

    // ===== NAME HEADER =====
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: personalInfo.name.toUpperCase(),
            bold: true,
            size: 32, // 16pt
            font: 'Calibri',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      })
    );

    // ===== CONTACT INFO LINE =====
    const contactParts = [];
    if (personalInfo.email) contactParts.push(personalInfo.email);
    if (personalInfo.phone) contactParts.push(personalInfo.phone);
    if (personalInfo.location) contactParts.push(personalInfo.location);
    if (personalInfo.linkedin) contactParts.push(personalInfo.linkedin);

    if (contactParts.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: contactParts.join('  |  '),
              size: 20, // 10pt
              font: 'Calibri',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );
    }

    // ===== PROFESSIONAL SUMMARY =====
    if (summary) {
      children.push(createSectionHeader('PROFESSIONAL SUMMARY'));
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: summary,
              size: 22,
              font: 'Calibri',
            }),
          ],
          spacing: { after: 200, line: 276 },
        })
      );
    }

    // ===== WORK EXPERIENCE =====
    if (experience && experience.length > 0) {
      children.push(createSectionHeader('PROFESSIONAL EXPERIENCE'));

      experience.forEach((job, index) => {
        // Job title and company line
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: job.title || 'Position',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
              new TextRun({
                text: job.company ? ` | ${job.company}` : '',
                size: 22,
                font: 'Calibri',
              }),
              new TextRun({
                text: job.location ? ` | ${job.location}` : '',
                size: 22,
                font: 'Calibri',
                italics: true,
              }),
            ],
            spacing: { before: index > 0 ? 200 : 0, after: 50 },
          })
        );

        // Dates line
        const dateText = `${job.startDate || ''} – ${job.endDate || 'Present'}`;
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: dateText,
                size: 20,
                font: 'Calibri',
                italics: true,
                color: '666666',
              }),
            ],
            spacing: { after: 100 },
          })
        );

        // Bullet points
        if (job.bullets && job.bullets.length > 0) {
          job.bullets.forEach(bullet => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `•  ${bullet}`,
                    size: 22,
                    font: 'Calibri',
                  }),
                ],
                spacing: { after: 80, line: 276 },
                indent: { left: 360 },
              })
            );
          });
        }
      });
    }

    // ===== EDUCATION =====
    if (education && education.length > 0) {
      children.push(createSectionHeader('EDUCATION'));

      education.forEach((edu, index) => {
        const degreeLine = [];
        if (edu.degree) degreeLine.push(edu.degree);
        if (edu.field) degreeLine.push(`in ${edu.field}`);
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: degreeLine.join(' ') || 'Degree',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
            spacing: { before: index > 0 ? 150 : 0, after: 50 },
          })
        );

        const schoolLine = [];
        if (edu.school) schoolLine.push(edu.school);
        if (edu.graduationDate) schoolLine.push(edu.graduationDate);
        if (edu.gpa) schoolLine.push(`GPA: ${edu.gpa}`);

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: schoolLine.join('  |  '),
                size: 22,
                font: 'Calibri',
              }),
            ],
            spacing: { after: 100 },
          })
        );
      });
    }

    // ===== SKILLS =====
    if (skills && skills.length > 0) {
      children.push(createSectionHeader('SKILLS'));
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: skills.join('  •  '),
              size: 22,
              font: 'Calibri',
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Create document
    const doc = new Document({
      creator: 'ResumeGlow',
      title: `Resume - ${personalInfo.name}`,
      styles: {
        paragraphStyles: [
          {
            id: 'Normal',
            name: 'Normal',
            run: {
              font: 'Calibri',
              size: 22,
            },
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,    // 0.5 inch
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    const filename = `${personalInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-resume.docx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    return res.send(buffer);

  } catch (error) {
    console.error('Document generation error:', error);
    return res.status(500).json({ error: 'Failed to generate document' });
  }
};

function createSectionHeader(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 24, // 12pt
        font: 'Calibri',
        allCaps: true,
      }),
    ],
    border: {
      bottom: {
        color: '000000',
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    spacing: { before: 300, after: 150 },
  });
}
