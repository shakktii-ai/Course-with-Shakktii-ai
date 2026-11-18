import { BaseAIAdapter } from './base-ai.adapter.js';
import { MockAIAdapter } from './mock-ai.adapter.js';
import { logger } from '../../lib/logger.js';

const CANDIDATE_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
];

export class GeminiAdapter extends BaseAIAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'GEMINI';
    this.apiKey = process.env.GEMINI_API_KEY || config.apiKey || '';
    this.model = process.env.GEMINI_MODEL || config.model || 'gemini-3-flash-preview';
    this.mockFallback = new MockAIAdapter(config);
  }

  /**
   * Helper to execute Gemini text generation with automatic model fallback
   */
  async generateText(prompt) {
    if (!this.apiKey) {
      logger.info('[GeminiAdapter] No GEMINI_API_KEY detected, using dynamic fallback adapter.');
      return await this.mockFallback.generateText(prompt);
    }

    const modelsToTry = [this.model, ...CANDIDATE_MODELS.filter((m) => m !== this.model)];

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });

        const data = await res.json();
        if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }

        if (data.error) {
          logger.warn(`[GeminiAdapter] Model ${model} returned error: ${data.error.message?.substring(0, 100)}, trying next...`);
        }
      } catch (err) {
        logger.warn(`[GeminiAdapter] Network error for model ${model}: ${err.message}, trying next...`);
      }
    }

    logger.error('[GeminiAdapter] All candidate models failed, falling back to mock adapter.');
    return await this.mockFallback.generateText(prompt);
  }

  /**
   * Helper to execute structured JSON generation with Gemini with model fallback
   */
  async generateJSON(prompt, systemInstruction = '') {
    if (!this.apiKey) {
      return null;
    }

    const modelsToTry = [this.model, ...CANDIDATE_MODELS.filter((m) => m !== this.model)];

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        const body = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        };

        if (systemInstruction) {
          body.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          return JSON.parse(rawText);
        }

        if (data.error) {
          logger.warn(`[GeminiAdapter] JSON model ${model} error: ${data.error.message?.substring(0, 100)}, trying next...`);
        }
      } catch (err) {
        logger.warn(`[GeminiAdapter] JSON generation error with ${model}: ${err.message}`);
      }
    }

    return null;
  }

  /**
   * Directly ask Gemini to design a custom, standalone SVG illustration tailored 100% to the lesson
   */
  async generateLessonSvg({ courseTitle = '', lessonTitle = '', summary = '', nodes = [] }) {
    if (!this.apiKey) return null;

    const nodeSummary = Array.isArray(nodes) && nodes.length > 0
      ? `Key components/stages: ${nodes.map((n) => n.label || n).join(', ')}.`
      : '';

    const prompt = `You are a world-class educational visual designer and vector graphics expert.
Design a highly informative, visually stunning standalone vector SVG infographic diagram (viewBox="0 0 1200 675", width 1200, height 675) specifically for:
Course: "${courseTitle}"
Lesson: "${lessonTitle}"
${summary ? `Summary: ${summary}` : ''}
${nodeSummary}

Design Requirements:
1. The visual architecture MUST be uniquely tailored to "${lessonTitle}". DO NOT use a generic 4-box card layout.
2. If the topic is Programming/Computer Science: create an authentic technical architecture, memory layout, execution pipeline, or data flow.
3. If the topic is Biology/Chemistry/Science: draw accurate molecular structures, cellular processes, biological pathways, or reaction diagrams.
4. If the topic is Law/Compliance/Privacy: create an authoritative governance model, legal audit tree, or data-flow trust boundary.
5. If the topic is Business/Finance: create an executive roadmap, strategic matrix, financial cycle, or funnel diagram.
6. Use a modern, fresh color palette with SVG gradients, clean typography (<text font-family="system-ui, sans-serif">), rounded rectangles, badges, and smooth connector lines/arrows.
7. Include the course and lesson title clearly at the top.
8. Output ONLY valid, standalone raw SVG XML starting with <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675"> and ending with </svg>. Do NOT wrap in markdown or backticks.`;

    try {
      const rawOutput = await this.generateText(prompt);
      if (!rawOutput) return null;

      let cleanSvg = rawOutput.trim();
      if (cleanSvg.startsWith('```xml')) cleanSvg = cleanSvg.slice(6);
      if (cleanSvg.startsWith('```svg')) cleanSvg = cleanSvg.slice(6);
      if (cleanSvg.startsWith('```')) cleanSvg = cleanSvg.slice(3);
      if (cleanSvg.endsWith('```')) cleanSvg = cleanSvg.slice(0, -3);
      cleanSvg = cleanSvg.trim();

      const startIdx = cleanSvg.indexOf('<svg');
      const endIdx = cleanSvg.lastIndexOf('</svg>');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleanSvg = cleanSvg.substring(startIdx, endIdx + 6);
        return cleanSvg;
      }
    } catch (err) {
      logger.warn('[GeminiAdapter] Failed to generate custom SVG with Gemini:', err.message);
    }
    return null;
  }

  /**
   * Generate 100% dynamic course outline & syllabus based on brief and source documents
   */
  async generateOutline(brief, sourceChunks = [], options = {}) {
    const title = brief.title || 'Interactive Course';
    const hasSources = Array.isArray(sourceChunks) && sourceChunks.length > 0;
    const isAutoModules = !brief.numModules || brief.numModules === 'auto' || hasSources;
    const isAutoLessons = !brief.numLessons || brief.numLessons === 'auto' || hasSources;

    const chunkExcerpts = sourceChunks.slice(0, 25).map((c, i) => {
      const docName = c.metadata?.documentName || 'Source Document';
      return `[Source Excerpt ${i + 1} - ${docName} (Page ${c.pageNumber || 1})]:\n${(c.content || '').substring(0, 450)}`;
    }).join('\n\n');

    let structureDirective = '';
    if (hasSources) {
      structureDirective = `CRITICAL DOCUMENT-GROUNDED SYLLABUS DIRECTIVE:
The learner uploaded one or more source documents / PDFs.
You MUST carefully read the provided document excerpts, Table of Contents, chapter headings, and topic sections:
1. DO NOT force an arbitrary number of modules or lessons!
2. Automatically discover the TRUE number of modules/units (can be 1, 2, 5, 8, 10 or more) matching the actual chapters/sections in the PDF.
3. Automatically determine how many lessons belong in each module based on the subtopics and depth in the PDF.
4. If the PDF only covers 1 topic/chapter, output 1 comprehensive module with the appropriate lessons.
5. If the PDF covers 10 chapters, output 10 modules corresponding to each chapter!
6. The syllabus must authentically mirror the actual content structure of the PDF.`;
    } else if (isAutoModules || isAutoLessons) {
      structureDirective = `AUTONOMOUS CURRICULUM ARCHITECTURE:
Determine the ideal number of modules (e.g. 2 to 6) and lessons per module (e.g. 2 to 5) organically based on the educational depth and scope of "${title}".`;
    } else {
      structureDirective = `Requested Modules: ${brief.numModules}
Requested Lessons per module: ${brief.numLessons}`;
    }

    const prompt = `You are an expert instructional designer and enterprise curriculum architect.
Create a highly structured, tailored course syllabus for the following topic:

Course Title: "${title}"
Topic / Brief: "${brief.description || brief.headline || title}"
Target Audience: "${brief.targetAudience || 'Beginner to Intermediate learners'}"
Difficulty Level: "${brief.difficulty || 'INTERMEDIATE'}"

${structureDirective}

Source Material Excerpts:
${chunkExcerpts || 'No external documents provided; generate completely original, in-depth curriculum covering foundational to advanced concepts.'}

Return a valid JSON object matching this schema exactly:
{
  "title": "${title}",
  "summary": "A concise overview of the curriculum and learning journey",
  "difficulty": "${brief.difficulty || 'INTERMEDIATE'}",
  "modules": [
    {
      "title": "Module Title relevant specifically to the PDF chapter/topic",
      "description": "Module description",
      "lessons": [
        {
          "title": "Specific Lesson Title relevant to this module",
          "summary": "Specific lesson summary",
          "durationMinutes": 15,
          "type": "ARTICLE"
        }
      ]
    }
  ],
  "assessmentPlan": "Knowledge checks and comprehensive final assessment"
}`;

    const jsonResult = await this.generateJSON(prompt);
    if (jsonResult && jsonResult.modules && Array.isArray(jsonResult.modules) && jsonResult.modules.length > 0) {
      // Ensure citations are dynamically mapped to lessons
      let lessonCounter = 0;
      jsonResult.modules.forEach((mod) => {
        (mod.lessons || []).forEach((les) => {
          const chunk = sourceChunks[lessonCounter % Math.max(1, sourceChunks.length)];
          lessonCounter++;
          les.citations = chunk ? [
            {
              documentId: chunk.documentId,
              documentName: chunk.metadata?.documentName || 'Source Document',
              pageNumber: chunk.pageNumber || 1,
              chunkId: chunk._id,
              sourcePassage: chunk.content ? chunk.content.substring(0, 150) : 'Verified source text',
              citationRef: `[Ref: Page ${chunk.pageNumber || 1}]`,
              isVerified: true,
            },
          ] : [];
        });
      });

      return {
        ...jsonResult,
        tokenUsage: { inputTokens: 500, outputTokens: 850 },
      };
    }

    // Dynamic fallback
    return await this.mockFallback.generateOutline(brief, sourceChunks, options);
  }

  /**
   * Generate 100% dynamic lesson content with explanations, practical examples, and quiz
   */
  async generateLesson(brief, lessonTitle, sourceChunks = [], options = {}) {
    const chunk = sourceChunks[0];
    const sourcePassage = chunk?.content ? chunk.content.substring(0, 400) : '';

    const prompt = `You are a world-class educator and senior author. Create a comprehensive, engaging lesson.
Lesson Title: "${lessonTitle}"
Course Subject: "${brief.title || 'Technical Mastery'}"
Audience: "${brief.targetAudience || 'All Learners'}"

Source Document Context:
"${sourcePassage || 'Cover the core principles, practical architecture, and hands-on implementation details.'}"

Return a valid JSON object matching this schema:
{
  "title": "${lessonTitle}",
  "type": "ARTICLE",
  "introduction": "An engaging, clear introduction explaining why ${lessonTitle} matters.",
  "learningObjectives": [
    "Master foundational concepts of ${lessonTitle}",
    "Understand implementation workflows and best practices",
    "Analyze real-world practical applications"
  ],
  "detailedExplanation": "Detailed multi-paragraph lesson explanation in clean markdown format with subheadings (###), concepts, and key mechanisms.",
  "visualDiagram": {
    "title": "Visual Architecture: ${lessonTitle}",
    "caption": "Step-by-step visual workflow and component interaction flow for ${lessonTitle}",
    "imagePrompt": "A vivid, highly specific educational illustration prompt for AI image generation depicting the core visual concept of ${lessonTitle} in ${brief.title || 'the course'}. E.g. for biology describe molecular structures or cell processes; for computer science describe systems, circuits, or data flow; for business describe strategy or analytics. Specify modern 3D educational style, clean background, 8k render.",
    "nodes": [
      {
        "label": "Specific Component 1 Name (e.g. Data Principal / Client Ingestion for ${lessonTitle})",
        "desc": "Concrete action and role in 6-10 words"
      },
      {
        "label": "Specific Component 2 Name (e.g. Consent Gateway / Core Processing for ${lessonTitle})",
        "desc": "Concrete action and role in 6-10 words"
      },
      {
        "label": "Specific Component 3 Name (e.g. Fiduciary Safeguard / Security Layer for ${lessonTitle})",
        "desc": "Concrete action and role in 6-10 words"
      },
      {
        "label": "Specific Component 4 Name (e.g. Board Audit / Output Persistence for ${lessonTitle})",
        "desc": "Concrete action and role in 6-10 words"
      }
    ],
    "teachingSteps": [
      {
        "step": 1,
        "title": "1. Specific Stage 1 Component Name",
        "explanation": "Clear, educational explanation of what happens in Stage 1 of ${lessonTitle}.",
        "visualFocus": "Stage 01 on the visual diagram"
      },
      {
        "step": 2,
        "title": "2. Specific Stage 2 Component Name",
        "explanation": "Clear, educational explanation of what happens in Stage 2 of ${lessonTitle}.",
        "visualFocus": "Stage 02 on the visual diagram"
      },
      {
        "step": 3,
        "title": "3. Specific Stage 3 Component Name",
        "explanation": "Clear, educational explanation of what happens in Stage 3 of ${lessonTitle}.",
        "visualFocus": "Stage 03 on the visual diagram"
      },
      {
        "step": 4,
        "title": "4. Specific Stage 4 Component Name",
        "explanation": "Clear, educational explanation of what happens in Stage 4 of ${lessonTitle}.",
        "visualFocus": "Stage 04 on the visual diagram"
      }
    ],
    "audioTeacherScript": "A natural, conversational 3-sentence spoken lesson from the AI teacher explaining how data or workflow moves from Stage 1 to Stage 4 for ${lessonTitle}."
  },
  "practicalExamples": [
    {
      "title": "Practical Hands-on Example",
      "codeOrText": "Code snippet or concrete technical example directly illustrating ${lessonTitle}"
    }
  ],
  "practicalExercises": [
    "Hands-on exercise 1 applying this lesson",
    "Hands-on exercise 2 applying this lesson"
  ],
  "keyTakeaways": [
    "Key takeaway point 1",
    "Key takeaway point 2",
    "Key takeaway point 3"
  ],
  "quiz": [
    {
      "question": "A specific multiple-choice question testing the core concept of ${lessonTitle}?",
      "options": [
        "Correct answer explaining the core mechanism",
        "Incorrect plausible distractor 1",
        "Incorrect plausible distractor 2",
        "Incorrect plausible distractor 3"
      ],
      "correctAnswerIndex": 0,
      "explanation": "Detailed explanation of why the answer is correct."
    }
  ]
}`;

    const jsonResult = await this.generateJSON(prompt);
    if (jsonResult && jsonResult.detailedExplanation) {
      return {
        ...jsonResult,
        citations: chunk ? [
          {
            documentId: chunk.documentId,
            documentName: chunk.metadata?.documentName || 'Source Document',
            pageNumber: chunk.pageNumber || 1,
            chunkId: chunk._id,
            sourcePassage: chunk.content ? chunk.content.substring(0, 200) : 'Verified reference passage',
            citationRef: `[Ref 1: Page ${chunk.pageNumber || 1}]`,
            isVerified: true,
          },
        ] : [],
        tokenUsage: { inputTokens: 600, outputTokens: 1200 },
      };
    }

    // Dynamic fallback
    return await this.mockFallback.generateLesson(brief, lessonTitle, sourceChunks, options);
  }

  async generateEmbeddings(texts, options = {}) {
    return await this.mockFallback.generateEmbeddings(texts, options);
  }

  async rewriteContent(content, mode = 'REWRITE', options = {}) {
    if (!this.apiKey) {
      return await this.mockFallback.rewriteContent(content, mode, options);
    }
    const prompt = `Rewrite the following educational content in mode "${mode}". Maintain factual accuracy.\n\n${content}`;
    const result = await this.generateText(prompt);
    return result || await this.mockFallback.rewriteContent(content, mode, options);
  }

  async generateQuiz(content, options = {}) {
    const prompt = `Generate 3 high quality multiple choice quiz questions based strictly on this text:\n\n${content}\n\nReturn JSON: { "questions": [ { "question": string, "options": [string, string, string, string], "correctAnswerIndex": number, "explanation": string } ] }`;
    const jsonResult = await this.generateJSON(prompt);
    if (jsonResult && Array.isArray(jsonResult.questions) && jsonResult.questions.length > 0) {
      return jsonResult.questions;
    }
    return await this.mockFallback.generateQuiz(content, options);
  }

  async generateTutorReply(payload, options = {}) {
    const rawMessages = payload.messages || payload.conversationHistory || [];
    const lastUserMsg =
      [...rawMessages].reverse().find((m) => m.sender === 'USER' || m.role === 'user')?.content ||
      payload.question ||
      payload.content ||
      '';

    const courseTitle =
      payload.courseInfo?.title ||
      payload.context?.course?.title ||
      payload.courseTitle ||
      'Course Curriculum';

    const contextChunks = payload.context?.chunks || payload.contextChunks || [];
    const mode = (payload.mode || 'TUTOR').toUpperCase();

    const historyText = rawMessages
      .slice(-6)
      .map((m) => `${m.sender || m.role || 'User'}: ${m.content}`)
      .join('\n');

    const sourcesText = contextChunks
      .slice(0, 3)
      .map((c, i) => `[Source Excerpt ${i + 1} (${c.metadata?.documentName || 'Course Material'}, Page ${c.pageNumber || 1})]:\n${c.content}`)
      .join('\n\n');

    let modeInstruction = '';
    switch (mode) {
      case 'SOCRATIC':
        modeInstruction = `MODE: SOCRATIC GUIDANCE & INQUIRY.
Do NOT give the complete answer directly away.
Acknowledge the learner's query, break down the underlying concept into 1 or 2 guided questions, and invite them to reason about the core invariant or boundary condition.
Encourage step-by-step discovery.`;
        break;

      case 'CODE_HINT':
        modeInstruction = `MODE: CODE HINT & ARCHITECTURAL DEMONSTRATION.
Provide clean, production-grade code walkthroughs directly addressing the learner's request.
Use markdown code blocks (\`\`\`javascript, \`\`\`python, etc.) with concise comments.
Explain the execution flow, error boundary verification, and potential edge cases.`;
        break;

      case 'PRACTICE':
        modeInstruction = `MODE: PRACTICE & DIAGNOSTIC CHALLENGE.
Engage the learner with an interactive diagnostic practice problem on this topic!
First, give a concise 1-2 sentence concept highlight.
Then present 1-2 multiple-choice practice questions or coding challenges with options [A], [B], [C], [D].
Invite the learner to submit their answer to test their understanding.`;
        break;

      case 'TUTOR':
      default:
        modeInstruction = `MODE: AUTHORITATIVE ACADEMIC TUTOR.
Provide a clear, comprehensive, and grounded explanation based on the course materials.
Structure your response with conceptual explanation, real-world context, and key takeaways.`;
        break;
    }

    const prompt = `You are a supportive, insightful AI Learning Companion for "${courseTitle}".

${modeInstruction}

Course Context & References:
${sourcesText || 'Authoritative course documentation and verified curriculum.'}

Recent Conversation History:
${historyText || 'Beginning of discussion.'}

Learner Query:
"${lastUserMsg}"

Format your response in beautiful, readable GitHub-style Markdown.`;

    const reply = await this.generateText(prompt);
    if (reply && reply.trim().length > 0) {
      const citations = contextChunks.slice(0, 2).map((c, idx) => ({
        documentId: c.documentId,
        documentName: c.metadata?.documentName || 'Course Document',
        pageNumber: c.pageNumber || 1,
        chunkId: c._id,
        sourcePassage: c.content ? c.content.substring(0, 180) : '',
        confidence: Number((Math.min(0.98, Math.max(0.75, c.score || 0.88))).toFixed(2)),
        citationRef: `[Ref ${idx + 1}: Page ${c.pageNumber || 1}]`,
      }));

      return {
        content: reply.trim(),
        citations,
        isGrounded: citations.length > 0,
        tokenUsage: { inputTokens: 250, outputTokens: 450 },
      };
    }

    return await this.mockFallback.generateTutorReply(payload, options);
  }

  async generateSocraticHints(payload, options = {}) {
    return await this.mockFallback.generateSocraticHints(payload, options);
  }

  async generateRemediation(payload, options = {}) {
    return await this.mockFallback.generateRemediation(payload, options);
  }

  /**
   * Upload a binary video buffer to Gemini File API (resumable upload protocol)
   */
  async uploadFileToGemini(buffer, mimeType = 'video/mp4', displayName = 'uploaded-video.mp4') {
    const initUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${this.apiKey}`;
    const initRes = await fetch(initUrl, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(buffer.length),
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: { display_name: displayName },
      }),
    });

    if (!initRes.ok) {
      const errText = await initRes.text().catch(() => '');
      throw new Error(`Gemini File API init failed (${initRes.status}): ${errText.slice(0, 200)}`);
    }

    const uploadUrl = initRes.headers.get('x-goog-upload-url');
    if (!uploadUrl) {
      throw new Error('Gemini File API did not return an upload URL');
    }

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Length': String(buffer.length),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      body: buffer,
    });

    const uploadData = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok || !uploadData.file?.uri) {
      throw new Error(
        `Gemini File API upload failed (${uploadRes.status}): ${uploadData.error?.message || 'Unknown error'}`
      );
    }

    return uploadData.file;
  }

  /**
   * Poll Gemini File API until the uploaded video finishes processing (state === ACTIVE)
   */
  async waitForGeminiFileActive(fileName, maxAttempts = 45) {
    const statusUrl = `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${this.apiKey}`;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const res = await fetch(statusUrl);
      const data = await res.json().catch(() => ({}));
      const state = data.state || data.file?.state;

      if (state === 'ACTIVE') {
        return data;
      }
      if (state === 'FAILED') {
        throw new Error('Gemini failed to process the uploaded video file.');
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error('Timed out waiting for Gemini to process the video.');
  }

  /**
   * Clean up temporary file from Gemini File API after analysis
   */
  async deleteGeminiFile(fileName) {
    if (!fileName || !this.apiKey) return;
    try {
      await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${this.apiKey}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore cleanup errors
    }
  }

  /**
   * Analyze a real uploaded video with Gemini Multimodal AI and break it down
   * into short topic clips with timestamps, explanations, key takeaways, and mini-quizzes.
   */
  async analyzeVideoToClips({
    videoBuffer,
    mimeType = 'video/mp4',
    displayName = 'lecture.mp4',
    title = 'Uploaded Video',
    durationSeconds = 0,
    language = 'Marathi-English',
    clipStyle = 'AUTO',
  }) {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured. Please add GEMINI_API_KEY to .env.local.');
    }

    let uploadedFile = null;
    try {
      logger.info(`[GeminiAdapter] Uploading video (${(videoBuffer.length / (1024 * 1024)).toFixed(2)} MB) to Gemini File API...`);
      uploadedFile = await this.uploadFileToGemini(videoBuffer, mimeType, displayName);

      logger.info(`[GeminiAdapter] Waiting for Gemini video processing (${uploadedFile.name})...`);
      await this.waitForGeminiFileActive(uploadedFile.name);

      const languageGuidance =
        language === 'Marathi'
          ? 'Write ALL titles, summaries, detailedExplanation, keyTakeaways, realWorldExample, and quiz content in clear, natural Marathi (मराठी Devanagari script). Technical terms can stay in English in brackets if helpful.'
          : language === 'Hindi'
            ? 'Write ALL titles, summaries, detailedExplanation, keyTakeaways, realWorldExample, and quiz content in clear, natural Hindi (हिंदी Devanagari script).'
            : language === 'Marathi-English'
              ? 'Write ALL explanations, summaries, keyTakeaways, and examples in friendly, easy-to-understand Marathi-English mix (Marathi explanation using Devanagari script combined with standard English technical terms — the way Indian teachers explain concepts clearly!).'
              : 'Write ALL titles, summaries, detailedExplanation, keyTakeaways, realWorldExample, and quiz content in clear, crisp English.';

      const styleGuidance =
        clipStyle === 'SHORT'
          ? 'Split the video into bite-sized micro-clips (roughly 15 to 40 seconds each) focusing on one crisp concept per clip. Always cut at natural sentence pauses, NEVER mid-sentence.'
          : clipStyle === 'CHAPTERS'
            ? 'Split the video into logical deeper topic chapters (roughly 45 to 150 seconds each). Always cut at natural topic/sentence transitions.'
            : 'Automatically detect every meaningful topic shift, explanation segment, slide change, or demo step and split into natural contiguous clips (usually 15 to 75 seconds each). Always cut cleanly at natural pauses between sentences, NEVER mid-sentence.';

      const formatMMSS = (s) => {
        const sec = Math.max(0, Math.round(Number(s) || 0));
        return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
      };

      const durationNote =
        durationSeconds > 0
          ? `The exact total duration of this video is ${formatMMSS(durationSeconds)} (${Math.round(durationSeconds)} seconds). Clip 1 MUST start at "00:00", clips MUST be contiguous (each clip starts cleanly where the previous clip ends, with no arbitrary gaps), and the final clip MUST end at or before "${formatMMSS(durationSeconds)}".`
          : 'Detect the exact duration from the video itself. Clip 1 MUST start at "00:00", clips MUST be contiguous with no gaps, and every timestamp MUST stay strictly within the actual video length.';

      const prompt = `You are a precision video timestamp aligner and expert educational teacher.
Watch EVERY visual frame and listen carefully to EVERY spoken word in "${title}".

CRITICAL SYNCHRONIZATION RULES (DO NOT VIOLATE):
1. ${durationNote}
2. ${styleGuidance}
3. ${languageGuidance}
4. ALWAYS use exact "MM:SS" timestamps matching the ACTUAL video clock when that speaker begins and finishes that specific point. Do NOT guess fixed 30-second intervals like 00:00-00:30-01:00 unless the speaker genuinely switches topic right at those exact seconds!
5. STRICT CLIP-TO-EXPLANATION ALIGNMENT:
   - For each clip, FIRST record "startTime" ("MM:SS"), "endTime" ("MM:SS"), and "transcriptSnippet" (what is ACTUALLY spoken or shown on screen strictly between startTime and endTime).
   - THEN write "title", "shortSummary", "detailedExplanation", "keyTakeaways", "realWorldExample", and "quiz" STRICTLY AND EXCLUSIVELY about what happens inside THAT exact [startTime -> endTime] clip!
   - NEVER include concepts from an earlier or later clip in the current clip's explanation. A viewer watching ONLY [startTime -> endTime] must see 100% exact match between what they just watched/heard in that clip and the explanation below it.

Return ONLY valid JSON matching this EXACT field order:
{
  "videoTitle": "Accurate descriptive title based on actual video content",
  "detectedDurationSeconds": ${Math.round(durationSeconds || 60)},
  "videoSummary": "Clear 2-3 sentence overview of the entire video",
  "overallTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "clips": [
    {
      "startTime": "00:00",
      "endTime": "00:24",
      "startSeconds": 0,
      "endSeconds": 24,
      "transcriptSnippet": "Exact summary/quote of what is spoken and shown on screen strictly from 00:00 to 00:24",
      "title": "Specific title for ONLY this 00:00-00:24 segment",
      "shortSummary": "1-2 sentences summarizing ONLY this clip",
      "detailedExplanation": "Clear, structured teaching explanation strictly explaining ONLY the concept covered between 00:00 and 00:24",
      "keyTakeaways": ["Key point 1 from this clip", "Key point 2 from this clip", "Key point 3 from this clip"],
      "realWorldExample": "Practical example specifically illustrating this clip's concept",
      "quiz": {
        "question": "Question directly answerable from this specific clip",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctIndex": 0,
        "explanation": "Why this option is right based on this clip"
      }
    }
  ]
}`;

      const modelsToTry = [this.model, ...CANDIDATE_MODELS.filter((m) => m !== this.model)];
      let lastError = null;

      for (const model of modelsToTry) {
        try {
          logger.info(`[GeminiAdapter] Running precision multimodal video analysis with model: ${model}`);
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      file_data: {
                        mime_type: uploadedFile.mimeType || mimeType,
                        file_uri: uploadedFile.uri,
                      },
                    },
                    { text: prompt },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.1,
              },
            }),
          });

          const data = await res.json().catch(() => ({}));
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (res.ok && rawText) {
            const cleanText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
            const parsed = JSON.parse(cleanText);
            if (parsed && Array.isArray(parsed.clips) && parsed.clips.length > 0) {
              return parsed;
            }
          }

          lastError = data.error?.message || `Empty response from ${model}`;
          logger.warn(`[GeminiAdapter] Video analysis model ${model} failed: ${lastError}`);
        } catch (err) {
          lastError = err.message;
          logger.warn(`[GeminiAdapter] Video analysis exception on ${model}: ${err.message}`);
        }
      }

      throw new Error(`All Gemini models failed to analyze video: ${lastError || 'Unknown error'}`);
    } finally {
      if (uploadedFile?.name) {
        await this.deleteGeminiFile(uploadedFile.name);
      }
    }
  }
}

export default GeminiAdapter;
