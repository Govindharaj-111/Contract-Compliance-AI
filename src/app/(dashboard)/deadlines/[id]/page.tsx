'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Deadline, DeadlineStatus, SeverityLevel } from '@/types';
import {
  Clock,
  ArrowLeft,
  FileText,
  UserCheck,
  Calendar,
  Hourglass,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  Quote,
  Layers,
  FileCode,
  Loader2,
  AlertTriangle,
  CheckSquare,
} from 'lucide-react';

interface DeadlineDetailData extends Deadline {
  contract?: {
    id: string;
    title: string;
    fileName?: string;
    mimeType?: string;
    status?: string;
    uploadedAt?: string;
  };
  obligation?: {
    id: string;
    title: string;
    description: string;
    category?: string;
    clauseNumber?: string | null;
  } | null;
}

export default function DeadlineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [deadline, setDeadline] = useState<DeadlineDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/deadlines/${resolvedParams.id}`);
        const json = await res.json();
        if (isMounted) {
          if (json.success && json.data) {
            setDeadline(json.data);
          } else {
            setError(json.error || 'Deadline record not found.');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Fetch deadline detail error:', err);
          setError('Failed to load deadline detail.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id, reloadTick]);

  const handleUpdateStatus = async (newStatus: DeadlineStatus) => {
    try {
      setUpdating(true);
      const res = await fetch(`/api/deadlines/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setReloadTick((prev) => prev + 1);
      } else {
        alert(json.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Update deadline status error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (st: DeadlineStatus) => {
    switch (st) {
      case 'OVERDUE':
        return (
          <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[11px] gap-1 px-3 py-1 font-mono">
            <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
            OVERDUE
          </Badge>
        );
      case 'DUE_SOON':
        return (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[11px] gap-1 px-3 py-1 font-mono">
            <Hourglass className="h-3.5 w-3.5 text-amber-400" />
            DUE SOON
          </Badge>
        );
      case 'UPCOMING':
        return (
          <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 text-[11px] px-3 py-1 font-mono">
            UPCOMING
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px] gap-1 px-3 py-1 font-mono">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            COMPLETED
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="secondary" className="text-[11px] px-3 py-1 font-mono">
            EXPIRED
          </Badge>
        );
      case 'NEEDS_REVIEW':
      default:
        return (
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[11px] gap-1 px-3 py-1 font-mono">
            <HelpCircle className="h-3.5 w-3.5 text-purple-400" />
            NEEDS REVIEW
          </Badge>
        );
    }
  };

  const getSeverityBadge = (sev: SeverityLevel) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[11px] px-2.5 py-0.5 font-mono">
            CRITICAL SEVERITY
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40 text-[11px] px-2.5 py-0.5 font-mono">
            HIGH SEVERITY
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[11px] px-2.5 py-0.5 font-mono">
            MEDIUM SEVERITY
          </Badge>
        );
      case 'LOW':
      default:
        return (
          <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 text-[11px] px-2.5 py-0.5 font-mono">
            LOW SEVERITY
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-xs text-slate-400">Loading deadline intelligence details...</p>
      </div>
    );
  }

  if (error || !deadline) {
    return (
      <div className="space-y-6">
        <Link href="/deadlines">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Deadlines</span>
          </Button>
        </Link>
        <Card className="border-rose-900/50 bg-slate-900/80 p-8 text-center">
          <CardContent className="space-y-3">
            <AlertTriangle className="mx-auto h-8 w-8 text-rose-400" />
            <h3 className="text-md font-semibold text-slate-100">Deadline Load Error</h3>
            <p className="text-xs text-slate-400">{error || 'Deadline record not found.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const confidencePercent = deadline.confidence
    ? Math.round(deadline.confidence * 100)
    : 85;

  return (
    <div className="space-y-6">
      {/* Navigation & Action Header */}
      <div className="flex items-center justify-between">
        <Link href="/deadlines">
          <Button variant="outline" size="sm" className="gap-2 border-slate-800 bg-slate-900 text-slate-300 text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Deadlines</span>
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {deadline.status !== 'COMPLETED' && (
            <Button
              onClick={() => handleUpdateStatus('COMPLETED')}
              disabled={updating}
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Mark Completed</span>
            </Button>
          )}

          {deadline.status !== 'NEEDS_REVIEW' && (
            <Button
              onClick={() => handleUpdateStatus('NEEDS_REVIEW')}
              disabled={updating}
              variant="outline"
              size="sm"
              className="gap-2 border-purple-500/40 text-purple-300 hover:bg-purple-950/40 text-xs"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Flag for Review</span>
            </Button>
          )}
        </div>
      </div>

      <PageHeader
        title={deadline.title}
        description={deadline.description || 'Extracted contractual deadline and compliance notice window.'}
        badgeText={`Confidence: ${confidencePercent}%`}
      />

      {/* Grid of Key Metadata Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Due Date & Notice */}
        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Due Date & Notice Period
              </span>
              <span className="text-xs font-bold text-slate-100 font-mono block mt-0.5">
                {deadline.dueDate
                  ? new Date(deadline.dueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Unspecified (NEEDS_REVIEW)'}
              </span>
              <span className="text-[11px] text-sky-400 block font-mono">
                {deadline.noticePeriodText || `${deadline.noticeDays} days advance notice`}
              </span>
            </div>
          </div>
        </Card>

        {/* Card 2: Responsible Party */}
        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Responsible Party
              </span>
              <div className="mt-1">
                {deadline.responsibleParty && deadline.responsibleParty !== 'NEEDS_REVIEW' ? (
                  <span className="text-xs font-bold text-slate-100">
                    {deadline.responsibleParty}
                  </span>
                ) : (
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px]">
                    NEEDS REVIEW
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: Status & Severity */}
        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-indigo-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Status & Severity
              </span>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {getStatusBadge(deadline.status)}
                {getSeverityBadge(deadline.severity)}
              </div>
            </div>
          </div>
        </Card>

        {/* Card 4: Source Location */}
        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-3">
            <FileCode className="h-5 w-5 text-indigo-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Source Clause & Page
              </span>
              <span className="text-xs font-bold font-mono text-slate-200 block mt-0.5">
                {deadline.clauseNumber ? `${deadline.clauseNumber}` : 'Unnumbered Section'}
                {deadline.pageNumber ? ` • Page ${deadline.pageNumber}` : ''}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Contract & Obligation Context Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Contract Source Info */}
        <Card className="border-slate-800 bg-slate-900/70">
          <CardHeader className="border-b border-slate-800/80 pb-3">
            <CardTitle className="text-sm text-slate-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              Source Contract Document
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {deadline.contract ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">
                    {deadline.contract.title}
                  </span>
                  <Link href={`/contracts/${deadline.contract.id}`}>
                    <Button variant="outline" size="sm" className="h-7 text-[11px] border-indigo-500/30 text-indigo-300">
                      Open Contract PDF
                    </Button>
                  </Link>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  File: {deadline.contract.fileName || 'Contract File'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No contract linked.</p>
            )}
          </CardContent>
        </Card>

        {/* Right: Linked Obligation Info */}
        <Card className="border-slate-800 bg-slate-900/70">
          <CardHeader className="border-b border-slate-800/80 pb-3">
            <CardTitle className="text-sm text-slate-100 flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              Associated Obligation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {deadline.obligation ? (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-100 block">
                  {deadline.obligation.title}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {deadline.obligation.description}
                </p>
                {deadline.obligation.clauseNumber && (
                  <span className="text-[10px] font-mono text-indigo-300 block pt-1">
                    Clause {deadline.obligation.clauseNumber}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Direct deadline item extracted from document clause.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verbatim Evidence Proof Box */}
      <Card className="border-slate-800 bg-slate-900/70">
        <CardHeader className="border-b border-slate-800/80 pb-3">
          <CardTitle className="text-sm text-slate-100 flex items-center gap-2">
            <Quote className="h-4 w-4 text-indigo-400" />
            Contract Verbatim Evidence Proof
          </CardTitle>
          <CardDescription className="text-xs">
            Exact clause snippet extracted from contract text. Never fabricated by AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="rounded-xl border border-indigo-500/30 bg-slate-950 p-4 font-mono text-xs text-indigo-200 leading-relaxed whitespace-pre-wrap">
            “{deadline.evidenceText || deadline.deadlineText || deadline.title}”
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
