'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Send,
  ShieldCheck,
  FileText,
  Sparkles,
  User,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Quote,
  Trash2,
  AlertTriangle,
  Info,
  Calendar,
  CheckSquare,
  RefreshCw,
} from 'lucide-react';
import { AssistantSource } from '@/lib/ai/schema';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  needsReview?: boolean;
  sources?: AssistantSource[];
  createdAt: string;
}

const SUGGESTED_QUESTIONS = [
  'What are the most important obligations in my contracts?',
  'Which deadlines are coming up soon?',
  'Show me all high and critical compliance conflicts.',
  'Who is responsible for the upcoming deadlines?',
  'Which contract clauses conflict with company policies?',
  'Which contracts have the highest compliance risk?',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<AssistantSource | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch Conversation History on Mount
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setErrorMsg(null);
        const res = await fetch('/api/assistant');
        const data = await res.json();
        if (!isMounted) return;

        if (data.success) {
          if (data.conversationId) {
            setConversationId(data.conversationId);
          }
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            setMessages(data.messages);
            // Set active source from latest assistant message if available
            const latestAssistant = [...data.messages].reverse().find((m) => m.role === 'assistant' && m.sources?.length);
            if (latestAssistant && latestAssistant.sources?.[0]) {
              setActiveSource(latestAssistant.sources[0]);
            }
          } else {
            // Welcome message if no conversation history exists yet
            setMessages([
              {
                id: 'welcome',
                role: 'assistant',
                content:
                  'Hello! I am your **Contract Intelligence Assistant**.\n\nAsk me questions about your contracts, extracted obligations, upcoming deadlines, responsible parties, internal corporate policies, or compliance conflict risks. All my answers are strictly grounded in your database.',
                confidence: 1.0,
                needsReview: false,
                sources: [],
                createdAt: new Date().toISOString(),
              },
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to load conversation history:', err);
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);


  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend || !textToSend.trim() || loading) return;

    const userMsgText = textToSend.trim();
    const tempUserMsgId = `user-${Date.now()}`;

    const userMsg: ChatMessage = {
      id: tempUserMsgId,
      role: 'user',
      content: userMsgText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsgText,
          conversationId: conversationId || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to process assistant query.');
      }

      if (json.conversationId) {
        setConversationId(json.conversationId);
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: json.answer,
        confidence: typeof json.confidence === 'number' ? json.confidence : 0.9,
        needsReview: Boolean(json.needsReview),
        sources: Array.isArray(json.sources) ? json.sources : [],
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (json.sources && json.sources.length > 0) {
        setActiveSource(json.sources[0]);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      const errText = e.message || 'Unable to connect to AI assistant server.';
      setErrorMsg(errText);

      const errAssistantMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error executing query: ${errText}\n\nPlease try again or select one of the suggested questions.`,
        confidence: 0,
        needsReview: true,
        sources: [],
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errAssistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear this conversation history?')) return;

    try {
      setLoading(true);
      await fetch(`/api/assistant${conversationId ? `?conversationId=${conversationId}` : ''}`, {
        method: 'DELETE',
      });

      setConversationId(null);
      setActiveSource(null);
      setMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: 'Conversation history cleared. Ask a new question about your contracts or policies.',
          confidence: 1.0,
          needsReview: false,
          sources: [],
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('Failed to clear conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <PageHeader
        title="Contract Intelligence Assistant"
        description="Ask questions about your contracts, obligations, deadlines and compliance risks."
        badgeText="Stage 7 Grounded AI QA"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            disabled={loading || messages.length <= 1}
            className="gap-2 border-slate-700 text-slate-300 hover:border-rose-500 hover:text-rose-300 hover:bg-rose-950/20"
          >
            <Trash2 className="h-4 w-4 text-slate-400" />
            <span>Clear Conversation</span>
          </Button>
        }
      />

      {/* Legal & Compliance Disclaimer Banner */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-3 text-xs text-indigo-300 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-indigo-400 shrink-0" />
          <span>
            <strong>Grounding Enforced:</strong> Answers are retrieved strictly from your contract, deadline, party & policy database with source citations. This assistant is a contract-compliance analysis tool, not a legal advice system.
          </span>
        </div>
        <Badge variant="outline" className="border-indigo-400/30 text-indigo-300 text-[10px] shrink-0 font-mono">
          RAG Active
        </Badge>
      </div>

      {/* Suggested Question Chips (Requirement 1 & 12) */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          Suggested Questions
        </span>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SUGGESTED_QUESTIONS.map((questionText, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputQuery(questionText);
                handleSendMessage(questionText);
              }}
              disabled={loading}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-left text-xs text-slate-200 hover:border-indigo-500 hover:text-indigo-300 hover:bg-slate-800/80 transition-all flex items-start gap-2 group disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{questionText}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Chat Container & Source Evidence Drawer */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Interactive Chat Panel */}
        <Card className="lg:col-span-2 border-slate-800 bg-slate-900/60 flex flex-col h-[650px] overflow-hidden shadow-xl">
          <CardHeader className="border-b border-slate-800/80 pb-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-sm text-slate-100 font-semibold">
                    Contract Intelligence Chat Session
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-400">
                    Interactive natural language QA grounded in Prisma DB
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {conversationId && (
                  <Badge variant="outline" className="border-slate-800 text-slate-400 font-mono text-[10px]">
                    ID: {conversationId.slice(0, 8)}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Chat Messages Scrollable Box */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {initialLoading ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                <span>Loading assistant session...</span>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-indigo-400" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl p-4 max-w-[85%] text-xs leading-relaxed space-y-3 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-inner'
                    }`}
                  >
                    {/* Header Badges for Assistant Message */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              (msg.confidence ?? 0) >= 0.8
                                ? 'border-emerald-500/30 text-emerald-300 bg-emerald-950/30'
                                : 'border-amber-500/30 text-amber-300 bg-amber-950/30'
                            }`}
                          >
                            Confidence: {Math.round((msg.confidence ?? 0.9) * 100)}%
                          </Badge>

                          {msg.needsReview && (
                            <Badge
                              variant="outline"
                              className="border-rose-500/40 text-rose-300 bg-rose-950/40 text-[10px] flex items-center gap-1 font-semibold"
                            >
                              <AlertTriangle className="h-3 w-3 text-rose-400" />
                              Needs Review
                            </Badge>
                          )}
                        </div>

                        <button
                          onClick={() => handleCopyText(msg.id, msg.content)}
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                          title="Copy answer"
                        >
                          {copiedId === msg.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                    {/* Sources Button List if Assistant Has Evidence Sources */}
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Quote className="h-3 w-3 text-indigo-400" />
                          Sources & Evidence ({msg.sources.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => setActiveSource(src)}
                              className={`rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-colors flex items-center gap-1.5 ${
                                activeSource === src
                                  ? 'border-indigo-400 bg-indigo-950 text-indigo-200'
                                  : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-indigo-500/50 hover:text-indigo-300'
                              }`}
                            >
                              <FileText className="h-3 w-3 text-indigo-400" />
                              <span>
                                {src.contractTitle || src.title} • Pg. {src.pageNumber || 1}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-slate-300" />
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="rounded-2xl rounded-tl-none bg-slate-950 border border-slate-800 p-3.5 text-xs text-slate-400 flex items-center gap-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                  <span>Retrieving database records & constructing grounded AI answer...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Controls Container */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/90 shrink-0 space-y-2">
            {errorMsg && (
              <div className="text-[11px] text-rose-400 bg-rose-950/30 border border-rose-500/30 rounded-lg p-2 flex items-center justify-between">
                <span>{errorMsg}</span>
                <button
                  onClick={() => handleSendMessage()}
                  className="text-indigo-400 hover:underline flex items-center gap-1 text-[10px]"
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </div>
            )}

            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Ask about contracts, obligations, upcoming deadlines, or policy conflicts..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-4 pr-12 py-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />
              <Button
                size="icon"
                onClick={() => handleSendMessage()}
                disabled={!inputQuery.trim() || loading}
                className="absolute right-2 h-8 w-8 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Source Evidence Card Viewer Drawer (Requirement 4) */}
        <Card className="border-slate-800 bg-slate-900/60 flex flex-col h-[650px] shadow-xl overflow-hidden">
          <CardHeader className="border-b border-slate-800/80 pb-3 shrink-0">
            <CardTitle className="text-sm text-slate-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              Source Evidence Viewer
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-400">
              Verbatim database evidence proof supporting AI answers.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 p-4 flex flex-col justify-between overflow-y-auto space-y-4">
            {activeSource ? (
              <div className="space-y-4">
                {/* Source Metadata Header Card */}
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-indigo-500/40 text-indigo-300 text-[10px] font-mono uppercase">
                      Type: {activeSource.type}
                    </Badge>
                    {activeSource.contractId && (
                      <Link href={`/contracts/${activeSource.contractId}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] gap-1 text-indigo-300 hover:bg-indigo-900/40 p-1 px-2"
                        >
                          <span>Open Document</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-100">
                    {activeSource.contractTitle || activeSource.title}
                  </h4>

                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                    {activeSource.clauseNumber && (
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        Clause: {activeSource.clauseNumber}
                      </Badge>
                    )}
                    {activeSource.pageNumber && (
                      <Badge variant="secondary" className="text-[10px]">
                        Page {activeSource.pageNumber}
                      </Badge>
                    )}
                    {activeSource.dueDate && (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-[10px] flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-amber-400" />
                        Due: {activeSource.dueDate}
                      </Badge>
                    )}
                    {activeSource.responsibleParty && (
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 text-[10px] flex items-center gap-1">
                        <CheckSquare className="h-3 w-3 text-emerald-400" />
                        Party: {activeSource.responsibleParty}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Policy Specific Metadata if Present */}
                {activeSource.policyName && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between text-[10px] text-indigo-400 font-semibold uppercase">
                      <span>Internal Policy Reference</span>
                      <span>v{activeSource.policyVersion || '1.0'}</span>
                    </div>
                    <p className="font-semibold text-slate-100">{activeSource.policyName}</p>
                    {activeSource.policyRequirement && (
                      <p className="text-[11px] text-slate-400">{activeSource.policyRequirement}</p>
                    )}
                  </div>
                )}

                {/* Verbatim Evidence Quotation */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                    <Quote className="h-3 w-3 text-indigo-400" />
                    Verbatim Text Evidence:
                  </span>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto shadow-inner">
                    “{activeSource.evidence}”
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-4 space-y-3">
                <ShieldCheck className="h-10 w-10 text-slate-600" />
                <span className="text-xs font-semibold text-slate-400">
                  Source Evidence Viewer Ready
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Click on any question or answer source tag to inspect verbatim evidence snippets, page numbers, clause codes, and contract file links.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
