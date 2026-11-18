'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Bot,
  User,
  Send,
  BookOpen,
  ArrowLeft,
  Flame,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export default function LessonTutorPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { id: courseId, lessonId } = params;

  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hinting, setHinting] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);

  const initLessonTutor = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Course & Lesson
      const [resCourse, resLesson] = await Promise.all([
        fetch(`/api/v1/courses/${courseId}`),
        fetch(`/api/v1/lessons/${lessonId}`),
      ]);

      const [dataCourse, dataLesson] = await Promise.all([
        resCourse.json(),
        resLesson.json(),
      ]);

      if (dataCourse.success) setCourse(dataCourse.data);
      if (dataLesson.success) setLesson(dataLesson.data);

      const targetCourseId = dataCourse.data?._id;

      // 2. Fetch or create lesson-scoped conversation
      const resConv = await fetch(
        `/api/v1/tutor/conversations?lessonId=${lessonId}`
      );
      const dataConv = await resConv.json();

      let targetConv = dataConv.data?.items?.[0];
      if (!targetConv) {
        const createRes = await fetch('/api/v1/tutor/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: targetCourseId,
            lessonId,
            title: `${dataLesson.data?.title || 'Lesson'} — AI Tutor`,
            mode: 'SOCRATIC',
          }),
        });
        const createData = await createRes.json();
        if (createData.success) {
          targetConv = createData.data.conversation;
          setMessages([createData.data.initialMessage]);
        }
      } else {
        const msgRes = await fetch(`/api/v1/tutor/conversations/${targetConv._id}`);
        const msgData = await msgRes.json();
        if (msgData.success) {
          setMessages(msgData.data.messages || []);
        }
      }

      setConversation(targetConv);
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    initLessonTutor();
  }, [initLessonTutor]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || sending || !conversation) return;

    setSending(true);
    setInputText('');

    const tempUserMsg = {
      _id: `temp-${Date.now()}`,
      sender: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/v1/tutor/conversations/${conversation._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev.filter((m) => m._id !== tempUserMsg._id),
          data.data.userMessage,
          data.data.assistantMessage,
        ]);
        setConversation(data.data.conversation);
      }
    } finally {
      setSending(false);
    }
  };

  const handleRequestHint = async () => {
    if (!conversation || hinting) return;
    setHinting(true);
    try {
      const res = await fetch(`/api/v1/tutor/conversations/${conversation._id}/hints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemStatement: `Lesson focus: ${lesson?.title}`,
          currentHintLevel: hintLevel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data.assistantMessage]);
        if (data.data.canAdvance) setHintLevel((l) => l + 1);
      }
    } finally {
      setHinting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/learn/courses/${courseId}`}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course Curriculum
        </Link>
        <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50">
          Lesson Companion • Socratic Mode
        </Badge>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[75vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">{lesson?.title}</h2>
              <p className="text-xs text-slate-500">
                Interactive Socratic guidance grounded in lesson notes and checkpoints
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRequestHint}
            disabled={hinting}
            className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <Flame className="h-3.5 w-3.5 mr-1 text-amber-500" />
            {hinting ? 'Generating...' : `Hint Tier (${hintLevel}/4)`}
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.sender === 'USER';
            return (
              <div
                key={msg._id}
                className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isUser ? 'bg-slate-800 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div className={`space-y-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-xl p-3.5 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 w-full min-w-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 w-full min-w-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask a question or request clarification on ${lesson?.title || 'this lesson'}...`}
              disabled={sending}
              className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 sm:px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <Button
              type="submit"
              disabled={sending || !inputText.trim()}
              size="sm"
              leftIcon={<Send className="h-4 w-4 shrink-0" />}
              className="shrink-0 flex-nowrap whitespace-nowrap px-3.5 sm:px-4"
            >
              Ask
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

