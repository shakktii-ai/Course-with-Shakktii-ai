'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Bot,
  User,
  Send,
  Sparkles,
  BookOpen,
  HelpCircle,
  Code2,
  BrainCircuit,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  Plus,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Target,
  PanelLeft,
  X,
} from 'lucide-react';

export default function LearnerTutorPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedMode, setSelectedMode] = useState('TUTOR');
  const [courseTopics, setCourseTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hinting, setHinting] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load available courses and recent conversations
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resConv, resCourses] = await Promise.all([
        fetch('/api/v1/tutor/conversations'),
        fetch('/api/v1/courses?limit=20'),
      ]);

      const [dataConv, dataCourses] = await Promise.all([
        resConv.json(),
        resCourses.json(),
      ]);

      if (dataConv.success) {
        setConversations(dataConv.data.items || []);
        if (dataConv.data.items?.length > 0) {
          loadConversation(dataConv.data.items[0]._id);
        }
      }

      if (dataCourses.success) {
        const courseItems = dataCourses.data.items || [];
        setCourses(courseItems);
        if (courseItems.length > 0 && !selectedCourseId) {
          setSelectedCourseId(courseItems[0]._id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dynamically extract real course curriculum topics whenever selectedCourseId changes
  useEffect(() => {
    if (!selectedCourseId) {
      setCourseTopics([]);
      return;
    }

    let isMounted = true;
    async function loadCourseCurriculum() {
      setTopicsLoading(true);
      try {
        const res = await fetch(`/api/v1/courses/${selectedCourseId}?full=true`);
        const data = await res.json();
        if (isMounted && data.success && data.data?.modules) {
          const extracted = [];
          for (const mod of data.data.modules) {
            if (mod.lessons && mod.lessons.length > 0) {
              for (const les of mod.lessons) {
                // Strip redundant Lesson numbering prefixes
                const cleanTitle = (les.title || '')
                  .replace(/^Lesson\s+[\d.]+:\s*/i, '')
                  .trim();
                if (cleanTitle && !extracted.some((t) => t.title === cleanTitle)) {
                  extracted.push({
                    title: cleanTitle,
                    rawTitle: les.title,
                    moduleTitle: mod.title,
                    lessonId: les._id,
                  });
                }
              }
            } else if (mod.title) {
              const cleanMod = mod.title.replace(/^Module\s+[\d.]+:\s*/i, '').trim();
              if (cleanMod && !extracted.some((t) => t.title === cleanMod)) {
                extracted.push({
                  title: cleanMod,
                  rawTitle: mod.title,
                  moduleTitle: mod.title,
                });
              }
            }
          }

          // Fallback if course has no modules yet
          if (extracted.length === 0 && data.data?.course) {
            const courseTitle = data.data.course.title;
            extracted.push(
              { title: `${courseTitle} Fundamentals` },
              { title: `${courseTitle} Core Architecture` },
              { title: `${courseTitle} Implementation & Security` },
              { title: `${courseTitle} Production Best Practices` }
            );
          }

          setCourseTopics(extracted);
        }
      } catch (err) {
        console.error('Failed to load course topics:', err);
      } finally {
        if (isMounted) setTopicsLoading(false);
      }
    }

    loadCourseCurriculum();
    return () => {
      isMounted = false;
    };
  }, [selectedCourseId]);

  // Load specific conversation messages
  const loadConversation = async (conversationId) => {
    try {
      const res = await fetch(`/api/v1/tutor/conversations/${conversationId}`);
      const data = await res.json();
      if (data.success) {
        setActiveConversation(data.data.conversation);
        if (data.data.conversation?.courseId) {
          setSelectedCourseId(
            typeof data.data.conversation.courseId === 'object'
              ? data.data.conversation.courseId._id
              : data.data.conversation.courseId
          );
        }
        if (data.data.conversation?.mode) {
          setSelectedMode(data.data.conversation.mode);
        }
        setMessages(data.data.messages || []);
        setHintLevel(1);
      }
    } catch {
      // silent fallback
    }
  };

  // Switch mode on the fly
  const handleModeSwitch = (newMode) => {
    setSelectedMode(newMode);
    if (activeConversation) {
      setActiveConversation((prev) => ({ ...prev, mode: newMode }));
      setConversations((prev) =>
        prev.map((c) => (c._id === activeConversation._id ? { ...c, mode: newMode } : c))
      );
    }
  };

  // Start new conversation
  const handleStartNewConversation = async (overrideCourseId, overrideMode) => {
    try {
      const courseIdToUse = overrideCourseId !== undefined ? overrideCourseId : selectedCourseId;
      const modeToUse = overrideMode !== undefined ? overrideMode : selectedMode;
      const courseObj = courses.find((c) => c._id === courseIdToUse);
      const title = courseObj
        ? `${courseObj.title} — ${modeToUse}`
        : `Learning Session (${modeToUse})`;

      const res = await fetch('/api/v1/tutor/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: courseIdToUse || undefined,
          mode: modeToUse,
          title,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setConversations((prev) => [data.data.conversation, ...prev]);
        setActiveConversation(data.data.conversation);
        setMessages([data.data.initialMessage]);
        return data.data.conversation;
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
    return null;
  };

  // Send message
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || sending) return;

    let targetConv = activeConversation;
    // Auto-create conversation if none is active
    if (!targetConv) {
      targetConv = await handleStartNewConversation();
      if (!targetConv) return;
    }

    setSending(true);
    setInputText('');

    // Optimistic user message
    const tempUserMsg = {
      _id: `temp-${Date.now()}`,
      sender: 'USER',
      content: query,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(
        `/api/v1/tutor/conversations/${targetConv._id}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: query,
            mode: selectedMode,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev.filter((m) => m._id !== tempUserMsg._id),
          data.data.userMessage,
          data.data.assistantMessage,
        ]);
        setActiveConversation(data.data.conversation);
      }
    } finally {
      setSending(false);
    }
  };

  // Click dynamic topic chip -> auto formulate prompt and immediately send
  const handleSelectTopicAndSend = async (topicTitle) => {
    let prompt = '';
    switch (selectedMode) {
      case 'PRACTICE':
        prompt = `Generate a diagnostic practice challenge on "${topicTitle}" with multiple-choice questions.`;
        break;
      case 'SOCRATIC':
        prompt = `Guide me step-by-step through "${topicTitle}" using Socratic inquiry.`;
        break;
      case 'CODE_HINT':
        prompt = `Show me a production code implementation and pattern for "${topicTitle}".`;
        break;
      case 'TUTOR':
      default:
        prompt = `Explain the core concepts, principles, and practical application of "${topicTitle}".`;
        break;
    }
    await handleSendMessage(prompt);
  };

  // Socratic Hint trigger
  const handleRequestHint = async () => {
    if (!activeConversation || hinting) return;

    setHinting(true);
    try {
      const res = await fetch(
        `/api/v1/tutor/conversations/${activeConversation._id}/hints`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problemStatement: 'Current concept inquiry',
            currentHintLevel: hintLevel,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data.assistantMessage]);
        if (data.data.canAdvance) {
          setHintLevel((l) => l + 1);
        }
      }
    } finally {
      setHinting(false);
    }
  };

  // Feedback rating
  const handleFeedback = async (messageId, rating) => {
    try {
      const res = await fetch('/api/v1/tutor/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation._id,
          messageId,
          rating,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackSuccess((prev) => ({ ...prev, [messageId]: rating }));
      }
    } catch {
      // ignore
    }
  };

  const currentCourse = courses.find((c) => c._id === selectedCourseId);

  return (
    <div className="flex flex-1 h-full w-full bg-slate-50 overflow-hidden min-h-0">
      {/* Sidebar: Conversation Sessions (Collapsible) */}
      <aside
        className={`${
          sidebarOpen ? 'w-72 sm:w-80 min-w-[288px] sm:min-w-[320px]' : 'w-0 min-w-0 pointer-events-none border-none'
        } border-r border-slate-200 bg-white flex flex-col shrink-0 transition-all duration-300 overflow-hidden z-10`}
      >
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <h2 className="font-semibold text-slate-800 text-sm truncate">AI Tutor Sessions</h2>
            </div>
            <Button size="sm" onClick={() => handleStartNewConversation()} className="shrink-0">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Course Focus</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate"
              >
                <option value="">General Academy Learning</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Tutor Mode</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { m: 'TUTOR', label: 'TUTOR', activeBg: 'bg-emerald-600' },
                  { m: 'SOCRATIC', label: 'SOCRATIC', activeBg: 'bg-purple-600' },
                  { m: 'CODE_HINT', label: 'CODE HINT', activeBg: 'bg-amber-600' },
                  { m: 'PRACTICE', label: 'PRACTICE', activeBg: 'bg-blue-600' },
                ].map(({ m, label, activeBg }) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleModeSwitch(m)}
                    className={`text-[11px] px-2 py-1.5 rounded-md text-center font-semibold transition whitespace-nowrap cursor-pointer ${
                      selectedMode === m
                        ? `${activeBg} text-white shadow-xs`
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No previous tutor sessions. Click New to begin.
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeConversation?._id === conv._id;
              return (
                <button
                  key={conv._id}
                  onClick={() => loadConversation(conv._id)}
                  className={`w-full text-left p-3 rounded-lg border transition flex items-center justify-between ${
                    isActive
                      ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 shadow-sm'
                      : 'bg-white border-transparent hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-medium truncate">{conv.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-slate-400">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        {conv.mode}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 h-full overflow-hidden">
        {/* Chat Header */}
        <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition shrink-0"
              title="Toggle Sessions Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            <div
              className={`p-2 rounded-xl shrink-0 ${
                selectedMode === 'SOCRATIC'
                  ? 'bg-purple-100 text-purple-700'
                  : selectedMode === 'CODE_HINT'
                  ? 'bg-amber-100 text-amber-700'
                  : selectedMode === 'PRACTICE'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {selectedMode === 'PRACTICE' ? (
                <Target className="h-5 w-5" />
              ) : selectedMode === 'SOCRATIC' ? (
                <BrainCircuit className="h-5 w-5" />
              ) : selectedMode === 'CODE_HINT' ? (
                <Code2 className="h-5 w-5" />
              ) : (
                <Bot className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm font-bold text-slate-800 truncate">
                  {currentCourse?.title || activeConversation?.title || 'AI Learning Companion'}
                </h1>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    selectedMode === 'SOCRATIC'
                      ? 'border-purple-300 text-purple-700 bg-purple-50'
                      : selectedMode === 'CODE_HINT'
                      ? 'border-amber-300 text-amber-700 bg-amber-50'
                      : selectedMode === 'PRACTICE'
                      ? 'border-blue-300 text-blue-700 bg-blue-50'
                      : 'border-emerald-300 text-emerald-700 bg-emerald-50'
                  }`}
                >
                  {selectedMode === 'CODE_HINT' ? 'CODE HINT' : selectedMode} MODE
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Context-grounded knowledge assistant • Verified Course Content
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Mode Toggle Bar in Header */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              {[
                { m: 'TUTOR', label: 'Tutor', icon: Bot, activeClass: 'bg-white text-emerald-700 shadow-2xs font-semibold' },
                { m: 'SOCRATIC', label: 'Socratic', icon: BrainCircuit, activeClass: 'bg-white text-purple-700 shadow-2xs font-semibold' },
                { m: 'CODE_HINT', label: 'Code Hint', icon: Code2, activeClass: 'bg-white text-amber-700 shadow-2xs font-semibold' },
                { m: 'PRACTICE', label: 'Practice', icon: Target, activeClass: 'bg-white text-blue-700 shadow-2xs font-semibold' },
              ].map(({ m, label, icon: Icon, activeClass }) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleModeSwitch(m)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
                    selectedMode === m
                      ? activeClass
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {activeConversation?.mode === 'CODE_HINT' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestHint}
                disabled={hinting}
                className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50 h-8"
              >
                <Flame className="h-3.5 w-3.5 mr-1 text-amber-500" />
                {hinting ? 'Generating...' : `Level ${hintLevel} Hint`}
              </Button>
            )}

            <div className="text-right text-[11px] text-slate-400 font-mono hidden sm:block">
              Tokens: {activeConversation?.tokenUsage?.totalTokens || 0}
            </div>
          </div>
        </header>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'USER';
            return (
              <div
                key={msg._id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    isUser ? 'bg-slate-800 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div className={`space-y-2 max-w-[88%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                    {/* Citations Chips */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-emerald-600" />
                          Authoritative Grounded Sources
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citations.map((cite, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedCitation(cite)}
                              className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1 cursor-pointer"
                            >
                              <span>{cite.documentName || 'Course Material'}</span>
                              <span className="font-semibold text-emerald-600">p.{cite.pageNumber || 1}</span>
                              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Feedback rating row for assistant replies */}
                  {!isUser && (
                    <div className="flex items-center gap-2 pl-1">
                      <span className="text-[10px] text-slate-400">Was this helpful?</span>
                      <button
                        type="button"
                        onClick={() => handleFeedback(msg._id, 'HELPFUL')}
                        className={`p-1 rounded hover:bg-slate-200 transition ${
                          feedbackSuccess[msg._id] === 'HELPFUL' ? 'text-emerald-600 font-bold' : 'text-slate-400'
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeedback(msg._id, 'UNHELPFUL')}
                        className={`p-1 rounded hover:bg-slate-200 transition ${
                          feedbackSuccess[msg._id] === 'UNHELPFUL' ? 'text-rose-600 font-bold' : 'text-slate-400'
                        }`}
                        title="Unhelpful"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Interactive Topic Shelf */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50/90 border-t border-slate-200 shrink-0">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                {selectedMode === 'PRACTICE' && (
                  <>
                    <Target className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-blue-700">Practice Challenges — Click a topic to test your knowledge:</span>
                  </>
                )}
                {selectedMode === 'SOCRATIC' && (
                  <>
                    <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-purple-700">Socratic Inquiry — Select a topic for step-by-step reasoning:</span>
                  </>
                )}
                {selectedMode === 'CODE_HINT' && (
                  <>
                    <Code2 className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-amber-700">Code Demonstrations — Select a topic to inspect code & architecture:</span>
                  </>
                )}
                {selectedMode === 'TUTOR' && (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Course Syllabus Topics — Click any topic to learn:</span>
                  </>
                )}
              </div>
              {courseTopics.length > 0 && (
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                  {courseTopics.length} dynamic topics
                </span>
              )}
            </div>

            {/* Topics horizontal scroll list */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {topicsLoading ? (
                <span className="text-[11px] text-slate-400 py-1">Loading course topics...</span>
              ) : courseTopics.length > 0 ? (
                courseTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={sending}
                    onClick={() => handleSelectTopicAndSend(topic.title)}
                    className={`whitespace-nowrap px-3 py-1 rounded-full border text-[11px] font-medium transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 ${
                      selectedMode === 'PRACTICE'
                        ? 'bg-blue-50/80 border-blue-200 text-blue-800 hover:bg-blue-100 hover:border-blue-300'
                        : selectedMode === 'SOCRATIC'
                        ? 'bg-purple-50/80 border-purple-200 text-purple-800 hover:bg-purple-100 hover:border-purple-300'
                        : selectedMode === 'CODE_HINT'
                        ? 'bg-amber-50/80 border-amber-200 text-amber-800 hover:bg-amber-100 hover:border-amber-300'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300'
                    }`}
                  >
                    <span>{topic.title}</span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </button>
                ))
              ) : (
                <span className="text-[11px] text-slate-400 py-1">
                  Select a course to load interactive topics
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Message Input Box (Strictly Aligned & Bounded) */}
        <footer className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0 w-full min-w-0">
          <div className="max-w-4xl mx-auto w-full min-w-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 sm:gap-3 w-full min-w-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  selectedMode === 'PRACTICE'
                    ? "Reply with your answers (e.g., 'Q1: [B], Q2: [C]') or ask for a practice problem..."
                    : selectedMode === 'SOCRATIC'
                    ? "Share your reasoning or hypothesis to discover the next step..."
                    : selectedMode === 'CODE_HINT'
                    ? "Ask about syntax, algorithms, data structures, or code architecture..."
                    : "Ask anything about course concepts, code challenges, or architectural patterns..."
                }
                disabled={sending}
                className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 sm:px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
              <Button
                type="submit"
                disabled={sending || !inputText.trim()}
                leftIcon={!sending ? <Send className="w-4 h-4 shrink-0" /> : null}
                className="shrink-0 flex-nowrap whitespace-nowrap h-10 px-3.5 sm:px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
              >
                {sending ? 'Sending...' : (
                  <>
                    <span className="hidden sm:inline">Ask Tutor</span>
                    <span className="sm:hidden">Ask</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </footer>
      </main>

      {/* Citation Preview Drawer */}
      {selectedCitation && (
        <aside className="w-80 border-l border-slate-200 bg-white p-5 flex flex-col shadow-lg z-10 shrink-0">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              Source Verification
            </h3>
            <button
              onClick={() => setSelectedCitation(null)}
              className="text-xs text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3 overflow-y-auto flex-1">
            <div>
              <p className="text-[11px] font-semibold text-slate-700">{selectedCitation.documentName}</p>
              <p className="text-[10px] text-slate-400">
                Page {selectedCitation.pageNumber} • Citation Ref: {selectedCitation.citationRef}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
              &quot;{selectedCitation.sourcePassage}&quot;
            </div>

            <div className="pt-2">
              <Badge variant="outline" className="text-[10px] bg-emerald-50 border-emerald-200 text-emerald-700">
                Confidence: {Math.round((selectedCitation.confidence || 0.95) * 100)}% Match
              </Badge>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
