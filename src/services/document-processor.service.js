import SourceDocument from '../models/SourceDocument.js';
import SourceDocumentVersion from '../models/SourceDocumentVersion.js';
import DocumentChunk from '../models/DocumentChunk.js';
import DocumentProcessingJob from '../models/DocumentProcessingJob.js';
import CourseSourceMapping from '../models/CourseSourceMapping.js';
import { AIProviderFactory } from './ai-adapters/ai-provider.factory.js';
import { BaseService } from './base.service.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';
import { SOURCE_DOC_STATUS, SUPPORTED_SOURCE_FORMATS, JOB_STATUS } from '../constants/index.js';

export class DocumentProcessorService extends BaseService {
  constructor() {
    super(SourceDocument);
  }

  /**
   * Validate and register a new source document
   */
  static async registerDocument(tenantId, {
    title,
    originalFilename,
    fileType,
    fileSize = 0,
    storageKey = '',
    fileUrl = '',
    description = '',
    tags = [],
  }, userId) {
    if (!title || !originalFilename || !fileType) {
      throw new BadRequestError('title, originalFilename, and fileType are required');
    }

    const cleanExt = fileType.toLowerCase().replace(/^\./, '');
    if (!SUPPORTED_SOURCE_FORMATS.includes(cleanExt)) {
      throw new BadRequestError(`Unsupported file format .${cleanExt}. Supported: ${SUPPORTED_SOURCE_FORMATS.join(', ')}`);
    }

    // 50 MB file size limit
    const MAX_SIZE = 50 * 1024 * 1024;
    if (fileSize > MAX_SIZE) {
      throw new BadRequestError('File exceeds maximum allowable size of 50 MB');
    }

    const document = await SourceDocument.create({
      tenantId,
      title: title.trim(),
      originalFilename,
      fileType: cleanExt,
      fileSize,
      storageKey,
      fileUrl,
      description: description.trim(),
      tags: Array.isArray(tags) ? tags : [],
      status: SOURCE_DOC_STATUS.PENDING,
      currentVersion: 1,
      createdBy: userId,
      updatedBy: userId,
    });

    // Create version 1 record
    await SourceDocumentVersion.create({
      tenantId,
      documentId: document._id,
      versionNumber: 1,
      fileSize,
      storageKey,
      changelog: 'Initial document upload',
      createdBy: userId,
    });

    return document;
  }

  /**
   * Ingest, extract, chunk, and embed raw text or document content
   */
  static async processDocumentContent(tenantId, documentId, rawTextContent, options = {}) {
    const document = await SourceDocument.findOne({ _id: documentId, tenantId });
    if (!document) {
      throw new NotFoundError('Source document not found');
    }

    const job = await DocumentProcessingJob.create({
      tenantId,
      documentId,
      status: JOB_STATUS.PROCESSING,
      step: 'EXTRACTION',
      progress: 10,
      startedAt: new Date(),
    });

    try {
      document.status = SOURCE_DOC_STATUS.PROCESSING;
      await document.save();

      // Step 1: Semantic Chunking (split by page breaks, paragraphs, or fixed length)
      job.step = 'CHUNKING';
      job.progress = 30;
      await job.save();

      const chunksData = this.chunkText(rawTextContent, options);

      // Step 2: Vector Embedding Generation
      job.step = 'EMBEDDING';
      job.progress = 60;
      await job.save();

      const aiAdapter = await AIProviderFactory.getProvider(tenantId);
      const textArray = chunksData.map((c) => c.content);
      const embeddings = await aiAdapter.generateEmbeddings(textArray);

      // Step 3: Indexing Chunks
      job.step = 'INDEXING';
      job.progress = 85;
      await job.save();

      // Delete prior chunks for this document version
      await DocumentChunk.deleteMany({
        documentId,
        tenantId,
        versionNumber: document.currentVersion,
      });

      const chunkDocs = chunksData.map((c, idx) => ({
        tenantId,
        documentId,
        versionNumber: document.currentVersion,
        chunkIndex: idx,
        content: c.content,
        pageNumber: c.pageNumber || 1,
        tokenCount: Math.round(c.content.length / 4),
        embedding: embeddings[idx] || [],
        metadata: {
          documentName: document.title,
          originalFilename: document.originalFilename,
        },
      }));

      await DocumentChunk.insertMany(chunkDocs);

      // Update Document Status
      document.status = SOURCE_DOC_STATUS.PROCESSED;
      document.chunkCount = chunkDocs.length;
      document.pageCount = Math.max(1, ...chunksData.map((c) => c.pageNumber || 1));
      document.extractedSummary = rawTextContent.substring(0, 300) + '...';
      await document.save();

      // Complete Job
      job.status = JOB_STATUS.COMPLETED;
      job.step = 'COMPLETED';
      job.progress = 100;
      job.completedAt = new Date();
      await job.save();

      return {
        success: true,
        documentId: document._id,
        chunkCount: chunkDocs.length,
        pageCount: document.pageCount,
      };
    } catch (err) {
      document.status = SOURCE_DOC_STATUS.FAILED;
      await document.save();

      job.status = JOB_STATUS.FAILED;
      job.error = err.message;
      job.completedAt = new Date();
      await job.save();

      throw err;
    }
  }

  /**
   * Split raw text into structured chunks with page boundaries
   */
  static chunkText(text, options = {}) {
    if (!text || typeof text !== 'string') return [];

    const chunkSize = options.chunkSize || 600;
    const overlap = options.overlap || 100;

    // Check if text has explicit Page markers like "--- Page 1 ---"
    const pageMarkerRegex = /---\s*Page\s*(\d+)\s*---/gi;
    const matches = [...text.matchAll(pageMarkerRegex)];

    const chunks = [];

    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        const pageNum = parseInt(matches[i][1], 10);
        const startIndex = matches[i].index + matches[i][0].length;
        const endIndex = i < matches.length - 1 ? matches[i + 1].index : text.length;
        const pageContent = text.substring(startIndex, endIndex).trim();

        if (!pageContent) continue;

        let start = 0;
        while (start < pageContent.length) {
          const end = Math.min(pageContent.length, start + chunkSize);
          const segment = pageContent.substring(start, end).trim();
          if (segment.length > 20) {
            chunks.push({
              content: segment,
              pageNumber: pageNum,
            });
          }
          if (end >= pageContent.length) break;
          start += chunkSize - overlap;
        }
      }
    } else {
      // Split by form feeds or continuous chunking
      const pages = text.split(/\f/);
      let pageNum = 1;
      for (const pageText of pages) {
        const clean = pageText.trim();
        if (!clean) {
          pageNum++;
          continue;
        }
        let start = 0;
        while (start < clean.length) {
          const end = Math.min(clean.length, start + chunkSize);
          const segment = clean.substring(start, end).trim();
          if (segment.length > 20) {
            chunks.push({
              content: segment,
              pageNumber: pageNum,
            });
          }
          if (end >= clean.length) break;
          start += chunkSize - overlap;
        }
        pageNum++;
      }
    }

    return chunks;
  }

  /**
   * Structural Retrieval: retrieve Table of Contents, headings, and evenly distributed chunks across PDF
   */
  static async retrieveDocumentOverview(tenantId, documentIds = [], maxChunks = 25) {
    const filter = { tenantId };
    if (documentIds.length > 0) {
      filter.documentId = { $in: documentIds };
    }

    const allChunks = await DocumentChunk.find(filter)
      .sort({ chunkIndex: 1 })
      .lean();

    if (allChunks.length <= maxChunks) {
      return allChunks;
    }

    // Always include first 6 chunks (Table of Contents / Introduction / Chapter list)
    const headChunks = allChunks.slice(0, 6);
    const remainingSlots = Math.max(1, maxChunks - headChunks.length);
    const restChunks = allChunks.slice(6);

    // Evenly sample across the rest of the document
    const step = Math.max(1, Math.floor(restChunks.length / remainingSlots));
    const sampled = [];
    for (let i = 0; i < restChunks.length && sampled.length < remainingSlots; i += step) {
      sampled.push(restChunks[i]);
    }

    return [...headChunks, ...sampled];
  }

  /**
   * Semantic Retrieval: find top-K chunks matching query embedding via cosine similarity
   */
  static async retrieveRelevantChunks(tenantId, query, documentIds = [], limit = 5) {
    const aiAdapter = await AIProviderFactory.getProvider(tenantId);
    const [queryEmbedding] = await aiAdapter.generateEmbeddings([query]);

    const filter = { tenantId };
    if (documentIds.length > 0) {
      filter.documentId = { $in: documentIds };
    }

    const candidateChunks = await DocumentChunk.find(filter).lean();
    if (candidateChunks.length === 0) return [];

    // Calculate Cosine Similarity
    const scored = candidateChunks.map((chunk) => {
      const score = this.calculateCosineSimilarity(queryEmbedding, chunk.embedding);
      return { ...chunk, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  /**
   * Cosine Similarity calculation between two numerical vectors
   */
  static calculateCosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    let dot = 0;
    let magA = 0;
    let magB = 0;
    const len = Math.min(vecA.length, vecB.length);

    for (let i = 0; i < len; i++) {
      dot += vecA[i] * vecB[i];
      magA += vecA[i] * vecA[i];
      magB += vecB[i] * vecB[i];
    }

    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  /**
   * Living Course / Document Sync: Upload revision, detect chunk changes, and flag mapped courses
   */
  static async syncDocumentRevision(tenantId, documentId, newTextContent, changelog = 'Revision update', userId) {
    const document = await SourceDocument.findOne({ _id: documentId, tenantId });
    if (!document) {
      throw new NotFoundError('Source document not found');
    }

    const newVersionNumber = document.currentVersion + 1;
    document.currentVersion = newVersionNumber;
    await document.save();

    // Create SourceDocumentVersion record
    await SourceDocumentVersion.create({
      tenantId,
      documentId,
      versionNumber: newVersionNumber,
      changelog,
      fileSize: newTextContent.length,
      createdBy: userId,
    });

    // Process new content
    await this.processDocumentContent(tenantId, documentId, newTextContent);

    // Identify affected mapped courses
    const mappings = await CourseSourceMapping.find({ tenantId, documentId });
    const changeReport = {
      documentId: document._id,
      documentTitle: document.title,
      oldVersion: newVersionNumber - 1,
      newVersion: newVersionNumber,
      changelog,
      affectedCoursesCount: mappings.length,
      generatedAt: new Date(),
    };

    // Mark mapped courses as out of sync with pending change report
    await CourseSourceMapping.updateMany(
      { tenantId, documentId },
      {
        $set: {
          isSynced: false,
          pendingChangeReport: changeReport,
        },
      }
    );

    return {
      success: true,
      documentVersion: newVersionNumber,
      affectedCoursesCount: mappings.length,
      changeReport,
    };
  }
}
