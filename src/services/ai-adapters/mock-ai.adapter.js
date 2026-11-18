import { BaseAIAdapter } from './base-ai.adapter.js';

/**
 * Extract clean topic / subject name from brief or source text
 */
function extractSubject(brief = {}, sourceChunks = []) {
  if (brief.title && brief.title.trim().length > 2) {
    return brief.title.trim();
  }
  if (sourceChunks.length > 0 && sourceChunks[0]?.content) {
    const firstLine = sourceChunks[0].content.split('\n')[0].replace(/^[#\s*]+/, '').trim();
    if (firstLine.length > 3 && firstLine.length < 60) return firstLine;
  }
  return 'Modern Systems & Applied Knowledge';
}

/**
 * Extract actual headings or key terms from source chunks
 */
function extractTopicsFromChunks(sourceChunks = [], targetCount = 6) {
  const topics = [];
  const headingRegex = /^#{1,4}\s+([^\n]+)/gm;

  for (const chunk of sourceChunks) {
    const content = chunk?.content || '';
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      const heading = match[1].trim();
      if (heading.length > 3 && !topics.includes(heading)) {
        topics.push(heading);
      }
    }
  }

  // If not enough markdown headings, split on bold lines or numbered items
  if (topics.length < targetCount) {
    for (const chunk of sourceChunks) {
      const lines = (chunk?.content || '').split('\n');
      for (const line of lines) {
        const clean = line.replace(/^[\d.)\-*#\s]+/, '').trim();
        if (clean.length > 5 && clean.length < 50 && !topics.includes(clean) && !clean.includes('http')) {
          topics.push(clean);
        }
        if (topics.length >= targetCount) break;
      }
      if (topics.length >= targetCount) break;
    }
  }

  return topics;
}

export class MockAIAdapter extends BaseAIAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'MOCK';
  }

  /**
   * Deterministic vector embedding based on string tokens (64-dimensional normalized vector)
   */
  async generateEmbeddings(texts) {
    return texts.map((text) => {
      const vector = new Array(64).fill(0);
      const str = String(text).toLowerCase();
      for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        const idx = (charCode + i) % 64;
        vector[idx] += 1;
      }
      const mag = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
      return vector.map((v) => Number((v / mag).toFixed(4)));
    });
  }

  async generateText(prompt) {
    return `AI Analysis & Instruction:\n\n${prompt.substring(0, 300)}...\n\nKey takeaways: Clear modular structure, grounded concepts, and verifiable learning outcomes.`;
  }

  /**
   * Generate 100% dynamic course outline based on actual topic and document text
   */
  async generateOutline(brief = {}, sourceChunks = []) {
    const subject = extractSubject(brief, sourceChunks);
    const numModules = parseInt(brief.numModules || 3, 10);
    const numLessons = parseInt(brief.numLessons || 2, 10);
    const extractedTopics = extractTopicsFromChunks(sourceChunks, numModules * numLessons);

    const defaultModuleThemes = [
      `Foundations & Core Principles of ${subject}`,
      `Essential Architecture & Frameworks in ${subject}`,
      `Practical Implementation & Workflows in ${subject}`,
      `Advanced Patterns & Real-World Systems in ${subject}`,
      `Optimization, Scaling & Enterprise Mastery in ${subject}`,
    ];

    const defaultLessonThemes = [
      [
        `Introduction to ${subject} & Fundamental Concepts`,
        `Core Primitives and Operational Mechanisms in ${subject}`,
      ],
      [
        `Architectural Design & Structural Standards for ${subject}`,
        `Step-by-Step Implementation & Configuration in ${subject}`,
      ],
      [
        `Practical Problem Solving & Common Pitfalls in ${subject}`,
        `Best Practices, Security, and Quality Assurance in ${subject}`,
      ],
      [
        `Performance Optimization & Resilience Strategies in ${subject}`,
        `Capstone Production Deployment & Case Studies in ${subject}`,
      ],
    ];

    const modules = [];
    let topicIndex = 0;

    for (let m = 1; m <= numModules; m++) {
      const modTheme = defaultModuleThemes[(m - 1) % defaultModuleThemes.length];
      const lessons = [];

      for (let l = 1; l <= numLessons; l++) {
        const extractedTitle = extractedTopics[topicIndex++];
        const fallbackTheme = (defaultLessonThemes[(m - 1) % defaultLessonThemes.length] || [])[(l - 1) % 2];
        const lessonTitle = extractedTitle || fallbackTheme || `Core Insights of Unit ${m}.${l}`;

        const chunk = sourceChunks[(m * l) % Math.max(1, sourceChunks.length)];

        lessons.push({
          title: `Lesson ${m}.${l}: ${lessonTitle}`,
          summary: `In-depth exploration of ${lessonTitle}, breaking down practical principles and technical mechanisms.`,
          durationMinutes: 12 + ((m + l) % 8),
          type: 'ARTICLE',
          citations: chunk ? [
            {
              documentId: chunk.documentId,
              documentName: chunk.metadata?.documentName || 'Source Reference Document',
              pageNumber: chunk.pageNumber || 1,
              chunkId: chunk._id,
              sourcePassage: chunk.content ? chunk.content.substring(0, 160) : `Verified authoritative text regarding ${subject}.`,
              citationRef: `[Ref: Page ${chunk.pageNumber || 1}]`,
              isVerified: true,
            },
          ] : [],
        });
      }

      modules.push({
        title: `Module ${m}: ${modTheme}`,
        description: `Comprehensive module covering ${modTheme.toLowerCase()} with structured lessons and practical guidance.`,
        lessons,
      });
    }

    return {
      title: subject,
      summary: `A structured ${numModules}-module curriculum thoroughly exploring ${subject}, tailored for ${brief.targetAudience || 'all learners'}.`,
      difficulty: brief.difficulty || 'INTERMEDIATE',
      modules,
      assessmentPlan: `Progressive lesson knowledge checks and final comprehensive assessment covering ${subject}.`,
      tokenUsage: { inputTokens: 480, outputTokens: 880 },
    };
  }

  /**
   * Generate 100% dynamic lesson content grounded in actual topic & document excerpts
   */
  async generateLesson(brief = {}, lessonTitle = '', sourceChunks = []) {
    const subject = extractSubject(brief, sourceChunks);
    const chunk = sourceChunks[0];
    const sourcePassage = chunk?.content
      ? chunk.content.substring(0, 350).trim()
      : `Core principles of ${subject} require structured workflows and disciplined implementation.`;

    const cleanTitle = lessonTitle.replace(/^Lesson\s+\d+(\.\d+)?:\s*/i, '').trim();

    // Synthesize domain-relevant architecture nodes tailored to the exact topic
    const topicLower = `${cleanTitle} ${subject}`.toLowerCase();
    let dynamicNodes = [];

    if (topicLower.includes('dpdp') || topicLower.includes('privacy') || topicLower.includes('data protection') || topicLower.includes('fiduciary')) {
      dynamicNodes = [
        { label: 'Data Principal', desc: `Citizen provides clear, revocable consent for ${cleanTitle}` },
        { label: 'Notice & Purpose Gateway', desc: `Itemized notice validation and consent logging` },
        { label: 'Data Fiduciary Core', desc: `Encrypted processing strictly within defined purpose` },
        { label: 'DPDP Board & Audit', desc: `Statutory accountability and grievance redressal` },
      ];
    } else if (topicLower.includes('gazette') || topicLower.includes('notification') || topicLower.includes('publication') || topicLower.includes('ministry')) {
      dynamicNodes = [
        { label: 'Drafting & Vetting', desc: `Policy formulation and statutory alignment for ${cleanTitle}` },
        { label: 'Ministry Clearance', desc: `Inter-ministerial consensus and legal scrutiny` },
        { label: 'Official Gazette Release', desc: `Authentic publication in Extraordinary Gazette` },
        { label: 'Enforcement & Compliance', desc: `Binding legal effect and compliance timeline activation` },
      ];
    } else if (topicLower.includes('event') || topicLower.includes('microservice') || topicLower.includes('outbox') || topicLower.includes('kafka')) {
      dynamicNodes = [
        { label: 'Producer Ingestion', desc: `Receives command and starts local database transaction` },
        { label: 'Transactional Outbox', desc: `Atomically saves entity update and outbox record` },
        { label: 'Event Relay / CDC', desc: `Polls outbox and guarantees at-least-once publishing` },
        { label: 'Idempotent Consumer', desc: `Deduplication log check and side-effect execution` },
      ];
    } else if (topicLower.includes('ai') || topicLower.includes('llm') || topicLower.includes('rag') || topicLower.includes('model')) {
      dynamicNodes = [
        { label: 'Learner Context Input', desc: `User prompt and multi-tenant authorization scope` },
        { label: 'Vector Retrieval Engine', desc: `Similarity search retrieves verified source chunks` },
        { label: 'LLM Reasoning Core', desc: `Synthesizes grounded response without hallucination` },
        { label: 'Response & Citation Relay', desc: `Delivers verified output with source citations` },
      ];
    } else {
      dynamicNodes = [
        { label: `${cleanTitle} Ingestion`, desc: `Validates client payload and parameters` },
        { label: `${cleanTitle} Execution`, desc: `Processes core logic and invariant rules` },
        { label: 'Safeguard & Validation', desc: `Error boundaries and security checks` },
        { label: 'Persistence & Dispatch', desc: `Commits state and returns verified result` },
      ];
    }

    const dynamicTeachingSteps = dynamicNodes.map((n, i) => ({
      step: i + 1,
      title: `${i + 1}. ${n.label}`,
      explanation: `${n.desc}. Crucial operational checkpoint in ${cleanTitle}.`,
      visualFocus: `Stage 0${i + 1} on the visual diagram`,
    }));

    return {
      title: lessonTitle,
      type: 'ARTICLE',
      introduction: `Welcome to this dedicated lesson on **${cleanTitle}** in **${subject}**. In this guide, we break down foundational principles, structural patterns, and verified best practices to help you master this domain.`,
      learningObjectives: [
        `Understand the key concepts and significance of ${cleanTitle}.`,
        `Examine practical implementation workflows and architectural considerations in ${subject}.`,
        `Apply authoritative best practices to real-world scenarios and avoid common pitfalls.`,
      ],
      detailedExplanation: `### Conceptual Overview: ${cleanTitle}\n\n` +
        `When developing expertise in **${subject}**, mastering **${cleanTitle}** is essential for building scalable and reliable solutions.\n\n` +
        `According to authoritative course documentation:\n` +
        `> "${sourcePassage}"\n\n` +
        `### Core Mechanisms & Key Principles\n` +
        `1. **Systematic Structuring**: Every component in ${cleanTitle} must follow clear, consistent boundaries to ensure maintainability.\n` +
        `2. **State & Validation**: Inputs and transitions must be rigorously validated before committing modifications.\n` +
        `3. **Resilience & Error Handling**: Systems must incorporate deterministic error recovery and graceful degradation.\n\n` +
        `### Practical Implications in Production\n` +
        `Applying these principles ensures that ${cleanTitle} functions reliably across diverse operational environments without unexpected edge-case failures.`,
      visualDiagram: {
        title: `Visual Architecture: ${cleanTitle}`,
        caption: `Visual architecture flowchart and component interaction boundaries for ${cleanTitle}`,
        nodes: dynamicNodes,
        teachingSteps: dynamicTeachingSteps,
        audioTeacherScript: `Welcome to this visual walkthrough of ${cleanTitle}. In Stage 1, notice how ${dynamicNodes[0].label} initiates the flow. In Stage 2, ${dynamicNodes[1].label} validates key invariants. Stage 3 introduces ${dynamicNodes[2].label} for security and resilience, before Stage 4 completes ${dynamicNodes[3].label} with full reliability guarantees.`,
        summary: `End-to-end component interaction flow and verification checkpoints for ${cleanTitle} in ${subject}.`,
      },
      practicalExamples: [
        {
          title: `Implementation Workflow: ${cleanTitle}`,
          codeOrText: `// Core pattern for ${cleanTitle}\nfunction executeWorkflow(payload) {\n  const isValid = validateContext(payload);\n  if (!isValid) throw new Error("Invalid payload boundary in ${subject}");\n  return processEntity(payload);\n}`,
        },
      ],
      practicalExercises: [
        `Trace the execution flow of ${cleanTitle} using sample data.`,
        `Identify potential edge cases in ${cleanTitle} and design appropriate validation safeguards.`,
      ],
      keyTakeaways: [
        `Mastery of ${cleanTitle} is fundamental to reliable execution in ${subject}.`,
        `Always enforce server-side validation and clear boundary isolation.`,
        `Continuous testing and verification prevent silent regressions in production.`,
      ],
      quiz: [
        {
          question: `What is the primary objective of understanding ${cleanTitle} in ${subject}?`,
          options: [
            `To ensure structured, predictable execution and avoid unverified state regressions`,
            `To bypass all validation checks and execute unconstrained client mutations`,
            `To eliminate all logging and observability metrics from the deployment`,
            `To replace modular components with a single monolithic function`,
          ],
          correctAnswerIndex: 0,
          explanation: `In ${subject}, ${cleanTitle} provides structured, predictable execution with validated boundaries and reliable state guarantees.`,
        },
      ],
      citations: chunk ? [
        {
          documentId: chunk.documentId,
          documentName: chunk.metadata?.documentName || 'Authoritative Reference',
          pageNumber: chunk.pageNumber || 1,
          chunkId: chunk._id,
          sourcePassage,
          citationRef: `[Ref 1: Page ${chunk.pageNumber || 1}]`,
          isVerified: true,
        },
      ] : [],
      tokenUsage: { inputTokens: 520, outputTokens: 1100 },
    };
  }

  async rewriteContent(content, mode = 'REWRITE') {
    switch (mode) {
      case 'SIMPLIFY':
        return `Simplified Summary:\n\n${content.substring(0, 150)}. In brief, this means keeping workflows straightforward and avoiding unneeded complexity.`;
      case 'EXPAND':
        return `Comprehensive Deep Dive:\n\n${content}\n\nFurthermore, when applying this in high-availability environments, engineers must take into account observability, metrics collection, and distributed tracing.`;
      case 'SUMMARIZE':
        return `Executive Summary:\n• ${content.substring(0, 100)}...\n• Key outcome: Enhanced maintainability and guaranteed privacy.`;
      case 'TRANSLATE':
        return `Translated Content:\n${content}\n(Localized for regional learning deployment).`;
      default:
        return `Polished Revision:\n\n${content.trim()}\n\nRefined for clarity, active voice, and instructional impact.`;
    }
  }

  async generateQuiz(content) {
    const passage = content ? content.substring(0, 120).replace(/\n/g, ' ') : 'the reviewed technical material';
    return [
      {
        question: `Based on the material covering "${passage}...", what is the recommended best practice?`,
        options: [
          'Enforce strict input validation, predictable state transitions, and boundary isolation',
          'Rely exclusively on unvalidated client-side state mutations',
          'Disable error recovery mechanisms to improve raw execution speed',
          'Ignore edge cases during deployment and staging verification',
        ],
        correctAnswerIndex: 0,
        explanation: 'Authoritative standards require validated boundaries, deterministic state transitions, and resilient recovery patterns.',
      },
      {
        question: 'When implementing complex workflows, how should error conditions be handled?',
        options: [
          'With clear error boundaries, descriptive messaging, and graceful recovery',
          'By discarding all failed operations silently without logs',
          'By blocking execution indefinitely until manual intervention occurs',
          'By exposing sensitive internal stack traces to end users',
        ],
        correctAnswerIndex: 0,
        explanation: 'Graceful recovery with clear boundaries ensures system reliability and maintainability.',
      },
    ];
  }

  /**
   * AI Tutor Conversational Reply with Source Grounding & Socratic Guidance
   */
  async generateTutorReply({ messages = [], context = {}, mode = 'TUTOR', courseInfo = {} }) {
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'USER')?.content || '';
    const chunks = context.chunks || [];
    const topChunk = chunks[0];

    const citations = [];
    if (topChunk) {
      citations.push({
        documentId: topChunk.documentId,
        documentName: topChunk.metadata?.documentName || 'Course Document',
        pageNumber: topChunk.pageNumber || 1,
        chunkId: topChunk._id,
        sourcePassage: topChunk.content ? topChunk.content.substring(0, 180) : 'Verified curriculum excerpt',
        confidence: Number((Math.min(0.98, Math.max(0.72, topChunk.score || 0.85))).toFixed(2)),
        citationRef: `[Ref 1: Page ${topChunk.pageNumber || 1}]`,
      });
    }

    const isGrounded = citations.length > 0;
    const courseTitle = courseInfo?.title || 'the current course';

    let content = '';
    if (mode === 'SOCRATIC') {
      content = `That's a thoughtful question regarding **${courseTitle}** on "${lastUserMsg.substring(0, 60)}".\n\nLet's break this down step-by-step through Socratic inquiry:\n\n1. What is the foundational rule or invariant that governs this concept?\n2. What would happen if this boundary was violated or omitted?\n\nTake a moment to reflect: what do you think is the initial consequence? Share your reasoning and let's explore further!`;
    } else if (mode === 'CODE_HINT') {
      content = `Here is a guided code walkthrough addressing "${lastUserMsg.substring(0, 60)}":\n\nNotice how business logic is cleanly decoupled from transport boundaries.\n\n\`\`\`javascript\n// Architectural implementation for ${courseTitle}\nasync function executeSolution(payload) {\n  // 1. Validate inputs and verify boundary constraints\n  const isAuthorized = await validateContext(payload);\n  if (!isAuthorized) throw new Error('Boundary validation failed');\n\n  // 2. Perform state transformation\n  return await applyTransformation(payload);\n}\n\`\`\`\n\nKey takeaways: Always enforce verification at the boundary before mutating state.`;
    } else if (mode === 'PRACTICE') {
      const topicSnippet = lastUserMsg.slice(0, 50).trim() || 'Core Principles';
      content = `### 🎯 Practice & Knowledge Challenge: **${courseTitle}**\n\nLet's test your understanding of **${topicSnippet}** with a diagnostic practice question:\n\n**Question:** Regarding *"${topicSnippet}"*, what is the recommended design practice?\n\n- **[A]** Enforce strict boundary validation, deterministic execution, and graceful error handling.\n- **[B]** Rely exclusively on unvalidated client-side state without server-side verification.\n- **[C]** Disable error handling to increase raw throughput.\n- **[D]** Hardcode configuration parameters directly in transport payloads.\n\n*Reply with your choice (A, B, C, or D) to check your mastery!*`;
    } else {
      if (isGrounded) {
        content = `Based on verified course materials for **${courseTitle}** regarding "${lastUserMsg.substring(0, 60)}":\n\n${topChunk.content.substring(0, 300)}...\n\n### Key Takeaways:\n- Always uphold strict boundaries and deterministic operations.\n- Refer to the linked citation below for complete context from the authoritative source documentation.`;
      } else {
        content = `Regarding your inquiry on "${lastUserMsg.substring(0, 80)}" in **${courseTitle}**:\n\nFoundational principles emphasize clear boundary separation, robust validation, and automated error recovery. Let me know if you would like to explore specific examples or exercises!`;
      }
    }

    const inputTokens = Math.max(80, Math.floor((lastUserMsg.length + 150) / 4));
    const outputTokens = Math.max(120, Math.floor(content.length / 4));

    return {
      content,
      citations,
      isGrounded,
      tokenUsage: { inputTokens, outputTokens },
    };
  }

  async generateSocraticHints({ code = '', problemStatement = '', currentHintLevel = 1, context = {} }) {
    const level = Math.min(4, Math.max(1, currentHintLevel));

    const hintsByLevel = {
      1: {
        title: 'Level 1: Conceptual Nudge',
        hint: 'Analyze the problem invariant: what condition must always remain true before any state mutation occurs?',
      },
      2: {
        title: 'Level 2: Strategic Approach',
        hint: 'Break the routine into two logical phases: first check input authorization and boundaries, then run the atomic transformation.',
      },
      3: {
        title: 'Level 3: Pseudocode Architecture',
        hint: 'Here is the algorithmic blueprint:\n1. Verify caller context.\n2. Query target entity with verified scoping filter.\n3. If entity not found, raise NotFoundError.\n4. Apply changes and save atomically.',
      },
      4: {
        title: 'Level 4: Concrete Syntax Guidance',
        hint: 'Here is the concrete implementation structure:\n```javascript\nconst record = await Model.findOne({ _id: resourceId });\nif (!record) throw new NotFoundError("Resource not found");\nObject.assign(record, updates);\nawait record.save();\n```',
      },
    };

    const result = hintsByLevel[level];
    return {
      hintLevel: level,
      title: result.title,
      hint: result.hint,
      canAdvance: level < 4,
      tokenUsage: { inputTokens: 110, outputTokens: 160 },
    };
  }

  async generateRemediation({ weakQuestions = [], courseInfo = {}, learnerProfile = {} }) {
    const topics = weakQuestions.map((q) => q.topic || 'Core Concept').filter(Boolean);
    const uniqueTopics = [...new Set(topics)];
    const primaryTopic = uniqueTopics[0] || 'Domain Architecture';

    return {
      remediationPlan: {
        overview: `Targeted Mastery Review: Focusing on ${uniqueTopics.join(', ') || 'essential course objectives'}.`,
        weakConcepts: uniqueTopics.length > 0 ? uniqueTopics : ['Validation & Boundary Verification'],
        misconceptionAnalysis: `A common pitfall is assuming client-provided inputs can be trusted or overlooking edge-case boundary errors. Always enforce verification server-side.`,
        stepByStepBreakdown: [
          'Review the foundational rules of component scoping.',
          'Trace execution flows from controller down to the database query filters.',
          'Ensure error boundaries fail closed rather than leaking unauthorized resources.',
        ],
        practiceQuestions: [
          {
            question: `What is the most secure method to ensure consistency for ${primaryTopic}?`,
            options: [
              'Enforce validation on every database query using verified session tokens',
              'Accept identifiers from URL query strings without verification',
              'Rely solely on frontend navigation guards',
              'Disable multi-tenant checks in staging environments',
            ],
            correctAnswerIndex: 0,
            explanation: 'Server-side enforcement via authenticated session tokens prevents unauthorized access.',
          },
        ],
        nextSteps: [
          `Re-read the lesson material on ${primaryTopic}.`,
          'Attempt the diagnostic practice quiz to confirm conceptual mastery.',
        ],
      },
      tokenUsage: { inputTokens: 320, outputTokens: 680 },
    };
  }
}

export default MockAIAdapter;
