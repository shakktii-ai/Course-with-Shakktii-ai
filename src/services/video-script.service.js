import mongoose from 'mongoose';
import { VideoProject } from '../models/VideoProject.js';
import { VideoScene } from '../models/VideoScene.js';
import { Lesson } from '../models/Lesson.js';
import { LessonBlock } from '../models/LessonBlock.js';
import { NotFoundError, BadRequestError } from '../lib/errors.js';
import { VIDEO_STATUS, SCENE_VISUAL_TYPE, VIDEO_ASPECT_RATIO, VIDEO_RESOLUTION } from '../constants/index.js';

export class VideoScriptService {
  /**
   * Helper: Calculate estimated scene duration from narration text
   * Average conversational speaking rate: 140 words/min => ~2.3 words/sec
   */
  static estimateDurationSeconds(narrationText) {
    if (!narrationText || !narrationText.trim()) return 5;
    const words = narrationText.trim().split(/\s+/).length;
    const duration = Math.round(words / 2.3);
    return Math.max(4, duration);
  }

  /**
   * Generate a multi-scene video script from an existing Lesson
   */
  static async generateScriptFromLesson(tenantId, lessonId, options = {}, user) {
    const lesson = await Lesson.findOne({ _id: lessonId, tenantId });
    if (!lesson) {
      throw new NotFoundError('Lesson not found or does not belong to this organization');
    }

    const blocks = await LessonBlock.find({ lessonId, tenantId }).sort({ order: 1 });

    // Derive script scenes from lesson title, description, and content blocks
    const rawScenes = [];

    // Scene 1: Introduction
    rawScenes.push({
      title: `Introduction: ${lesson.title}`,
      narrationText: `Welcome to this module on ${lesson.title}. In this video, we will walk through the core principles and practical applications you need to master this topic.`,
      visualType: SCENE_VISUAL_TYPE.SLIDE,
      visualContent: {
        headline: lesson.title,
        bullets: ['Key Concepts Overview', 'Practical Walkthrough', 'Summary & Review'],
        layoutTemplate: 'title-overview',
        accentColor: '#059669',
      },
      teleprompterNotes: 'Deliver with high energy and welcome the learners warmly.',
    });

    // Content scenes from lesson blocks or synthesized sections
    if (blocks && blocks.length > 0) {
      blocks.forEach((block, idx) => {
        const blockContent = block.content?.html || block.content?.markdown || block.content?.text || '';
        const cleanContent = blockContent.replace(/<[^>]*>/g, '').trim();
        const snippet = cleanContent.slice(0, 180);

        rawScenes.push({
          title: `Part ${idx + 1}: ${block.type} Overview`,
          narrationText: snippet || `Next, let us explore the details of ${lesson.title} and examine how these components function in practice.`,
          visualType: idx % 2 === 0 ? SCENE_VISUAL_TYPE.AVATAR_PRESENTATION : SCENE_VISUAL_TYPE.CODE_DEMO,
          visualContent: {
            headline: `Module Focus: Step ${idx + 1}`,
            bullets: [
              'Understand core architecture',
              'Review implementation guidelines',
              'Identify key operational requirements',
            ],
            codeSnippet: idx % 2 !== 0 ? '// Enterprise configuration\nconst config = { enabled: true, mode: "strict" };' : '',
            layoutTemplate: idx % 2 === 0 ? 'avatar-presentation' : 'code-walkthrough',
            accentColor: '#059669',
          },
          teleprompterNotes: 'Highlight the practical takeaway for the learner.',
        });
      });
    } else {
      // Default 2 core content scenes
      rawScenes.push({
        title: 'Core Concepts & Workflow',
        narrationText: `Let us break down the primary concepts of ${lesson.title}. Understanding these foundational principles enables you to design, build, and deploy reliable solutions.`,
        visualType: SCENE_VISUAL_TYPE.AVATAR_PRESENTATION,
        visualContent: {
          headline: 'Core Architectural Concepts',
          bullets: [
            'System Design & Isolation',
            'Data Integrity & Validation',
            'Scalable Execution Pipelines',
          ],
          layoutTemplate: 'avatar-presentation',
          accentColor: '#059669',
        },
        teleprompterNotes: 'Pace evenly and articulate key technical terms clearly.',
      });

      rawScenes.push({
        title: 'Implementation & Best Practices',
        narrationText: `Here is a code example demonstrating how these components interact smoothly in production environments. Notice the defensive error handling and strict boundary checks.`,
        visualType: SCENE_VISUAL_TYPE.CODE_DEMO,
        visualContent: {
          headline: 'Production Implementation',
          codeSnippet: `// Example service handler\nexport async function executeStep(context) {\n  const validated = await validatePayload(context);\n  return await processJob(validated);\n}`,
          codeLanguage: 'javascript',
          bullets: ['Stateless execution', 'Strict validation', 'Audited logging'],
          layoutTemplate: 'code-walkthrough',
          accentColor: '#059669',
        },
        teleprompterNotes: 'Pause slightly when pointing out the code snippet lines.',
      });
    }

    // Final Scene: Conclusion
    rawScenes.push({
      title: 'Summary & Key Takeaways',
      narrationText: `To recap, we examined the structure of ${lesson.title}, verified implementation details, and prepared for the next hands-on assessment. Great job completing this session!`,
      visualType: SCENE_VISUAL_TYPE.SLIDE,
      visualContent: {
        headline: 'Session Summary',
        bullets: ['Foundational Concepts Mastered', 'Enterprise Best Practices Reviewed', 'Next: Knowledge Check'],
        layoutTemplate: 'key-takeaways',
        accentColor: '#059669',
      },
      teleprompterNotes: 'Congratulate the learner and encourage them to continue.',
    });

    // Create the VideoProject
    const project = await VideoProject.create({
      tenantId,
      title: options.title || `Video: ${lesson.title}`,
      description: options.description || `AI-generated video presentation for ${lesson.title}`,
      courseId: lesson.courseId,
      lessonId: lesson._id,
      status: VIDEO_STATUS.DRAFT,
      aspectRatio: options.aspectRatio || VIDEO_ASPECT_RATIO.LANDSCAPE_16_9,
      resolution: options.resolution || VIDEO_RESOLUTION.RES_1080P,
      theme: options.theme || {
        primaryColor: '#059669',
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        fontFamily: 'Inter',
        template: 'modern-enterprise',
      },
      voiceConfig: options.voiceConfig || {
        voiceId: 'en-US-JennyNeural',
        provider: 'MOCK',
        language: 'en',
        speedRate: 1.0,
        pitch: 1.0,
      },
      avatarConfig: options.avatarConfig || {
        enabled: true,
        avatarId: 'prof-clara',
        style: 'professional',
        position: 'bottom-right',
      },
      createdBy: user?._id || user?.id,
    });

    // Create the scenes
    let totalDuration = 0;
    const sceneDocs = [];

    for (let i = 0; i < rawScenes.length; i++) {
      const raw = rawScenes[i];
      const duration = this.estimateDurationSeconds(raw.narrationText);
      totalDuration += duration;

      const sceneDoc = await VideoScene.create({
        tenantId,
        projectId: project._id,
        sceneOrder: i + 1,
        title: raw.title,
        narrationText: raw.narrationText,
        visualType: raw.visualType,
        visualContent: raw.visualContent,
        durationSeconds: duration,
        teleprompterNotes: raw.teleprompterNotes,
      });
      sceneDocs.push(sceneDoc);
    }

    project.scenesCount = sceneDocs.length;
    project.totalDurationSeconds = totalDuration;
    await project.save();

    return { project, scenes: sceneDocs };
  }

  /**
   * Generate a multi-scene video script from a custom prompt/topic
   */
  static async generateScriptFromPrompt(tenantId, payload, user) {
    const { title, prompt, courseId, lessonId, targetScenes = 4, aspectRatio, resolution, theme, voiceConfig, avatarConfig } = payload;
    if (!title || !title.trim()) {
      throw new BadRequestError('Project title is required');
    }
    if (!prompt || !prompt.trim()) {
      throw new BadRequestError('Prompt or topic description is required');
    }

    const project = await VideoProject.create({
      tenantId,
      title: title.trim(),
      description: prompt.trim().slice(0, 300),
      courseId: courseId || null,
      lessonId: lessonId || null,
      status: VIDEO_STATUS.DRAFT,
      aspectRatio: aspectRatio || VIDEO_ASPECT_RATIO.LANDSCAPE_16_9,
      resolution: resolution || VIDEO_RESOLUTION.RES_1080P,
      theme: theme || {
        primaryColor: '#059669',
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        fontFamily: 'Inter',
        template: 'modern-enterprise',
      },
      voiceConfig: voiceConfig || {
        voiceId: 'en-US-JennyNeural',
        provider: 'MOCK',
        language: 'en',
        speedRate: 1.0,
        pitch: 1.0,
      },
      avatarConfig: avatarConfig || {
        enabled: true,
        avatarId: 'prof-clara',
        style: 'professional',
        position: 'bottom-right',
      },
      createdBy: user?._id || user?.id,
    });

    // Generate scenes based on targetScenes count
    const numScenes = Math.max(2, Math.min(10, targetScenes));
    let totalDuration = 0;
    const sceneDocs = [];

    for (let i = 0; i < numScenes; i++) {
      let sceneTitle = `Scene ${i + 1}`;
      let visualType = SCENE_VISUAL_TYPE.SLIDE;
      let narration = '';
      let headline = '';
      let bullets = [];

      if (i === 0) {
        sceneTitle = `Overview: ${title.trim()}`;
        narration = `Hello everyone, welcome to this presentation on ${title.trim()}. Today we will cover key concepts, best practices, and actionable techniques.`;
        visualType = SCENE_VISUAL_TYPE.SLIDE;
        headline = title.trim();
        bullets = ['Overview and Objectives', 'Detailed Breakdown', 'Practical Examples'];
      } else if (i === numScenes - 1) {
        sceneTitle = 'Summary & Next Steps';
        narration = `That concludes our session on ${title.trim()}. Make sure to review the accompanying documentation and test your knowledge. Thank you for watching!`;
        visualType = SCENE_VISUAL_TYPE.SLIDE;
        headline = 'Key Takeaways';
        bullets = ['Core principles mastered', 'Ready for hands-on application', 'Review questions'];
      } else {
        sceneTitle = `Topic ${i}: Core Principles`;
        narration = `In this segment, we focus on the core mechanisms supporting ${title.trim()}. It is essential to ensure robustness, security, and scalability in every component.`;
        visualType = i % 2 === 0 ? SCENE_VISUAL_TYPE.AVATAR_PRESENTATION : SCENE_VISUAL_TYPE.TEXT_HIGHLIGHT;
        headline = `Section ${i}: Deep Dive`;
        bullets = ['Component Architecture', 'Data Flow and Isolation', 'Edge Case Handling'];
      }

      const duration = this.estimateDurationSeconds(narration);
      totalDuration += duration;

      const sceneDoc = await VideoScene.create({
        tenantId,
        projectId: project._id,
        sceneOrder: i + 1,
        title: sceneTitle,
        narrationText: narration,
        visualType,
        visualContent: {
          headline,
          bullets,
          layoutTemplate: 'standard-bullets',
          accentColor: '#059669',
        },
        durationSeconds: duration,
        teleprompterNotes: `Guide the learner through ${sceneTitle}.`,
      });
      sceneDocs.push(sceneDoc);
    }

    project.scenesCount = sceneDocs.length;
    project.totalDurationSeconds = totalDuration;
    await project.save();

    return { project, scenes: sceneDocs };
  }

  /**
   * Get single project with all its scenes
   */
  static async getProjectWithScenes(tenantId, projectId) {
    const project = await VideoProject.findOne({ _id: projectId, tenantId });
    if (!project) {
      throw new NotFoundError('Video project not found');
    }

    const scenes = await VideoScene.find({ projectId, tenantId }).sort({ sceneOrder: 1 });
    return { project, scenes };
  }

  /**
   * List video projects with filtering & pagination
   */
  static async listProjects(tenantId, query = {}, pagination = { page: 1, limit: 20 }) {
    const filter = { tenantId };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.courseId) {
      filter.courseId = query.courseId;
    }
    if (query.lessonId) {
      filter.lessonId = query.lessonId;
    }
    if (query.search) {
      filter.title = { $regex: query.search.trim(), $options: 'i' };
    }

    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      VideoProject.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      VideoProject.countDocuments(filter),
    ]);

    return {
      items: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update video project metadata
   */
  static async updateProject(tenantId, projectId, updateData, user) {
    const project = await VideoProject.findOne({ _id: projectId, tenantId });
    if (!project) {
      throw new NotFoundError('Video project not found');
    }

    const allowed = ['title', 'description', 'aspectRatio', 'resolution', 'theme', 'voiceConfig', 'avatarConfig', 'status'];
    allowed.forEach((field) => {
      if (updateData[field] !== undefined) {
        project[field] = updateData[field];
      }
    });

    project.updatedBy = user?._id || user?.id || null;
    await project.save();
    return project;
  }

  /**
   * Delete video project and all child scenes
   */
  static async deleteProject(tenantId, projectId) {
    const project = await VideoProject.findOne({ _id: projectId, tenantId });
    if (!project) {
      throw new NotFoundError('Video project not found');
    }

    await Promise.all([
      VideoProject.deleteOne({ _id: projectId, tenantId }),
      VideoScene.deleteMany({ projectId, tenantId }),
    ]);

    return { success: true, deletedProjectId: projectId };
  }

  /**
   * Add a new scene to the end of a project
   */
  static async addScene(tenantId, projectId, sceneData) {
    const project = await VideoProject.findOne({ _id: projectId, tenantId });
    if (!project) {
      throw new NotFoundError('Video project not found');
    }

    const existingScenes = await VideoScene.find({ projectId, tenantId }).sort({ sceneOrder: -1 }).limit(1);
    const nextOrder = existingScenes.length > 0 ? existingScenes[0].sceneOrder + 1 : 1;

    const narration = sceneData.narrationText || 'New scene narration text';
    const duration = sceneData.durationSeconds || this.estimateDurationSeconds(narration);

    const scene = await VideoScene.create({
      tenantId,
      projectId,
      sceneOrder: nextOrder,
      title: sceneData.title || `Scene ${nextOrder}`,
      narrationText: narration,
      visualType: sceneData.visualType || SCENE_VISUAL_TYPE.SLIDE,
      visualContent: sceneData.visualContent || {
        headline: sceneData.title || `Scene ${nextOrder}`,
        bullets: ['Key point 1', 'Key point 2'],
        layoutTemplate: 'standard-bullets',
      },
      durationSeconds: duration,
      teleprompterNotes: sceneData.teleprompterNotes || '',
    });

    // Update project stats
    const allScenes = await VideoScene.find({ projectId, tenantId });
    const totalDuration = allScenes.reduce((acc, s) => acc + (s.durationSeconds || 5), 0);

    project.scenesCount = allScenes.length;
    project.totalDurationSeconds = totalDuration;
    await project.save();

    return { scene, project };
  }

  /**
   * Update individual scene
   */
  static async updateScene(tenantId, projectId, sceneId, sceneData) {
    const scene = await VideoScene.findOne({ _id: sceneId, projectId, tenantId });
    if (!scene) {
      throw new NotFoundError('Video scene not found');
    }

    const allowed = ['title', 'narrationText', 'visualType', 'visualContent', 'durationSeconds', 'teleprompterNotes', 'transition'];
    allowed.forEach((field) => {
      if (sceneData[field] !== undefined) {
        scene[field] = sceneData[field];
      }
    });

    // Auto-update duration if narration changed and duration was not explicitly overridden
    if (sceneData.narrationText && sceneData.durationSeconds === undefined) {
      scene.durationSeconds = this.estimateDurationSeconds(scene.narrationText);
    }

    await scene.save();

    // Recalculate project total duration
    const allScenes = await VideoScene.find({ projectId, tenantId });
    const totalDuration = allScenes.reduce((acc, s) => acc + (s.durationSeconds || 5), 0);

    await VideoProject.updateOne(
      { _id: projectId, tenantId },
      { totalDurationSeconds: totalDuration, scenesCount: allScenes.length }
    );

    return scene;
  }

  /**
   * Reorder scenes in a project
   */
  static async reorderScenes(tenantId, projectId, sceneIdsOrder) {
    const project = await VideoProject.findOne({ _id: projectId, tenantId });
    if (!project) {
      throw new NotFoundError('Video project not found');
    }

    if (!Array.isArray(sceneIdsOrder) || sceneIdsOrder.length === 0) {
      throw new BadRequestError('sceneIdsOrder must be a non-empty array of scene IDs');
    }

    const updateOps = sceneIdsOrder.map((id, index) =>
      VideoScene.updateOne(
        { _id: id, projectId, tenantId },
        { sceneOrder: index + 1 }
      )
    );

    await Promise.all(updateOps);

    const scenes = await VideoScene.find({ projectId, tenantId }).sort({ sceneOrder: 1 });
    return scenes;
  }

  /**
   * Delete a scene and re-compact orders
   */
  static async deleteScene(tenantId, projectId, sceneId) {
    const scene = await VideoScene.findOne({ _id: sceneId, projectId, tenantId });
    if (!scene) {
      throw new NotFoundError('Video scene not found');
    }

    await VideoScene.deleteOne({ _id: sceneId, projectId, tenantId });

    // Compact remaining scenes orders
    const remainingScenes = await VideoScene.find({ projectId, tenantId }).sort({ sceneOrder: 1 });
    for (let i = 0; i < remainingScenes.length; i++) {
      if (remainingScenes[i].sceneOrder !== i + 1) {
        remainingScenes[i].sceneOrder = i + 1;
        await remainingScenes[i].save();
      }
    }

    const totalDuration = remainingScenes.reduce((acc, s) => acc + (s.durationSeconds || 5), 0);
    await VideoProject.updateOne(
      { _id: projectId, tenantId },
      { scenesCount: remainingScenes.length, totalDurationSeconds: totalDuration }
    );

    return { success: true, deletedSceneId: sceneId, remainingCount: remainingScenes.length };
  }
}

export default VideoScriptService;

