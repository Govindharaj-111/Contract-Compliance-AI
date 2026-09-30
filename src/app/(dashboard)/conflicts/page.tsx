'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { ConflictEvidenceModal } from '@/components/shared/conflict-evidence-modal';
import { PolicyConflict } from '@/types';
import {
  AlertTriangle,
  Filter,
  Search,
  RefreshCw,
  Eye,
  FileText,
  ShieldAlert,
  AlertOctagon,
  Loader2,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface ConflictStats {
  totalConflicts: number;
  criticalConflicts: number;
  highConflicts: number;
  mediumConflicts: number;
  lowConflicts: number;
  needsReview: number;
}

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<PolicyConflict[]>([]);
  const [stats, setStats] = useState<ConflictStats>({
    totalConflicts: 0,
    criticalConflicts: 0,
    highConflicts: 0,
    mediumConflicts: 0,
    lowConflicts: 0,
    needsReview: 0,
  });
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);

  // Evidence modal state
  const [selectedConflict, setSelectedConflict] = useState<PolicyConflict | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

  const fetchConflicts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (severityFilter !== 'ALL') params.set('severity', severityFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/conflicts?${params.toString()}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setConflicts(json.data);
        if (json.stats) {
          setStats(json.stats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch conflicts:', err);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, statusFilter, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (isMounted) {
        await fetchConflicts();
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [fetchConflicts]);

  const handleRunConflictDetection = async () => {
    try {
      setAnalyzing(true);
      setAnalysisMessage(null);
      const res = await fetch('/api/conflicts/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.success) {
        setAnalysisMessage(json.message || 'Policy conflict detection completed successfully.');
        fetchConflicts();
      } else {
        alert(json.error || 'Conflict detection failed.');
      }
    } catch (err) {
      console.error('Error running conflict analysis:', err);
      alert('Failed to execute conflict detection pipeline.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOpenEvidence = (c: PolicyConflict) => {
    setSelectedConflict(c);
    setIsEvidenceModalOpen(true);
  };

  const handleStatusUpdate = (conflictId: string, newStatus: string) => {
    setConflicts((prev) =>
      prev.map((c) => (c.id === conflictId ? { ...c, status: newStatus as PolicyConflict['status'] } : c))
    );
    fetchConflicts();
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px] gap-1 font-mono">
            <AlertOctagon className="h-3 w-3 text-rose-400" />
            CRITICAL
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40 text-[10px] gap-1 font-mono">
            <ShieldAlert className="h-3 w-3 text-orange-400" />
            HIGH
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-mono">
            MEDIUM
          </Badge>
        );
      case 'LOW':
      default:
        return (
          <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 text-[10px] font-mono">
            LOW
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policy Conflicts & Compliance Risks"
        description="Automated cross-referencing of contract obligations against internal corporate policies with verbatim proof and severity ranking."
        badgeText="Step 5 AI Conflict Engine"
        action={
          <Button
            onClick={handleRunConflictDetection}
            disabled={analyzing}
            className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Running Conflict Detection...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Run Policy Conflict Detection</span>
              </>
            )}
          </Button>
        }
      />

      {analysisMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{analysisMessage}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAnalysisMessage(null)}
            className="h-6 text-[10px] text-emerald-300 hover:bg-emerald-900/40"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Total Conflicts</span>
              <p className="text-2xl font-bold text-slate-100 mt-1">{stats.totalConflicts}</p>
            </div>
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Critical Severities</span>
              <p className="text-2xl font-bold text-rose-400 mt-1">{stats.criticalConflicts}</p>
            </div>
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-400">
              <AlertOctagon className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">High Mismatches</span>
              <p className="text-2xl font-bold text-orange-400 mt-1">{stats.highConflicts}</p>
            </div>
            <div className="rounded-lg bg-orange-500/10 p-2 text-orange-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Needs Review</span>
              <p className="text-2xl font-bold text-purple-400 mt-1">{stats.needsReview}</p>
            </div>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <HelpCircle className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="text"
              placeholder="Search conflicts by policy, contract, or requirement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Filter className="h-3.5 w-3.5" />
              <span>Severity:</span>
            </div>
            <Select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full sm:w-44 text-xs"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-40 text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNRESOLVED">Unresolved</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="WAIVED">Waived</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Policy Conflicts Data Table */}
      <Card className="border-slate-800 bg-slate-900/70 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
              <p className="text-xs text-slate-400">Loading policy conflicts...</p>
            </div>
          ) : conflicts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-800 bg-slate-950/40">
                    <TableHead className="w-[30%]">Conflict Title & Explanation</TableHead>
                    <TableHead className="w-[18%]">Violated Policy</TableHead>
                    <TableHead className="w-[18%]">Contract Source</TableHead>
                    <TableHead className="w-[10%]">Severity</TableHead>
                    <TableHead className="w-[12%]">Status</TableHead>
                    <TableHead className="w-[12%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflicts.map((c) => (
                    <TableRow key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <TableCell className="align-top py-3.5">
                        <div className="space-y-1">
                          <span className="font-semibold text-xs text-slate-100 block">
                            {c.title}
                          </span>
                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                            {c.description}
                          </p>
                          {(c.contractClause || c.pageNumber) && (
                            <div className="text-[10px] font-mono text-indigo-300 pt-0.5">
                              {c.contractClause ? `Clause ${c.contractClause}` : ''}
                              {c.pageNumber ? ` • Page ${c.pageNumber}` : ''}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="align-top py-3.5">
                        <div className="space-y-0.5">
                          <span className="text-xs font-mono font-bold text-indigo-300 block">
                            {c.policy?.code || c.policyName || 'POL-GEN'}
                          </span>
                          <span className="text-[11px] text-slate-300 line-clamp-1">
                            {c.policyName || c.policy?.title || 'Policy Rule'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="align-top py-3.5">
                        <Link
                          href={`/contracts/${c.contractId}`}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 truncate max-w-[180px]"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{c.contractName || c.contract?.title || 'Contract'}</span>
                        </Link>
                      </TableCell>

                      <TableCell className="align-top py-3.5">
                        {getSeverityBadge(c.severity)}
                      </TableCell>

                      <TableCell className="align-top py-3.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            c.status === 'RESOLVED'
                              ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/20'
                              : c.status === 'NEEDS_REVIEW'
                              ? 'border-purple-500/40 text-purple-300 bg-purple-950/20'
                              : c.status === 'WAIVED'
                              ? 'border-slate-600 text-slate-400 bg-slate-900'
                              : 'border-rose-500/30 text-rose-300 bg-rose-950/20'
                          }`}
                        >
                          {c.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="align-top py-3.5 text-right">
                        <Button
                          onClick={() => handleOpenEvidence(c)}
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] gap-1 border-indigo-500/30 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-600 hover:text-white"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View Evidence</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <EmptyState
                icon={AlertTriangle}
                title="No Policy Conflicts Found"
                description="Upload contracts and click 'Run Policy Conflict Detection' to compare contract terms against corporate policies."
                actionText="Run Conflict Detection"
                onAction={handleRunConflictDetection}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <ConflictEvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        conflict={selectedConflict}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}
