import React from 'react';
import Link from 'next/link';
import {
  FileSearch,
  FileText,
  Clock,
  AlertTriangle,
  Bot,
  BarChart3,
  ArrowRight,
  Sparkles,
  CheckSquare,
  Award,
  ChevronRight,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Glowing Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-96 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-3xl pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <FileSearch className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block leading-tight">
                Compliance AI
              </span>
              <span className="text-[10px] font-mono text-indigo-400 tracking-wider uppercase">
                SYSTEM AI-03
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-indigo-400 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-indigo-400 transition-colors">
              How It Works
            </a>
            <Link href="/assistant" className="hover:text-indigo-400 transition-colors flex items-center gap-1">
              <Bot className="h-3.5 w-3.5 text-indigo-400" />
              <span>AI Copilot</span>
            </Link>
            <Link href="/analytics" className="hover:text-indigo-400 transition-colors flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Risk Scoring</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/assistant"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-300 border border-slate-800 hover:bg-slate-900 transition-all"
            >
              <Bot className="h-3.5 w-3.5 text-indigo-400" />
              <span>Open Assistant</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-105"
            >
              <span>Launch App</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-7xl mx-auto text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 text-xs font-mono mb-8 shadow-inner">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span>Next-Gen Autonomous Contract Intelligence Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Autonomous Contract & <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
            Compliance Intelligence AI
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Extract obligations, detect policy conflict violations, monitor critical notice deadlines, and query your contract database with RAG-grounded evidence tracing.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
          >
            <span>Explore Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/assistant"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900 text-slate-200 transition-all"
          >
            <Bot className="h-4 w-4 text-indigo-400" />
            <span>Try AI Assistant</span>
          </Link>
        </div>

        {/* Floating Metrics Bar */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-md">
            <div className="text-2xl font-bold text-indigo-400 font-mono">100%</div>
            <div className="text-xs text-slate-400 mt-0.5">Grounded RAG Citations</div>
          </div>
          <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-md">
            <div className="text-2xl font-bold text-amber-400 font-mono">30–60 Day</div>
            <div className="text-xs text-slate-400 mt-0.5">Automated Notice Alerts</div>
          </div>
          <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-md">
            <div className="text-2xl font-bold text-emerald-400 font-mono">0–100</div>
            <div className="text-xs text-slate-400 mt-0.5">Algorithmic Risk Score</div>
          </div>
          <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-md">
            <div className="text-2xl font-bold text-purple-400 font-mono">PDF & DOCX</div>
            <div className="text-xs text-slate-400 mt-0.5">Multi-Page Text Ingestion</div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest font-mono">
            Full-Stack Intelligence Architecture
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-2">
            Everything you need to audit, monitor & query contracts
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-indigo-500/40 transition-all group">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Document Text Ingestion Engine</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Parse PDF and DOCX files into page-chunked structured storage while preserving exact section headers and original layout text.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-emerald-500/40 transition-all group">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CheckSquare className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">AI Obligation & Duty Extractor</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Automatically extract contractual obligations, SLAs, data privacy rules, and responsible parties validated against Zod schemas.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-rose-500/40 transition-all group">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Automated Policy Conflict Engine</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Cross-reference supplier contract terms against corporate security, SLA, and data retention standards with side-by-side evidence modals.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-amber-500/40 transition-all group">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Deadline & Notice Windows</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Track auto-renewal dates, 30/60-day notice windows, audit milestones, and handle ambiguous terms with NEEDS_REVIEW review tags.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-indigo-500/40 transition-all group">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">RAG Contract AI Assistant</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Interactive multi-turn copilot answering natural-language queries grounded strictly in database context with verbatim citations.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-emerald-500/40 transition-all group">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Vendor Matrix & Risk Scoring</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Algorithmic risk score (0-100) and vendor compliance grades (A+ to F) evaluating supplier breach risk across active portfolios.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest font-mono">
            4-Step Autonomous Workflow
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-2">
            How Contract & Compliance Intelligence Works
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3 relative p-6 rounded-xl border border-slate-800 bg-slate-900/30">
            <div className="text-3xl font-extrabold text-indigo-500/30 font-mono">01</div>
            <h4 className="text-sm font-bold text-slate-100">Upload Contract</h4>
            <p className="text-xs text-slate-400">
              Select any supplier agreement PDF or DOCX file to initiate automated page extraction.
            </p>
          </div>

          <div className="space-y-3 relative p-6 rounded-xl border border-slate-800 bg-slate-900/30">
            <div className="text-3xl font-extrabold text-indigo-500/30 font-mono">02</div>
            <h4 className="text-sm font-bold text-slate-100">AI Clause Analysis</h4>
            <p className="text-xs text-slate-400">
              Extract obligations, SLAs, notice deadlines, and responsible parties into database tables.
            </p>
          </div>

          <div className="space-y-3 relative p-6 rounded-xl border border-slate-800 bg-slate-900/30">
            <div className="text-3xl font-extrabold text-indigo-500/30 font-mono">03</div>
            <h4 className="text-sm font-bold text-slate-100">Policy Cross-Check</h4>
            <p className="text-xs text-slate-400">
              Compare contract requirements against corporate security, privacy, and SLA policies.
            </p>
          </div>

          <div className="space-y-3 relative p-6 rounded-xl border border-slate-800 bg-slate-900/30">
            <div className="text-3xl font-extrabold text-indigo-500/30 font-mono">04</div>
            <h4 className="text-sm font-bold text-slate-100">Alerts & AI Copilot</h4>
            <p className="text-xs text-slate-400">
              Query contract terms via RAG copilot and monitor vendor compliance ratings in real time.
            </p>
          </div>
        </div>
      </section>

      {/* Live Callout Section */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/60 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Ready to Audit & Intelligence-Enable Your Contracts?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Experience production-grade contract ingestion, deadline alert tracking, and grounded AI assistant chat.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <span>Launch SaaS Console</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <FileSearch className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-300">
              Contract & Compliance Intelligence AI
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-slate-300">
              Dashboard
            </Link>
            <Link href="/contracts" className="hover:text-slate-300">
              Contracts
            </Link>
            <Link href="/deadlines" className="hover:text-slate-300">
              Deadlines
            </Link>
            <Link href="/conflicts" className="hover:text-slate-300">
              Conflicts
            </Link>
            <Link href="/assistant" className="hover:text-slate-300">
              AI Copilot
            </Link>
            <Link href="/analytics" className="hover:text-slate-300">
              Risk Matrix
            </Link>
          </div>

          <div>© 2026 Contract & Compliance AI. System Stage 8 Operational.</div>
        </div>
      </footer>
    </div>
  );
}
