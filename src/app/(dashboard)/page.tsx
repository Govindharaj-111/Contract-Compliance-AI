'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  CheckSquare,
  Clock,
  AlertTriangle,
  Upload,
  ArrowRight,
  Calendar,
  Loader2,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Eye,
  Bot,
  Sparkles,
} from 'lucide-react';
import { Contract, Deadline } from '@/types';

interface DashboardStats {
  totalContracts: number;
  activeObligations: number;
  upcomingDeadlines: number;
  complianceConflicts: number;
  dueSoon: number;
  overdue: number;
  criticalDeadlines: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    activeObligations: 0,
    upcomingDeadlines: 0,
    complianceConflicts: 0,
    dueSoon: 0,
    overdue: 0,
    criticalDeadlines: 0,
  });

  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Upload State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contractTitle, setContractTitle] = useState('');
  const [uploadStage, setUploadStage] = useState<
    'IDLE' | 'VALIDATING' | 'UPLOADING' | 'EXTRACTING' | 'SAVING' | 'SUCCESS' | 'ERROR'
  >('IDLE');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessId, setUploadSuccessId] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [contractsRes, obRes, deadRes, confRes] = await Promise.all([
        fetch('/api/contracts').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/obligations').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/deadlines').then((r) => r.json()).catch(() => ({ success: false, data: [], stats: {} })),
        fetch('/api/conflicts').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
      ]);

      const contractsList: Contract[] = contractsRes.success ? contractsRes.data : [];
      const obligationsList = obRes.success ? obRes.data : [];
      const deadlinesList: Deadline[] = deadRes.success ? deadRes.data : [];
      const conflictsList = confRes.success ? confRes.data : [];
      const deadStats = deadRes.stats || {};

      setRecentContracts(contractsList.slice(0, 5));
      setUpcomingDeadlines(deadlinesList.slice(0, 5));

      setStats({
        totalContracts: contractsList.length,
        activeObligations: Array.isArray(obligationsList) ? obligationsList.length : 0,
        upcomingDeadlines: Array.isArray(deadlinesList) ? deadlinesList.length : 0,
        complianceConflicts: Array.isArray(conflictsList) ? conflictsList.length : 0,
        dueSoon: deadStats.dueSoon || 0,
        overdue: deadStats.overdue || 0,
        criticalDeadlines: deadStats.criticalCount || 0,
      });
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (isMounted) {
        await fetchDashboardData();
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [fetchDashboardData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!contractTitle) {
        setContractTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      setUploadError(null);
      setUploadStage('IDLE');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a PDF or DOCX contract file to upload.');
      return;
    }

    try {
      setUploadError(null);
      setUploadStage('VALIDATING');

      const ext = selectedFile.name.slice(selectedFile.name.lastIndexOf('.')).toLowerCase();
      if (!['.pdf', '.docx'].includes(ext)) {
        throw new Error('Only PDF (.pdf) and Word (.docx) files are supported.');
      }
      if (selectedFile.size > 25 * 1024 * 1024) {
        throw new Error('File size exceeds the 25MB limit.');
      }

      setUploadStage('UPLOADING');
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (contractTitle) {
        formData.append('title', contractTitle);
      }

      setUploadStage('EXTRACTING');
      const res = await fetch('/api/contracts/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadStage('SAVING');
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Contract upload and extraction failed.');
      }

      setUploadStage('SUCCESS');
      setUploadSuccessId(data.data.id);
      fetchDashboardData();
    } catch (err: unknown) {
      const eObj = err as { message?: string };
      setUploadStage('ERROR');
      setUploadError(eObj.message || 'An error occurred during upload.');
    }
  };

  const resetUploadModal = () => {
    setSelectedFile(null);
    setContractTitle('');
    setUploadStage('IDLE');
    setUploadError(null);
    setUploadSuccessId(null);
    setIsUploadOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Primary Action */}
      <PageHeader
        title="Contract & Compliance Intelligence Dashboard"
        description="Monitor contracts, extracted obligations, critical deadlines, and policy conflicts."
        badgeText="SaaS Console"
        action={
          <Button
            onClick={() => {
              resetUploadModal();
              setIsUploadOpen(true);
            }}
            className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Contract</span>
          </Button>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Stat 1: Total Contracts */}
        <Card className="border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Contracts
            </CardTitle>
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-indigo-400" /> : stats.totalContracts}
            </div>
            <p className="text-xs text-slate-500 mt-1">PDF / DOCX files ingested</p>
          </CardContent>
        </Card>

        {/* Stat 2: Active Obligations */}
        <Card className="border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Active Obligations
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <CheckSquare className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-emerald-400" /> : stats.activeObligations}
            </div>
            <p className="text-xs text-slate-500 mt-1">SLA, Privacy & Operational duties</p>
          </CardContent>
        </Card>

        {/* Stat 3: Upcoming Deadlines */}
        <Card className="border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Upcoming Deadlines
            </CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-amber-400" /> : stats.upcomingDeadlines}
            </div>
            <p className="text-xs text-slate-500 mt-1">30-day notice windows & renewals</p>
          </CardContent>
        </Card>

        {/* Stat 4: Compliance Conflicts */}
        <Card className="border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Compliance Conflicts
            </CardTitle>
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-rose-400" /> : stats.complianceConflicts}
            </div>
            <p className="text-xs text-slate-500 mt-1">Policy cross-reference mismatches</p>
          </CardContent>
        </Card>
      </div>

      {/* Ask Contract AI Callout Card */}
      <Card className="border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-purple-950/40 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-indigo-400/40 text-indigo-300 bg-indigo-950/60 text-[10px] uppercase font-mono">
              Stage 7 Contract Intelligence Assistant
            </Badge>
            <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-400" />
            Ask Contract AI
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Ask natural-language questions about your contracts, obligations, deadlines, and compliance risks. Answers are grounded in your database with exact evidence citations.
          </p>
        </div>
        <Link href="/assistant">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 font-semibold text-xs py-5 px-6 shrink-0">
            <span>Open Assistant →</span>
          </Button>
        </Link>
      </Card>

      {/* Main Grid: Recent Contracts & Upcoming Deadlines Sections */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Section 1: Recent Contracts */}
        <Card className="border-slate-800 bg-slate-900/70 flex flex-col justify-between">

          <CardHeader className="border-b border-slate-800/80 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  Recent Contracts
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Recently uploaded supplier & vendor agreements
                </CardDescription>
              </div>
              <Link href="/contracts">
                <Button variant="ghost" size="sm" className="gap-1 text-indigo-400 hover:text-indigo-300">
                  <span>View All</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12">
                      <EmptyState
                        icon={FileText}
                        title="No Contracts Uploaded Yet"
                        description="Upload contract PDF or DOCX documents to populate this list."
                        actionText="Upload Contract"
                        onAction={() => {
                          resetUploadModal();
                          setIsUploadOpen(true);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  recentContracts.map((c) => (
                    <TableRow key={c.id} className="hover:bg-slate-800/40">
                      <TableCell className="font-medium text-slate-100 text-xs">
                        <Link href={`/contracts/${c.id}`} className="hover:text-indigo-400 flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          <span>{c.title}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-300">
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono">
                        {new Date(c.uploadedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Section 2: Upcoming Deadlines */}
        <Card className="border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  Upcoming Deadlines
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Critical notice windows, milestones & renewal deadlines
                </CardDescription>
              </div>
              <Link href="/deadlines">
                <Button variant="ghost" size="sm" className="gap-1 text-amber-400 hover:text-amber-300">
                  <span>View Calendar</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deadline Title</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Notice Window</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingDeadlines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12">
                      <EmptyState
                        icon={Calendar}
                        title="No Upcoming Deadlines Tracked"
                        description="Deadlines & notice periods will appear here once contracts are uploaded and analyzed."
                        statusText="Alert engine active"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  upcomingDeadlines.map((d) => (
                    <TableRow key={d.id} className="hover:bg-slate-800/40 cursor-pointer">
                      <TableCell className="font-medium text-slate-100 text-xs">
                        <Link href={`/deadlines/${d.id}`} className="hover:text-indigo-400">
                          {d.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-amber-300 font-mono">
                        {d.dueDate ? new Date(d.dueDate).toLocaleDateString() : 'NEEDS_REVIEW'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {d.noticeDays} Days Notice
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Upload Contract Dialog Modal Shell */}
      <Dialog
        isOpen={isUploadOpen}
        onClose={resetUploadModal}
        title="Upload Contract Document"
        description="Select a PDF or DOCX contract for storage and clause extraction."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 pt-2">
          {uploadError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadStage === 'SUCCESS' && uploadSuccessId && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3 text-xs text-emerald-300">
              <div className="flex items-center gap-2 font-semibold text-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Document Ingested & Text Extracted!</span>
              </div>
              <div>
                <Link href={`/contracts/${uploadSuccessId}`}>
                  <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2">
                    <Eye className="h-3.5 w-3.5" />
                    <span>Open Extracted Contract Text Preview</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {uploadStage !== 'SUCCESS' && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Contract Title (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Master Services Agreement 2026"
                  value={contractTitle}
                  onChange={(e) => setContractTitle(e.target.value)}
                  disabled={uploadStage !== 'IDLE' && uploadStage !== 'ERROR'}
                />
              </div>

              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 text-center bg-slate-950/60 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  disabled={uploadStage !== 'IDLE' && uploadStage !== 'ERROR'}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <FileCheck className="mx-auto h-8 w-8 text-indigo-400 mb-2" />
                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-indigo-300">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-200">
                      Click to choose or drag contract file here
                    </p>
                    <p className="text-[10px] text-slate-500">PDF or DOCX format (Max 25MB)</p>
                  </div>
                )}
              </div>

              {uploadStage !== 'IDLE' && uploadStage !== 'ERROR' && (
                <div className="space-y-2 py-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium text-indigo-300">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                      {uploadStage === 'VALIDATING' && 'Validating file format & size...'}
                      {uploadStage === 'UPLOADING' && 'Uploading contract document...'}
                      {uploadStage === 'EXTRACTING' && 'Parsing & extracting page text...'}
                      {uploadStage === 'SAVING' && 'Saving contract & pages to database...'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-indigo-500 transition-all duration-300 ${
                        uploadStage === 'VALIDATING'
                          ? 'w-1/4'
                          : uploadStage === 'UPLOADING'
                          ? 'w-2/4'
                          : uploadStage === 'EXTRACTING'
                          ? 'w-3/4'
                          : 'w-full'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetUploadModal}
                  disabled={uploadStage !== 'IDLE' && uploadStage !== 'ERROR'}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedFile || (uploadStage !== 'IDLE' && uploadStage !== 'ERROR')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Start Extraction Pipeline
                </Button>
              </div>
            </>
          )}
        </form>
      </Dialog>
    </div>
  );
}
