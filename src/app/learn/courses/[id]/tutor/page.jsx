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
  ChevronRight,
  Flame,
  ThumbsUp,
  ThumbsDown,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function CourseTutorPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const courseId = params.id;

  const [course, setCourse] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hinting, setHinting] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);
  const [selectedCitation, setSelectedCitation] = useState(null);

  const initCourseTutor = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Resolve course by ID or slug
      const resCourse = await fetch(`/api/v1/courses/${courseId}`);
      const dataCourse = await resCourse.json();
      if (!dataCourse.success) return;

      const currentCourse = dataCourse.data;
      setCourse(currentCourse);

      // 2. Fetch or create a course-scoped conversation
      const resConv = await fetch(`/api/v1/tutor/conversations?courseId=${currentCourse._id}`);
      const dataConv = await resConv.json();

      let targetConv = dataConv.data?.items?.[0];
      if (!targetConv) {
        // Create new
        const createRes = await fetch('/api/v1/tutor/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: currentCourse._id,
            title: `${currentCourse.title} — AI Companion`,
            mode: 'TUTOR',
          }),
        });
        const createData = await createRes.json();
        if (createData.success) {
          targetConv = createData.data.conversation;
          setMessages([createData.data.initialMessage]);
        }
      } else {
        // Load messages for existing conversation
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
  }, [courseId]);

  useEffect(() => {
    initCourseTutor();
  }, [initCourseTutor]);

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
          problemStatement: `Concepts from ${course?.title}`,
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
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Back button and Course Context Header */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/learn/courses/${courseId}`}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course Overview
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50">
            Course Companion
          </Badge>
          <span className="text-xs text-slate-400">Tokens: {conversation?.tokenUsage?.totalTokens || 0}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[75vh] overflow-hidden">
        {/* Tutor Topbar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">{course?.title} AI Tutor</h2>
              <p className="text-xs text-slate-500">
                Authoritatively grounded in syllabus, modules, and uploaded textbooks
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
            {hinting ? 'Hinting...' : `Progressive Hint (${hintLevel}/4)`}
          </Button>
        </div>

        {/* Message Stream */}
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

                <div className={`space-y-1.5 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-xl p-3.5 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {msg.citations.map((cite, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedCitation(cite)}
                            className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition flex items-center gap-1"
                          >
                            <span>{cite.documentName || 'Course Doc'}</span>
                            <span className="font-semibold">p.{cite.pageNumber || 1}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Citation Drawer Modal */}
        {selectedCitation && (
          <div className="px-6 py-3 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-700" />
              <span>
                <strong>{selectedCitation.documentName}</strong> (Page {selectedCitation.pageNumber}): &ldquo;
                {selectedCitation.sourcePassage}&rdquo;
              </span>
            </div>
            <button
              onClick={() => setSelectedCitation(null)}
              className="font-medium text-emerald-700 hover:underline text-xs ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Input Footer */}
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
              placeholder={`Ask any question about ${course?.title || 'the course'}...`}
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

