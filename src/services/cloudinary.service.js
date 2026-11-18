/**
 * AI Academy - Cloudinary Image & Architecture Diagram Service
 * Handles uploading visual diagrams, infographics, and course illustrations to Cloudinary.
 * Includes automatic fallback for generating vector SVG architecture diagrams when keys are pending.
 */

import crypto from 'crypto';
import { logger } from '../lib/logger.js';
import { GeminiAdapter } from './ai-adapters/gemini.adapter.js';

export class CloudinaryService {
  /**
   * Get Cloudinary configuration from environment variables
   */
  static getConfig() {
    let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    let apiKey = process.env.CLOUDINARY_API_KEY;
    let apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Check if CLOUDINARY_URL is provided: cloudinary://<api_key>:<api_secret>@<cloud_name>
    if ((!cloudName || !apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
      try {
        const parsed = new URL(process.env.CLOUDINARY_URL);
        cloudName = parsed.hostname;
        apiKey = parsed.username;
        apiSecret = parsed.password;
      } catch (err) {
        logger.warn('[CloudinaryService] Failed to parse CLOUDINARY_URL:', err.message);
      }
    }

    return {
      cloudName: cloudName?.trim(),
      apiKey: apiKey?.trim(),
      apiSecret: apiSecret?.trim(),
      isConfigured: Boolean(cloudName?.trim() && apiKey?.trim() && apiSecret?.trim()),
    };
  }

  /**
   * Check if Cloudinary credentials are fully configured
   */
  static isConfigured() {
    return this.getConfig().isConfigured;
  }

  /**
   * Generate SHA-1 signature for Cloudinary upload
   */
  static generateSignature(params, apiSecret) {
    // Sort keys alphabetically
    const sortedKeys = Object.keys(params).sort();
    const signatureString = sortedKeys
      .map((k) => `${k}=${params[k]}`)
      .join('&') + apiSecret;

    return crypto.createHash('sha1').update(signatureString).digest('hex');
  }

  /**
   * Upload an image (base64, SVG, data-uri, or remote URL) to Cloudinary
   */
  static async uploadImage(fileData, options = {}) {
    const config = this.getConfig();

    if (!config.isConfigured) {
      logger.info('[CloudinaryService] Cloudinary credentials not configured in .env.local. Using local SVG visual asset.');
      return {
        success: true,
        url: fileData,
        secureUrl: fileData,
        publicId: `local-${Date.now()}`,
        width: 1200,
        height: 675,
        format: 'svg',
        isCloudinary: false,
        note: 'Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.local to persist on Cloudinary CDN',
      };
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = options.folder || 'ai-academy/course-diagrams';
      const tags = options.tags ? (Array.isArray(options.tags) ? options.tags.join(',') : options.tags) : undefined;

      const paramsToSign = {
        folder,
        timestamp,
      };

      if (tags) {
        paramsToSign.tags = tags;
      }

      if (options.publicId) {
        paramsToSign.public_id = options.publicId;
      }

      const signature = this.generateSignature(paramsToSign, config.apiSecret);

      const formData = new FormData();
      formData.append('file', fileData);
      formData.append('api_key', config.apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);
      formData.append('folder', folder);

      if (tags) {
        formData.append('tags', tags);
      }

      if (options.publicId) {
        formData.append('public_id', options.publicId);
      }

      const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        logger.error('[CloudinaryService] Upload error from Cloudinary API:', data.error);
        return {
          success: false,
          url: fileData,
          secureUrl: fileData,
          publicId: `fallback-${Date.now()}`,
          isCloudinary: false,
          error: data.error?.message || 'Cloudinary upload failed',
        };
      }

      // Generate optimized delivery URL with auto format and quality
      const optimizedUrl = `https://res.cloudinary.com/${config.cloudName}/image/upload/f_auto,q_auto,w_1200/${data.public_id}.${data.format || 'png'}`;

      return {
        success: true,
        url: optimizedUrl,
        secureUrl: data.secure_url || optimizedUrl,
        publicId: data.public_id,
        width: data.width || 1200,
        height: data.height || 675,
        format: data.format || 'png',
        bytes: data.bytes,
        isCloudinary: true,
      };
    } catch (err) {
      logger.error('[CloudinaryService] Network or execution failure during upload:', err);
      return {
        success: false,
        url: fileData,
        secureUrl: fileData,
        publicId: `fallback-${Date.now()}`,
        isCloudinary: false,
        error: err.message,
      };
    }
  }

  /**
   * Helper to format text into wrapped SVG tspans
   */
  static formatSvgWrappedText(text, maxCharsPerLine = 24, maxLines = 3, startX = 16, startY = 96, lineHeight = 15) {
    const escapeXml = (str) =>
      String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const words = String(text || '').trim().split(/\s+/);
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
        if (lines.length >= maxLines - 1) break;
      }
    }
    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }

    if (lines.length === 0) return '';

    return lines
      .map((line, idx) => {
        const y = startY + idx * lineHeight;
        return `<tspan x="${startX}" y="${y}">${escapeXml(line)}</tspan>`;
      })
      .join('');
  }

  /**
   * Generate high-resolution, fresh, vibrant, vector-crisp 1200x675 SVG educational infographic
   * Built specifically for high-clarity learning with bright fresh colors (no dark/gloomy backgrounds).
   */
  static generateSvgDiagram({
    title = 'System Architecture & Component Flow',
    caption = 'Visual explanation of key components and execution boundaries',
    nodes = [],
    summary = '',
    courseTitle = 'AI Academy Course',
    lessonTitle = 'Interactive Lesson',
    theme = 'fresh', // 'fresh' (bright/vibrant) or 'dark'
    visualCategory = 'Overview & Concept Roadmap',
  }) {
    const isFresh = theme !== 'dark';

    // Standardize nodes array
    const rawNodes = Array.isArray(nodes) && nodes.length > 0 ? nodes : [
      { label: 'Client Ingestion', desc: 'Receives and validates input context' },
      { label: 'Core Execution Boundary', desc: 'Executes domain rules and deterministic state' },
      { label: 'Resiliency & Safety Layer', desc: 'Ensures compliance and verified audit tracking' },
      { label: 'Persistence & Delivery', desc: 'Atomic state commit and verified dispatch' },
    ];

    const safeNodes = rawNodes.slice(0, 4).map((n, i) => {
      if (typeof n === 'string') {
        return { label: n, desc: `Component 0${i + 1} execution step` };
      }
      return {
        label: n.label || n.title || `Stage 0${i + 1}`,
        desc: n.desc || n.description || n.explanation || 'Verified execution boundary',
      };
    });

    const escapeXml = (str) =>
      String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const safeTitle = escapeXml(title);
    const safeCaption = escapeXml(caption);
    const safeCourse = escapeXml(courseTitle);
    const safeLesson = escapeXml(lessonTitle);
    const safeSummary = escapeXml(summary || 'Step-by-step verification and component interaction flow.');
    const safeCategory = escapeXml(visualCategory);

    // Synthesize domain-specific visual graphics based on course topic
    const lowerContext = `${courseTitle} ${lessonTitle}`.toLowerCase();
    let domainArtSvg = '';

    if (
      lowerContext.includes('biomolecule') ||
      lowerContext.includes('protein') ||
      lowerContext.includes('dna') ||
      lowerContext.includes('rna') ||
      lowerContext.includes('cell') ||
      lowerContext.includes('carbohydrate') ||
      lowerContext.includes('acid') ||
      lowerContext.includes('enzyme')
    ) {
      // High-precision scientific DNA double-helix & colorful molecular bond cluster
      domainArtSvg = `
    <!-- Domain Visual: Fresh Scientific DNA Double-Helix & Molecular Atoms -->
    <g transform="translate(830, 75)" opacity="0.85">
      <path d="M 0,25 Q 40,-5 80,25 T 160,25 T 240,25" fill="none" stroke="#059669" stroke-width="3" />
      <path d="M 0,25 Q 40,55 80,25 T 160,25 T 240,25" fill="none" stroke="#0284C7" stroke-width="3" />
      <line x1="40" y1="10" x2="40" y2="40" stroke="#F59E0B" stroke-width="2.5" />
      <line x1="80" y1="25" x2="80" y2="25" stroke="#8B5CF6" stroke-width="2.5" />
      <line x1="120" y1="10" x2="120" y2="40" stroke="#059669" stroke-width="2.5" />
      <line x1="160" y1="25" x2="160" y2="25" stroke="#0284C7" stroke-width="2.5" />
      <line x1="200" y1="10" x2="200" y2="40" stroke="#F59E0B" stroke-width="2.5" />
      
      <circle cx="50" cy="72" r="13" fill="#ECFDF5" stroke="#10B981" stroke-width="2.5" />
      <text x="50" y="76" fill="#064E3B" font-size="11" font-weight="800" font-family="system-ui, sans-serif" text-anchor="middle">C</text>
      
      <circle cx="105" cy="62" r="11" fill="#F0F9FF" stroke="#0284C7" stroke-width="2.2" />
      <text x="105" y="66" fill="#0C4A6E" font-size="10" font-weight="800" font-family="system-ui, sans-serif" text-anchor="middle">H</text>
      
      <circle cx="160" cy="76" r="14" fill="#FFFBEB" stroke="#F59E0B" stroke-width="2.5" />
      <text x="160" y="81" fill="#78350F" font-size="11" font-weight="800" font-family="system-ui, sans-serif" text-anchor="middle">O</text>
      
      <circle cx="215" cy="62" r="12" fill="#FAF5FF" stroke="#8B5CF6" stroke-width="2.2" />
      <text x="215" y="67" fill="#4C1D95" font-size="10" font-weight="800" font-family="system-ui, sans-serif" text-anchor="middle">N</text>
      
      <line x1="63" y1="70" x2="94" y2="64" stroke="#94A3B8" stroke-width="2" />
      <line x1="116" y1="64" x2="146" y2="74" stroke="#94A3B8" stroke-width="2" />
      <line x1="174" y1="74" x2="203" y2="64" stroke="#94A3B8" stroke-width="2" />
    </g>`;
    } else if (
      lowerContext.includes('dpdp') ||
      lowerContext.includes('privacy') ||
      lowerContext.includes('consent') ||
      lowerContext.includes('fiduciary') ||
      lowerContext.includes('security') ||
      lowerContext.includes('law')
    ) {
      // High-precision cybersecurity shield & encrypted vault
      domainArtSvg = `
    <!-- Domain Visual: Fresh Cybersecurity Shield & Cryptographic Vault -->
    <g transform="translate(950, 75)" opacity="0.85">
      <path d="M 45,0 L 90,18 L 90,62 Q 90,95 45,110 Q 0,95 0,62 L 0,18 Z" fill="#ECFDF5" stroke="#059669" stroke-width="3" />
      <circle cx="45" cy="50" r="13" fill="#10B981" />
      <rect x="38" y="50" width="14" height="20" rx="3" fill="#047857" />
      <path d="M 36,44 A 9,9 0 0,1 54,44" fill="none" stroke="#FFFFFF" stroke-width="3" />
      <circle cx="20" cy="24" r="4" fill="#0284C7" />
      <circle cx="70" cy="80" r="4" fill="#F59E0B" />
    </g>`;
    } else if (
      lowerContext.includes('event') ||
      lowerContext.includes('microservice') ||
      lowerContext.includes('kafka') ||
      lowerContext.includes('cloud') ||
      lowerContext.includes('docker')
    ) {
      // Distributed server mesh with streaming events
      domainArtSvg = `
    <!-- Domain Visual: Fresh Distributed Cloud & Streaming Event Mesh -->
    <g transform="translate(900, 75)" opacity="0.85">
      <rect x="10" y="10" width="48" height="30" rx="6" fill="#F0F9FF" stroke="#0284C7" stroke-width="2" />
      <rect x="95" y="10" width="48" height="30" rx="6" fill="#ECFDF5" stroke="#059669" stroke-width="2" />
      <rect x="52" y="65" width="48" height="30" rx="6" fill="#FAF5FF" stroke="#8B5CF6" stroke-width="2" />
      <line x1="58" y1="25" x2="95" y2="25" stroke="#0284C7" stroke-width="2.5" stroke-dasharray="4,3" />
      <line x1="34" y1="40" x2="68" y2="65" stroke="#059669" stroke-width="2.5" stroke-dasharray="4,3" />
      <line x1="120" y1="40" x2="88" y2="65" stroke="#8B5CF6" stroke-width="2.5" stroke-dasharray="4,3" />
    </g>`;
    }

    const nodeWidth = 224;
    const nodeHeight = 168;
    const startX = 64;
    const gap = 56;
    const nodeY = 246;

    // Fresh & Vibrant Color Palette for Component Cards
    const nodeColors = isFresh
      ? [
          { cardBg: '#FFFFFF', border: '#10B981', headerBg: '#ECFDF5', badge: '#059669', badgeText: '#FFFFFF', title: '#064E3B', text: '#334155', glow: '#10B981' }, // Fresh Emerald
          { cardBg: '#FFFFFF', border: '#0284C7', headerBg: '#F0F9FF', badge: '#0284C7', badgeText: '#FFFFFF', title: '#0C4A6E', text: '#334155', glow: '#0284C7' }, // Fresh Azure/Sky
          { cardBg: '#FFFFFF', border: '#F59E0B', headerBg: '#FFFBEB', badge: '#D97706', badgeText: '#FFFFFF', title: '#78350F', text: '#334155', glow: '#F59E0B' }, // Fresh Amber/Sun
          { cardBg: '#FFFFFF', border: '#8B5CF6', headerBg: '#FAF5FF', badge: '#7C3AED', badgeText: '#FFFFFF', title: '#4C1D95', text: '#334155', glow: '#8B5CF6' }, // Fresh Violet
        ]
      : [
          { cardBg: '#0B132B', border: '#10B981', headerBg: '#064E3B', badge: '#047857', badgeText: '#FFFFFF', title: '#F8FAFC', text: '#94A3B8', glow: '#34D399' },
          { cardBg: '#0B132B', border: '#6366F1', headerBg: '#1E1B4B', badge: '#4338CA', badgeText: '#FFFFFF', title: '#F8FAFC', text: '#94A3B8', glow: '#818CF8' },
          { cardBg: '#0B132B', border: '#F59E0B', headerBg: '#451A03', badge: '#B45309', badgeText: '#FFFFFF', title: '#F8FAFC', text: '#94A3B8', glow: '#FBBF24' },
          { cardBg: '#0B132B', border: '#A855F7', headerBg: '#311042', badge: '#7E22CE', badgeText: '#FFFFFF', title: '#F8FAFC', text: '#94A3B8', glow: '#C084FC' },
        ];

    const nodesSvg = safeNodes
      .map((node, i) => {
        const x = startX + i * (nodeWidth + gap);
        const color = nodeColors[i % nodeColors.length];
        const nextX = x + nodeWidth;

        const arrowSvg =
          i < safeNodes.length - 1
            ? `
          <!-- Arrow connection to next node -->
          <g transform="translate(${nextX}, ${nodeY + 74})">
            <line x1="8" y1="0" x2="${gap - 14}" y2="0" stroke="${isFresh ? '#059669' : '#10B981'}" stroke-width="2.5" stroke-dasharray="6,4" />
            <polygon points="${gap - 8},0 ${gap - 18},-5 ${gap - 18},5" fill="${isFresh ? '#059669' : '#10B981'}" />
            <circle cx="${gap / 2}" cy="0" r="4.5" fill="${isFresh ? '#34D399' : '#34D399'}" />
          </g>
        `
            : '';

        // Form wrapped description lines using tspan
        const wrappedDesc = this.formatSvgWrappedText(node.desc, 25, 3, x + 16, nodeY + 98, 16);

        // Clean title
        const cleanNodeTitle = escapeXml(
          node.label.length > 24 ? node.label.substring(0, 22) + '...' : node.label
        );

        return `
        <!-- Node Card ${i + 1} -->
        <g>
          <!-- Card Backdrop with Soft Shadow -->
          <rect x="${x}" y="${nodeY}" width="${nodeWidth}" height="${nodeHeight}" rx="16" fill="${color.cardBg}" stroke="${color.border}" stroke-width="2" filter="${isFresh ? 'url(#cardShadow)' : 'none'}" />
          <rect x="${x}" y="${nodeY}" width="${nodeWidth}" height="36" rx="16" fill="${color.headerBg}" opacity="${isFresh ? '0.9' : '0.75'}" />
          
          <!-- Step Number Pill -->
          <rect x="${x + 12}" y="${nodeY + 8}" width="38" height="20" rx="10" fill="${color.badge}" />
          <text x="${x + 31}" y="${nodeY + 22}" fill="${color.badgeText}" font-size="11" font-weight="700" font-family="system-ui, sans-serif" text-anchor="middle">0${i + 1}</text>
          
          <!-- Node Status Glow Dot -->
          <circle cx="${x + nodeWidth - 18}" cy="${nodeY + 18}" r="4.5" fill="${color.glow}" />

          <!-- Node Title -->
          <text x="${x + 16}" y="${nodeY + 68}" fill="${color.title}" font-size="13.5" font-weight="700" font-family="system-ui, sans-serif">
            ${cleanNodeTitle}
          </text>

          <!-- Node Description (Multi-line tspan) -->
          <text fill="${color.text}" font-size="11" font-family="system-ui, sans-serif">
            ${wrappedDesc}
          </text>

          <!-- Bottom Metric Invariant -->
          <line x1="${x + 16}" y1="${nodeY + 138}" x2="${x + nodeWidth - 16}" y2="${nodeY + 138}" stroke="${isFresh ? '#E2E8F0' : '#1E293B'}" stroke-width="1" />
          <text x="${x + 16}" y="${nodeY + 154}" fill="${isFresh ? '#059669' : '#64748B'}" font-size="9.5" font-weight="700" font-family="system-ui, sans-serif">✔ Stage Component</text>
        </g>
        ${arrowSvg}
      `;
      })
      .join('\n');

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
  <defs>
    <!-- Background Gradient (Fresh Light Mint & Sky or Dark Slate) -->
    ${
      isFresh
        ? `<linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="50%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#F0FDF4" />
    </linearGradient>`
        : `<linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070D18" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#0B132B" />
    </linearGradient>`
    }

    <!-- Soft Drop Shadow Filter for Fresh Cards -->
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0F172A" flood-opacity="0.06" />
    </filter>

    <!-- Subtle Technical Grid Pattern -->
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${isFresh ? '#E2E8F0' : '#1E293B'}" stroke-width="0.8" opacity="${isFresh ? '0.7' : '0.35'}" />
    </pattern>
  </defs>

  <!-- Background Canvas -->
  <rect width="1200" height="675" fill="url(#bgGrad)" />
  <rect width="1200" height="675" fill="url(#grid)" />

  <!-- Outer Glow Border -->
  <rect x="20" y="20" width="1160" height="635" rx="24" fill="none" stroke="${isFresh ? '#CBD5E1' : '#1E293B'}" stroke-width="2" />
  <rect x="20" y="20" width="1160" height="635" rx="24" fill="none" stroke="#10B981" stroke-width="1.5" opacity="${isFresh ? '0.6' : '0.3'}" />

  <!-- Top Academic Pill Badge -->
  <g transform="translate(64, 46)">
    <rect width="280" height="28" rx="14" fill="${isFresh ? '#ECFDF5' : '#064E3B'}" stroke="#059669" stroke-width="1.2" />
    <circle cx="16" cy="14" r="5" fill="#10B981" />
    <text x="32" y="18" fill="${isFresh ? '#064E3B' : '#A7F3D0'}" font-size="11" font-weight="800" font-family="system-ui, sans-serif" letter-spacing="0.5">
      ${safeCourse.length > 32 ? safeCourse.substring(0, 30) + '...' : safeCourse}
    </text>
  </g>

  <!-- Multi-Visual Subtopic Pill Badge -->
  <g transform="translate(360, 46)">
    <rect width="230" height="28" rx="14" fill="${isFresh ? '#EFF6FF' : '#1E1B4B'}" stroke="#0284C7" stroke-width="1.2" />
    <text x="115" y="18" fill="${isFresh ? '#0C4A6E' : '#93C5FD'}" font-size="10.5" font-weight="700" font-family="system-ui, sans-serif" text-anchor="middle">
      ${safeCategory}
    </text>
  </g>

  <!-- Visual Indicator Badge -->
  <g transform="translate(936, 46)">
    <rect width="200" height="28" rx="14" fill="${isFresh ? '#F8FAFC' : '#0F172A'}" stroke="${isFresh ? '#94A3B8' : '#334155'}" stroke-width="1" />
    <text x="100" y="18" fill="${isFresh ? '#334155' : '#94A3B8'}" font-size="10" font-weight="700" font-family="system-ui, sans-serif" text-anchor="middle">
      CONCEPTUAL DIAGRAM
    </text>
  </g>

  <!-- Course Context Subtitle -->
  <text x="64" y="112" fill="${isFresh ? '#059669' : '#10B981'}" font-size="13" font-weight="700" font-family="system-ui, sans-serif">
    ${safeCourse} • ${safeLesson}
  </text>

  <!-- Main Diagram Title -->
  <text x="64" y="150" fill="${isFresh ? '#0F172A' : '#FFFFFF'}" font-size="27" font-weight="800" font-family="system-ui, sans-serif">
    ${safeTitle}
  </text>

  <!-- Caption / Summary Line -->
  <text x="64" y="182" fill="${isFresh ? '#334155' : '#94A3B8'}" font-size="13.5" font-weight="500" font-family="system-ui, sans-serif">
    ${safeCaption}
  </text>

  <!-- Domain Hero Visual Graphic (DNA, Shield, or Server Mesh) -->
  ${domainArtSvg}

  <!-- Component Nodes Architecture Canvas -->
  ${nodesSvg}

  <!-- Bottom Technical Summary Bar -->
  <g transform="translate(64, 452)">
    <rect width="1072" height="158" rx="16" fill="${isFresh ? '#FFFFFF' : '#0B132B'}" stroke="${isFresh ? '#E2E8F0' : '#1E293B'}" stroke-width="1.5" filter="${isFresh ? 'url(#cardShadow)' : 'none'}" />
    <rect width="1072" height="34" rx="16" fill="${isFresh ? '#F8FAFC' : '#0B132B'}" />
    
    <text x="24" y="22" fill="${isFresh ? '#0284C7' : '#38BDF8'}" font-size="11.5" font-weight="800" font-family="system-ui, sans-serif" letter-spacing="0.5">
      CONCEPTUAL MECHANISM &amp; EXECUTION FLOW:
    </text>

    <text x="24" y="66" fill="${isFresh ? '#1E293B' : '#CBD5E1'}" font-size="13" font-weight="500" font-family="system-ui, sans-serif">
      ${safeSummary}
    </text>

    <line x1="24" y1="98" x2="1048" y2="98" stroke="${isFresh ? '#E2E8F0' : '#1E293B'}" stroke-width="1" />

    <text x="24" y="130" fill="#059669" font-size="11" font-weight="700" font-family="system-ui, sans-serif">
      ✔ Grounded in Verified Lesson Material
    </text>

    <text x="450" y="130" fill="${isFresh ? '#475569' : '#64748B'}" font-size="11" font-weight="600" font-family="system-ui, sans-serif">
      Interactive Component Walkthrough
    </text>

    <text x="960" y="130" fill="#0284C7" font-size="11" font-weight="700" font-family="system-ui, sans-serif">
      Educational Visual
    </text>
  </g>
</svg>`;

    const base64Svg = Buffer.from(svgContent).toString('base64');
    return `data:image/svg+xml;base64,${base64Svg}`;
  }

  /**
   * Helper to ask Gemini directly to create a custom SVG diagram for this lesson
   */
  static async fetchGeminiSvgDiagram({ courseTitle, lessonTitle, summary = '', nodes = [] }) {
    if (!process.env.GEMINI_API_KEY) return null;
    try {
      const adapter = new GeminiAdapter();
      const svg = await adapter.generateLessonSvg({ courseTitle, lessonTitle, summary, nodes });
      if (svg && svg.length > 500 && svg.includes('<svg') && svg.includes('</svg>')) {
        const base64Svg = Buffer.from(svg).toString('base64');
        return `data:image/svg+xml;base64,${base64Svg}`;
      }
    } catch (err) {
      logger.warn('[CloudinaryService] Gemini SVG generation bypassed:', err.message);
    }
    return null;
  }

  /**
   * Helper to create and upload a lesson architectural diagram to Cloudinary
   */
  static async createAndUploadLessonDiagram({
    title,
    caption,
    nodes = [],
    summary = '',
    courseTitle = '',
    lessonTitle = '',
  }) {
    let svgDataUri = await this.fetchGeminiSvgDiagram({
      courseTitle,
      lessonTitle,
      summary,
      nodes,
    });

    if (!svgDataUri) {
      svgDataUri = this.generateSvgDiagram({
        title,
        caption,
        nodes,
        summary,
        courseTitle,
        lessonTitle,
      });
    }

    const publicId = `diagram_${lessonTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;

    const uploadRes = await this.uploadImage(svgDataUri, {
      folder: 'ai-academy/course-diagrams',
      publicId,
      tags: ['ai-academy', 'course-diagram', courseTitle],
    });

    return {
      url: uploadRes.secureUrl || uploadRes.url,
      publicId: uploadRes.publicId,
      width: uploadRes.width,
      height: uploadRes.height,
      caption,
      nodes,
      isCloudinary: uploadRes.isCloudinary,
    };
  }

  /**
   * Synthesize a hyper-relevant, domain-grounded prompt for AI Image generation
   * based on the exact topic (Biomolecules, DPDP, Microservices, AI, Business, etc.)
   */
  static buildDomainAccurateImagePrompt({ lessonTitle = '', courseTitle = '', customPrompt = '' }) {
    const cleanLesson = (lessonTitle || '')
      .replace(/^Lesson\s+[\d.]+:\s*/i, '')
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const cleanCourse = (courseTitle || '')
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const contextLower = `${cleanLesson} ${cleanCourse}`.toLowerCase();

    // 1. If a custom prompt was provided and is not the old generic software string, enrich it
    if (
      customPrompt &&
      customPrompt.trim().length > 15 &&
      !customPrompt.includes('dark slate and emerald enterprise UI')
    ) {
      return `${customPrompt.trim()}, professional educational illustration, ultra detailed, 8k resolution, cinematic lighting, photorealistic 3D render`;
    }

    // 2. Biology, Medicine, Biomolecules, Genetics, Chemistry
    if (
      contextLower.includes('biomolecule') ||
      contextLower.includes('protein') ||
      contextLower.includes('dna') ||
      contextLower.includes('rna') ||
      contextLower.includes('carbohydrate') ||
      contextLower.includes('cell') ||
      contextLower.includes('biology') ||
      contextLower.includes('chemistry') ||
      contextLower.includes('medical') ||
      contextLower.includes('enzyme') ||
      contextLower.includes('genetics') ||
      contextLower.includes('molecule')
    ) {
      return `3D scientific educational illustration of ${cleanLesson} in ${cleanCourse}, glowing molecular structures, DNA double-helix, protein chains, cellular biochemistry, clean modern medical laboratory aesthetic, highly detailed 8k render, photorealistic, cinematic lighting`;
    }

    // 3. Privacy, Data Protection, DPDP, Law, Compliance, Governance
    if (
      contextLower.includes('dpdp') ||
      contextLower.includes('privacy') ||
      contextLower.includes('data protection') ||
      contextLower.includes('fiduciary') ||
      contextLower.includes('consent') ||
      contextLower.includes('gazette') ||
      contextLower.includes('compliance') ||
      contextLower.includes('regulation') ||
      contextLower.includes('gdpr')
    ) {
      return `Conceptual 3D illustration of ${cleanLesson} in ${cleanCourse}, glowing digital privacy shield protecting citizen personal data, biometric verification badge, secure encrypted cloud vault, enterprise cybersecurity compliance aesthetic, highly detailed 8k render, cinematic lighting`;
    }

    // 4. Cloud Computing, Microservices, Kafka, Distributed Systems
    if (
      contextLower.includes('microservice') ||
      contextLower.includes('event') ||
      contextLower.includes('kafka') ||
      contextLower.includes('outbox') ||
      contextLower.includes('distributed') ||
      contextLower.includes('docker') ||
      contextLower.includes('kubernetes') ||
      contextLower.includes('cloud') ||
      contextLower.includes('database') ||
      contextLower.includes('backend')
    ) {
      return `Modern 3D isometric tech illustration of ${cleanLesson} in ${cleanCourse}, interconnected cloud server nodes, glowing event data streaming pipelines, futuristic computing infrastructure, clean enterprise tech style, 8k render`;
    }

    // 5. Artificial Intelligence, Machine Learning, Data Science
    if (
      contextLower.includes('ai') ||
      contextLower.includes('machine learning') ||
      contextLower.includes('llm') ||
      contextLower.includes('neural') ||
      contextLower.includes('deep learning') ||
      contextLower.includes('rag') ||
      contextLower.includes('algorithm')
    ) {
      return `Futuristic conceptual illustration of ${cleanLesson} in ${cleanCourse}, glowing neural network synapses, intelligent data processing pathways, sleek high-tech educational render, 8k resolution, cinematic lighting`;
    }

    // 6. Business, Economics, Management, Finance
    if (
      contextLower.includes('business') ||
      contextLower.includes('finance') ||
      contextLower.includes('marketing') ||
      contextLower.includes('economics') ||
      contextLower.includes('management') ||
      contextLower.includes('strategy')
    ) {
      return `Professional modern 3D business conceptual illustration of ${cleanLesson} in ${cleanCourse}, corporate strategy roadmap, glowing growth metrics, digital financial analysis, sleek executive aesthetic, 8k render`;
    }

    // 7. Default High-Quality Educational Conceptual Rendering
    return `Modern high-definition 3D educational concept illustration of ${cleanLesson} in ${cleanCourse}, clean professional visual design, cinematic lighting, ultra-detailed 8k render, vibrant composition`;
  }

  /**
   * Module: Generate high-resolution, domain-grounded real AI image based on PDF concept,
   * upload directly to Cloudinary, generate companion vector workflow diagram,
   * and bundle with interactive 4-stage walkthrough and audio teacher script.
   */
  static async generateAndUploadLessonVisual({
    imagePrompt = '',
    title = '',
    caption = '',
    nodes = [],
    teachingSteps = [],
    audioTeacherScript = '',
    courseTitle = '',
    lessonTitle = '',
    visualCategory = 'Overview & Concept Roadmap',
  }) {
    const cleanLesson = (lessonTitle || 'Technical Concept').replace(/^Lesson\s+[\d.]+:\s*/i, '').trim();
    const cleanCourse = (courseTitle || 'Course Curriculum').trim();

    // 1. Synthesize domain-tailored AI Image prompt
    const aiPrompt = this.buildDomainAccurateImagePrompt({
      lessonTitle: cleanLesson,
      courseTitle: cleanCourse,
      customPrompt: imagePrompt,
    });

    const seed = Math.floor(Math.random() * 999999);
    const aiImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=1280&height=720&model=turbo&nologo=true&seed=${seed}`;
    const aiPublicId = `ai_${cleanLesson.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;

    // 2. Build domain-accurate nodes from explicit nodes, teachingSteps, or lesson context
    let diagramNodes = [];
    if (Array.isArray(nodes) && nodes.length > 0) {
      diagramNodes = nodes.slice(0, 4);
    } else if (Array.isArray(teachingSteps) && teachingSteps.length > 0) {
      diagramNodes = teachingSteps.slice(0, 4).map((step, idx) => ({
        label: (step.title || `Stage 0${idx + 1}`).replace(/^Step\s+\d+:\s*|^\d+\.\s*/i, '').trim(),
        desc: step.explanation || `Core execution boundary for ${cleanLesson}`,
      }));
    } else {
      diagramNodes = [
        { label: `${cleanLesson} Ingestion`, desc: `Validates client context and establishes execution boundary` },
        { label: 'Domain State Processing', desc: `Applies deterministic logic without boundary leakage` },
        { label: 'Safety & Compliance Layer', desc: `Ensures compliance, auditability, and error handling` },
        { label: 'Verified Output Dispatch', desc: `Atomic state persistence and verified event delivery` },
      ];
    }

    const diagramTitle = title || `Visual Concept: ${cleanLesson}`;
    const diagramCaption = caption || `AI visual explanation and component interaction flow for ${cleanLesson}`;
    const summaryText = audioTeacherScript || `Visual component walkthrough and verified execution flow for ${cleanLesson} in ${cleanCourse}.`;

    // 3. Generate companion SVG architecture diagram (Try Gemini dynamic designer first, fallback to clean SVG)
    let svgDataUri = null;
    try {
      svgDataUri = await this.fetchGeminiSvgDiagram({
        courseTitle: cleanCourse,
        lessonTitle: cleanLesson,
        summary: summaryText,
        nodes: diagramNodes,
      });
    } catch (err) {
      logger.warn('[CloudinaryService] Gemini SVG generation bypassed:', err.message);
    }

    if (!svgDataUri) {
      svgDataUri = this.generateSvgDiagram({
        title: diagramTitle,
        caption: diagramCaption,
        nodes: diagramNodes,
        summary: summaryText,
        courseTitle: cleanCourse,
        lessonTitle: cleanLesson,
        visualCategory,
      });
    }

    let aiUploadRes = null;
    let svgUploadRes = null;

    // 4. Safely pre-fetch real AI Image buffer from AI engine with a 20-second timeout.
    // If successful, convert to Base64 Data URI so Cloudinary receives direct base64 data.
    let aiBase64Uri = null;
    try {
      const prefetchRes = await fetch(aiImageUrl, { signal: AbortSignal.timeout(20000) });
      if (prefetchRes.ok && prefetchRes.status === 200) {
        const buffer = await prefetchRes.arrayBuffer();
        if (buffer && buffer.byteLength > 2000) {
          aiBase64Uri = 'data:image/jpeg;base64,' + Buffer.from(buffer).toString('base64');
        }
      }
    } catch (err) {
      logger.warn('[CloudinaryService] External AI image generation timed out or failed, proceeding with vector visual:', err.message);
    }

    // 5. Upload real AI Image to Cloudinary if verified Base64 is available
    if (aiBase64Uri) {
      try {
        aiUploadRes = await this.uploadImage(aiBase64Uri, {
          folder: 'ai-academy/ai-course-images',
          publicId: aiPublicId,
          tags: ['ai-academy', 'ai-generated', cleanCourse],
        });
      } catch (err) {
        logger.warn('[CloudinaryService] AI Image upload warning:', err.message);
      }
    }

    // 6. Upload companion SVG diagram directly to Cloudinary as Base64 Data URI
    try {
      const svgPublicId = `diagram_${cleanLesson.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;
      svgUploadRes = await this.uploadImage(svgDataUri, {
        folder: 'ai-academy/course-diagrams',
        publicId: svgPublicId,
        tags: ['ai-academy', 'course-diagram', cleanCourse],
      });
    } catch (err) {
      logger.warn('[CloudinaryService] SVG diagram upload warning:', err.message);
    }

    // 7. Select primary delivery URL: prefer Real AI Image if uploaded successfully, else SVG diagram
    const hasAiImage = Boolean(aiUploadRes && aiUploadRes.success && aiUploadRes.secureUrl);
    const primaryUrl = hasAiImage
      ? aiUploadRes.secureUrl
      : (svgUploadRes?.secureUrl || svgUploadRes?.url || svgDataUri);

    const companionDiagramUrl = svgUploadRes?.secureUrl || svgUploadRes?.url || svgDataUri;

    // Default teaching steps if not provided
    const safeTeachingSteps = Array.isArray(teachingSteps) && teachingSteps.length > 0
      ? teachingSteps
      : diagramNodes.map((n, i) => ({
          step: i + 1,
          title: `${i + 1}. ${n.label}`,
          explanation: n.desc,
          visualFocus: `Stage 0${i + 1} on the visual diagram`,
        }));

    const safeAudioScript = audioTeacherScript ||
      `Welcome to this visual walkthrough of ${cleanLesson}. In Stage 1, notice how ${diagramNodes[0]?.label || 'the initial component'} sets the foundation. Next, Stage 2 explores ${diagramNodes[1]?.label || 'core mechanisms'}. Stage 3 introduces ${diagramNodes[2]?.label || 'safeguards'}, before Stage 4 completes ${diagramNodes[3]?.label || 'the final outcome'}.`;

    return {
      url: primaryUrl,
      aiImageUrl: hasAiImage ? aiUploadRes.secureUrl : null,
      diagramUrl: companionDiagramUrl,
      publicId: hasAiImage ? aiUploadRes.publicId : (svgUploadRes?.publicId || aiPublicId),
      width: hasAiImage ? (aiUploadRes.width || 1280) : 1200,
      height: hasAiImage ? (aiUploadRes.height || 720) : 675,
      title: diagramTitle,
      caption: diagramCaption,
      visualCategory,
      teachingSteps: safeTeachingSteps,
      audioTeacherScript: safeAudioScript,
      isCloudinary: Boolean(aiUploadRes?.isCloudinary || svgUploadRes?.isCloudinary),
      isAiImage: true,
      theme: 'fresh',
    };
  }

  /**
   * Module: Generate multiple fresh, domain-accurate educational visuals per module/lesson
   * Uploads all visuals to Cloudinary and returns an array of visuals for player carousel.
   */
  static async generateAndUploadMultipleLessonVisuals({
    courseTitle = '',
    lessonTitle = '',
    moduleTitle = '',
    imagePrompt = '',
    nodes = [],
    teachingSteps = [],
    audioTeacherScript = '',
    lessonSummary = '',
  }) {
    const cleanLesson = (lessonTitle || 'Lesson Concept').replace(/^Lesson\s+[\d.]+:\s*/i, '').trim();
    const cleanCourse = (courseTitle || 'Course Curriculum').trim();

    // 1. Visual 1 Config: Core Concept & Architecture Overview
    const visual1Promise = this.generateAndUploadLessonVisual({
      courseTitle: cleanCourse,
      lessonTitle: cleanLesson,
      title: `Overview & Foundation: ${cleanLesson}`,
      caption: `Core component roadmap, fundamental principles, and high-level architecture`,
      visualCategory: 'Overview & Fundamentals',
      imagePrompt: imagePrompt || `${cleanLesson} in ${cleanCourse}, educational concept visual, high detail, 3D render`,
      nodes: Array.isArray(nodes) && nodes.length > 0 ? nodes : undefined,
      teachingSteps,
      audioTeacherScript,
    });

    // 2. Visual 2 Config: Mechanics & Deep-Dive Execution Flow
    const visual2Nodes = Array.isArray(nodes) && nodes.length >= 2
      ? nodes.slice(0, 4)
      : [
          { label: 'Context & Preconditions', desc: `Foundational requirements and operational context for ${cleanLesson}` },
          { label: 'Dynamic Processing', desc: `Active mechanisms and structural state transitions in ${cleanLesson}` },
          { label: 'Integrity & Safeguards', desc: `Boundary enforcement, verification, and deterministic error handling` },
          { label: 'Downstream Impact', desc: `Synthesized outcomes and persistent state transitions for ${cleanLesson}` },
        ];
    const visual2Steps = visual2Nodes.map((n, i) => ({
      step: i + 1,
      title: `${i + 1}. ${n.label}`,
      explanation: n.desc,
      visualFocus: `Stage 0${i + 1} on the visual diagram`,
    }));

    const visual2Promise = this.generateAndUploadLessonVisual({
      courseTitle: cleanCourse,
      lessonTitle: cleanLesson,
      title: `Mechanics & Execution Flow: ${cleanLesson}`,
      caption: `In-depth structural transitions, component interactions, and execution flow`,
      visualCategory: 'Core Mechanics',
      imagePrompt: `Technical schematic and detailed functional interaction of ${cleanLesson} in ${cleanCourse}, 3D isometric render, vivid colors, ultra detailed`,
      nodes: visual2Nodes,
      teachingSteps: visual2Steps,
      audioTeacherScript: `This second visual breakdown focuses on the internal mechanics and execution flow of ${cleanLesson}. Notice how each stage transitions smoothly to maintain system integrity.`,
    });

    // 3. Visual 3 Config: Real-World Application & Production Safeguards
    const visual3Nodes = [
      { label: 'Operational Substrate', desc: `Real-world environment input context and precondition audit for ${cleanLesson}` },
      { label: 'Execution Safeguards', desc: `Resilience protocols, fault containment, and boundary compliance enforcement` },
      { label: 'Telemetry & Verification', desc: `Live operational monitoring, audit checkpoints, and verified metrics` },
      { label: 'Production Outcome', desc: `Verified deliverables, systemic impact, and lasting practical value for ${cleanLesson}` },
    ];
    const visual3Steps = visual3Nodes.map((n, i) => ({
      step: i + 1,
      title: `${i + 1}. ${n.label}`,
      explanation: n.desc,
      visualFocus: `Stage 0${i + 1} on the visual diagram`,
    }));

    const visual3Promise = this.generateAndUploadLessonVisual({
      courseTitle: cleanCourse,
      lessonTitle: cleanLesson,
      title: `Real-World Application & Safeguards: ${cleanLesson}`,
      caption: `Practical production execution, real-world deployment safeguards, and compliance metrics`,
      visualCategory: 'Real-World Execution',
      imagePrompt: `Real-world practical implementation of ${cleanLesson} in ${cleanCourse}, professional scenario, high detail, cinematic lighting, 8k`,
      nodes: visual3Nodes,
      teachingSteps: visual3Steps,
      audioTeacherScript: `In this third visual, we examine real-world application and safeguards for ${cleanLesson}. See how structured execution ensures reliable results in production environments.`,
    });

    // Run all 3 visual uploads in parallel directly to Cloudinary
    const [visual1, visual2, visual3] = await Promise.all([visual1Promise, visual2Promise, visual3Promise]);

    const imagesArray = [
      { ...visual1, label: '01. Overview & Fundamentals' },
      { ...visual2, label: '02. Core Mechanics' },
      { ...visual3, label: '03. Real-World Execution' },
    ];

    return {
      ...visual1,
      images: imagesArray,
    };
  }

  /**
   * Generate signed parameters for direct browser-to-Cloudinary video uploads
   * Supports large videos without hitting Next.js API payload limits.
   */
  static getSignedVideoUploadParams(options = {}) {
    const config = this.getConfig();
    if (!config.isConfigured) {
      return {
        isConfigured: false,
        error: 'Cloudinary credentials are not configured in .env.local',
      };
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = options.folder || 'ai-academy/video-uploads';
    const paramsToSign = {
      folder,
      timestamp,
    };

    const signature = this.generateSignature(paramsToSign, config.apiSecret);

    return {
      isConfigured: true,
      cloudName: config.cloudName,
      apiKey: config.apiKey,
      timestamp,
      folder,
      signature,
      uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/video/upload`,
    };
  }

  /**
   * Build instant trimmed short-clip streaming, download, and thumbnail URLs
   * directly via Cloudinary on-the-fly video transformations (so_<start>,eo_<end>).
   */
  static buildVideoClipUrls(publicId, startSeconds, endSeconds, options = {}) {
    const config = this.getConfig();
    const start = Math.max(0, Math.round(Number(startSeconds) || 0));
    const end = Math.max(start + 1, Math.round(Number(endSeconds) || start + 15));
    const mid = Math.round(start + (end - start) / 2);

    if (!config.isConfigured || !publicId) {
      const fallbackUrl = options.sourceVideoUrl || '';
      return {
        clipUrl: fallbackUrl ? `${fallbackUrl}#t=${start},${end}` : '',
        downloadUrl: fallbackUrl,
        thumbnailUrl: '',
        aiProxyUrl: fallbackUrl,
      };
    }

    // Remove any file extension from publicId if present
    const cleanPublicId = publicId.replace(/\.(mp4|mov|webm|mkv|avi)$/i, '');
    const rawName = (options.clipTitle || 'clip')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'clip';

    const base = `https://res.cloudinary.com/${config.cloudName}/video/upload`;

    return {
      clipUrl: `${base}/so_${start},eo_${end},vc_auto,q_auto/${cleanPublicId}.mp4`,
      downloadUrl: `${base}/so_${start},eo_${end},vc_auto,q_auto,fl_attachment:${rawName}/${cleanPublicId}.mp4`,
      thumbnailUrl: `${base}/so_${mid},w_640,h_360,c_fill,q_auto/${cleanPublicId}.jpg`,
      aiProxyUrl: `${base}/w_640,q_auto:good/${cleanPublicId}.mp4`,
    };
  }
}

export default CloudinaryService;
