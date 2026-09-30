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
} from 'lucide-react';
import { AICitation } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citation?: AICitation | null;
  timestamp: Date;
}

const samplePrompts = [
  'What are the mandatory SLA notice periods across all active contracts?',
  'Are there any data processor security conflicts with POL-SEC-001?',
  'Which supplier contracts require 60-day advance termination notice?',
  'Summarize data handling duties for vendor agreements.',
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am your AI Contract & Compliance Assistant. Ask me any question about contractual obligations, SLA guarantees, notice windows, or policy conflicts across your uploaded contracts.',
      timestamp: new Date(),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<AICitation | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend || !textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });

      const json = await res.json();

      if (json.success && json.answer) {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: json.answer,
          citation: json.citation || null,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        if (json.citation) {
          setActiveCitation(json.citation);
        }
      } else {
        throw new Error(json.error || 'Failed to get answer from AI assistant.');
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${e.message || 'Unable to connect to AI assistant engine.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
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
      <PageHeader
        title="AI Contract Assistant"
        description="Query contracts for specific obligations, SLA details, notice periods, and policy compliance with exact clause & page citations."
        badgeText="Evidence-Backed QA"
      />

      {/* Suggested Prompt Chips */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          Suggested Compliance Queries
        </span>
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputQuery(prompt);
                handleSendMessage(prompt);
              }}
              className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 hover:border-indigo-500 hover:text-indigo-300 transition-colors text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Interface Container */}
        <Card className="lg:col-span-2 border-slate-800 bg-slate-900/60 flex flex-col h-[600px] overflow-hidden">
          <CardHeader className="border-b border-slate-800/80 pb-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-400" />
                <CardTitle className="text-base text-slate-100">Contract Copilot Session</CardTitle>
              </div>
              <Badge variant="outline" className="border-indigo-500/30 bg-indigo-950/40 text-indigo-300 text-[10px]">
                Evidence Citation Stream Active
              </Badge>
            </div>
          </CardHeader>

          {/* Chat Messages Scrollable Area */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
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
                  className={`rounded-2xl p-4 max-w-[85%] text-xs leading-relaxed space-y-2.5 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-inner'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Citation Button if present */}
                  {msg.citation && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setActiveCitation(msg.citation || null)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-950/50 border border-indigo-500/30 rounded-lg px-2.5 py-1"
                      >
                        <Quote className="h-3 w-3 text-indigo-400" />
                        <span>
                          Citation: {msg.citation.documentTitle} • Pg. {msg.citation.pageNumber} ({msg.citation.clauseNumber})
                        </span>
                      </button>

                      <button
                        onClick={() => handleCopyText(msg.id, msg.content)}
                        className="text-slate-500 hover:text-slate-300"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-4 w-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="rounded-2xl rounded-tl-none bg-slate-950 border border-slate-800 p-3 text-xs text-slate-400 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  <span>Scanning contract clauses and policy database...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Box Shell */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 shrink-0">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Ask about contract obligations, SLA penalties, or notice windows..."
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

        {/* Citation & Source Evidence Viewer Drawer */}
        <Card className="border-slate-800 bg-slate-900/60 flex flex-col h-[600px]">
          <CardHeader className="border-b border-slate-800/80 pb-3">
            <CardTitle className="text-base text-slate-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              Source Evidence Viewer
            </CardTitle>
            <CardDescription className="text-xs">
              Direct document, clause, page, and snippet proof for AI responses.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 p-4 flex flex-col justify-between overflow-y-auto">
            {activeCitation ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                      Target Document
                    </span>
                    {activeCitation.documentId && (
                      <Link href={`/contracts/${activeCitation.documentId}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] gap-1 text-indigo-300 hover:bg-indigo-900/40 p-1 px-2"
                        >
                          <span>Open PDF</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-100">
                    {activeCitation.documentTitle}
                  </h4>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                    <Badge variant="outline" className="border-indigo-500/40 text-indigo-300 text-[10px]">
                      {activeCitation.clauseNumber || 'Section 1'}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      Page {activeCitation.pageNumber || 1}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                    <Quote className="h-3 w-3 text-indigo-400" />
                    Verbatim Evidence Proof:
                  </span>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                    “{activeCitation.evidenceText}”
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-4 space-y-3">
                <ShieldCheck className="h-10 w-10 text-slate-600" />
                <span className="text-xs font-medium text-slate-400">
                  Source Evidence Viewer Idle
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Ask a question in the chat panel to see verbatim evidence quotes, page numbers, clause codes, and direct links to source contract documents.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
