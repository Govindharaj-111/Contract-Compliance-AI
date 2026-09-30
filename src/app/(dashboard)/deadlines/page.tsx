'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { Deadline, DeadlineStatus, SeverityLevel } from '@/types';
import {
  Clock,
  Filter,
  Search,
  Calendar,
  FileText,
  Bell,
  CheckCircle2,
  Loader2,
  Hourglass,
  Eye,
  AlertOctagon,
  RefreshCw,
  UserCheck,
  CheckSquare,
  HelpCircle,
} from 'lucide-react';

interface DeadlineStats {
  totalDeadlines: number;
  dueToday: number;
  dueThisWeek: number;
  overdue: number;
  completed: number;
  needsReview: number;
  dueSoon: number;
  criticalCount: number;
}

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [stats, setStats] = useState<DeadlineStats>({
    totalDeadlines: 0,
    dueToday: 0,
    dueThisWeek: 0,
    overdue: 0,
    completed: 0,
    needsReview: 0,
    dueSoon: 0,
    criticalCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [extractMessage, setExtractMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [windowFilter, setWindowFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDeadlinesData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (severityFilter !== 'ALL') params.set('severity', severityFilter);
      if (windowFilter !== 'ALL') params.set('timeWindow', windowFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/deadlines?${params.toString()}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setDeadlines(json.data);
        if (json.stats) {
          setStats(json.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load deadlines:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter, windowFilter, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (isMounted) {
        await fetchDeadlinesData();
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [fetchDeadlinesData]);

  const handleRunDeadlineExtraction = async () => {
    try {
      setExtracting(true);
      setExtractMessage(null);
      const res = await fetch('/api/deadlines/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.success) {
        setExtractMessage(json.message || 'AI deadline extraction complete.');
        fetchDeadlinesData();
      } else {
        alert(json.error || 'Failed to extract deadlines.');
      }
    } catch (err) {
      console.error('Error running deadline extraction:', err);
      alert('Error triggering deadline extraction.');
    } finally {
      setExtracting(false);
    }
  };

  const handleMarkCompleted = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/deadlines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      const json = await res.json();
      if (json.success) {
        fetchDeadlinesData();
      }
    } catch (err) {
      console.error('Failed to mark deadline completed:', err);
    }
  };

  const getStatusBadge = (st: DeadlineStatus) => {
    switch (st) {
      case 'OVERDUE':
        return (
          <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px] gap-1 font-mono">
            <AlertOctagon className="h-3 w-3 text-rose-400" />
            OVERDUE
          </Badge>
        );
      case 'DUE_SOON':
        return (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] gap-1 font-mono">
            <Hourglass className="h-3 w-3 text-amber-400" />
            DUE SOON
          </Badge>
        );
      case 'UPCOMING':
        return (
          <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 text-[10px] font-mono">
            UPCOMING
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] gap-1 font-mono">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            COMPLETED
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="secondary" className="text-[10px] font-mono">
            EXPIRED
          </Badge>
        );
      case 'NEEDS_REVIEW':
      default:
        return (
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px] gap-1 font-mono">
            <HelpCircle className="h-3 w-3 text-purple-400" />
            NEEDS REVIEW
          </Badge>
        );
    }
  };

  const getSeverityBadge = (sev: SeverityLevel) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px]">
            CRITICAL
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40 text-[10px]">
            HIGH
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
            MEDIUM
          </Badge>
        );
      case 'LOW':
      default:
        return (
          <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 text-[10px]">
            LOW
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deadline Intelligence & Compliance Alerts"
        description="Automatically track, rank, and alert on contract notice windows, SLA milestones, renewals, and expiration dates."
        badgeText="Stage 6 Alert Engine"
        action={
          <Button
            onClick={handleRunDeadlineExtraction}
            disabled={extracting}
            className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 text-xs"
          >
            {extracting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Extracting Deadlines...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Run AI Deadline Extraction</span>
              </>
            )}
          </Button>
        }
      />

      {extractMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{extractMessage}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExtractMessage(null)}
            className="h-6 text-[10px] text-emerald-300 hover:bg-emerald-900/40"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Summary Cards Grid (6 Required Stat Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-slate-800 bg-slate-900/60 p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Deadlines
              </span>
              <p className="text-xl font-bold text-slate-100 mt-0.5">{stats.totalDeadlines}</p>
            </div>
            <Clock className="h-5 w-5 text-indigo-400" />
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Due Today
              </span>
              <p className="text-xl font-bold text-amber-400 mt-0.5">{stats.dueToday}</p>
            </div>
            <Calendar className="h-5 w-5 text-amber-400" />
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Due This Week
              </span>
              <p className="text-xl font-bold text-sky-400 mt-0.5">{stats.dueThisWeek}</p>
            </div>
            <Hourglass className="h-5 w-5 text-sky-400" />
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Overdue
              </span>
              <p className="text-xl font-bold text-rose-400 mt-0.5">{stats.overdue}</p>
            </div>
            <AlertOctagon className="h-5 w-5 text-rose-400" />
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Completed
              </span>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">{stats.completed}</p>
            </div>
            <CheckSquare className="h-5 w-5 text-emerald-400" />
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Needs Review
              </span>
              <p className="text-xl font-bold text-purple-400 mt-0.5">{stats.needsReview}</p>
            </div>
            <HelpCircle className="h-5 w-5 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Compliance In-App Alerts Banner Box */}
      {(stats.overdue > 0 || stats.dueSoon > 0 || stats.criticalCount > 0) && (
        <Card className="border-amber-500/30 bg-amber-950/20 p-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider flex items-center gap-2">
                <span>Active Compliance Alerts</span>
                <Badge variant="outline" className="border-amber-400/40 text-amber-300 text-[10px]">
                  {stats.overdue + stats.dueSoon + stats.criticalCount} Active Alerts
                </Badge>
              </h4>
              <p className="text-xs text-amber-300/90 leading-relaxed">
                {stats.overdue > 0 && `• ${stats.overdue} deadline(s) are OVERDUE and require immediate action. `}
                {stats.dueSoon > 0 && `• ${stats.dueSoon} deadline(s) are DUE WITHIN 7 DAYS. `}
                {stats.criticalCount > 0 && `• ${stats.criticalCount} CRITICAL obligation notice window(s) are active.`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filter Toolbar */}
      <Card className="border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="text"
              placeholder="Search by deadline title, contract, or party..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="h-3.5 w-3.5" />
              <span>Status:</span>
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-36 text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="DUE_SOON">Due Soon</option>
              <option value="OVERDUE">Overdue</option>
              <option value="COMPLETED">Completed</option>
              <option value="EXPIRED">Expired</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
            </Select>

            <Select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full sm:w-36 text-xs"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </Select>

            <Select
              value={windowFilter}
              onChange={(e) => setWindowFilter(e.target.value)}
              className="w-full sm:w-40 text-xs"
            >
              <option value="ALL">All Windows</option>
              <option value="7_DAYS">Next 7 Days</option>
              <option value="30_DAYS">Next 30 Days</option>
              <option value="90_DAYS">Next 90 Days</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Deadlines Data Table */}
      <Card className="border-slate-800 bg-slate-900/70 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
              <p className="text-xs text-slate-400">Evaluating contract deadlines...</p>
            </div>
          ) : deadlines.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-800 bg-slate-950/40">
                    <TableHead className="w-[24%]">Deadline Title & Description</TableHead>
                    <TableHead className="w-[16%]">Contract</TableHead>
                    <TableHead className="w-[14%]">Responsible Party</TableHead>
                    <TableHead className="w-[14%]">Due Date & Notice</TableHead>
                    <TableHead className="w-[10%]">Status</TableHead>
                    <TableHead className="w-[8%]">Severity</TableHead>
                    <TableHead className="w-[6%]">Confidence</TableHead>
                    <TableHead className="w-[8%]">Source</TableHead>
                    <TableHead className="w-[10%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deadlines.map((item) => {
                    const confidencePercent = item.confidence
                      ? Math.round(item.confidence * 100)
                      : 85;

                    return (
                      <TableRow key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        {/* Title & Description */}
                        <TableCell className="align-top py-3.5">
                          <div className="space-y-1">
                            <Link
                              href={`/deadlines/${item.id}`}
                              className="font-semibold text-xs text-slate-100 hover:text-indigo-400 transition-colors block"
                            >
                              {item.title}
                            </Link>
                            {item.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Contract */}
                        <TableCell className="align-top py-3.5">
                          <Link
                            href={`/contracts/${item.contractId}`}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 truncate max-w-[160px]"
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{item.contract?.title || 'Contract'}</span>
                          </Link>
                        </TableCell>

                        {/* Responsible Party */}
                        <TableCell className="align-top py-3.5">
                          {item.responsibleParty && item.responsibleParty !== 'NEEDS_REVIEW' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-200">
                              <UserCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              {item.responsibleParty}
                            </span>
                          ) : (
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px]">
                              NEEDS REVIEW
                            </Badge>
                          )}
                        </TableCell>

                        {/* Due Date & Notice */}
                        <TableCell className="align-top py-3.5">
                          {item.dueDate ? (
                            <div className="space-y-0.5">
                              <span className="text-xs font-mono font-bold text-slate-200 block">
                                {new Date(item.dueDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              {item.noticePeriodText && (
                                <span className="text-[10px] text-sky-400 block font-mono">
                                  {item.noticePeriodText}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-purple-400 italic">Unspecified (Relative)</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="align-top py-3.5">
                          {getStatusBadge(item.status)}
                        </TableCell>

                        {/* Severity */}
                        <TableCell className="align-top py-3.5">
                          {getSeverityBadge(item.severity)}
                        </TableCell>

                        {/* Confidence */}
                        <TableCell className="align-top py-3.5">
                          <span className="text-xs font-mono text-slate-300 font-medium">
                            {confidencePercent}%
                          </span>
                        </TableCell>

                        {/* Source Clause & Page */}
                        <TableCell className="align-top py-3.5">
                          <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                            {item.clauseNumber && <div>{item.clauseNumber}</div>}
                            {item.pageNumber && <div className="text-slate-500">Pg. {item.pageNumber}</div>}
                            {!item.clauseNumber && !item.pageNumber && <span>-</span>}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="align-top py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/deadlines/${item.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] px-2 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                              >
                                <Eye className="h-3 w-3 mr-1 text-indigo-400" />
                                Details
                              </Button>
                            </Link>

                            {item.status !== 'COMPLETED' && (
                              <Button
                                onClick={(e) => handleMarkCompleted(item.id, e)}
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[11px] px-2 text-emerald-400 hover:bg-emerald-950 hover:text-emerald-300"
                                title="Mark Completed"
                              >
                                <CheckSquare className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <EmptyState
                icon={Clock}
                title="No Contract Deadlines Found"
                description="Upload a contract and run AI Deadline Extraction to automatically track notice windows and compliance dates."
                actionText="Run AI Deadline Extraction"
                onAction={handleRunDeadlineExtraction}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
