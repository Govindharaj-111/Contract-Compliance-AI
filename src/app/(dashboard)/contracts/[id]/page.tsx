'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { EvidenceModal } from '@/components/shared/evidence-modal';
import { Obligation } from '@/types';
import {
  FileText,
  ArrowLeft,
  Calendar,
  FileType,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Layers,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Loader2,
  Clock,
  ShieldAlert,
  Database,
  Eye,
  RefreshCw,
  CheckSquare,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

interface ContractPageData {
  id: string;
  pageNumber: number;
  sectionTitle?: string;
  textContent: string;
}

interface ContractDetailData {
  id: string;
  title: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  pageCount?: number;
  status: string;
  extractedText?: string;
  uploadedAt: string;
  pages: ContractPageData[];
  obligations: Obligation[];
}

export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [contract, setContract] = useState<ContractDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [isCopied, setIsCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // AI Extraction state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedObligationForEvidence, setSelectedObligationForEvidence] =
    useState<Obligation | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchContractData() {
      try {
        const res = await fetch(`/api/contracts/${resolvedParams.id}`);
        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load contract details');
        }

        setContract(data.data);
      } catch (err: unknown) {
        if (isMounted) {
          const e = err as { message?: string };
          setError(e.message || 'Error fetching contract');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchContractData();
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id, reloadTick]);

  const refetchContract = () => setReloadTick((prev) => prev + 1);

  const handleRunAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);

      const res = await fetch(`/api/contracts/${resolvedParams.id}/analyze`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AI Contract Analysis failed.');
      }

      // Re-fetch updated contract with obligations
      refetchContract();
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('AI Analysis Error:', err);
      setAnalysisError(e.message || 'An unexpected error occurred during AI analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contract and its extracted data?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/contracts/${resolvedParams.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete contract');
      }

      router.push('/contracts');
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e.message || 'Error deleting contract');
      setIsDeleting(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenEvidence = (ob: Obligation) => {
    setSelectedObligationForEvidence(ob);
    setIsEvidenceModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p className="text-xs text-slate-400">Loading contract metadata and page text...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="space-y-6">
        <Link href="/contracts">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Contracts</span>
          </Button>
        </Link>
        <Card className="border-rose-900/50 bg-slate-900/80 p-8 text-center">
          <CardContent className="space-y-4">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-400" />
            <h3 className="text-lg font-semibold text-slate-100">Contract Load Error</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">{error || 'Contract record not found.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const obligations = contract.obligations || [];
  const totalObligationsCount = obligations.length;
  const deadlinesCount = obligations.filter((o) => Boolean(o.deadlineText)).length;
  const noticePeriodsCount = obligations.filter((o) => Boolean(o.noticePeriod)).length;
  const slaCount = obligations.filter(
    (o) => Boolean(o.slaRequirement) || o.category.toLowerCase().includes('sla')
  ).length;
  const dataHandlingCount = obligations.filter(
    (o) => Boolean(o.dataHandlingRequirement) || o.category.toLowerCase().includes('data')
  ).length;

  const activePageData =
    contract.pages.find((p) => p.pageNumber === selectedPage) || contract.pages[0];

  const formattedDate = new Date(contract.uploadedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedSize = contract.fileSize
    ? `${(contract.fileSize / 1024).toFixed(1)} KB`
    : 'Unknown size';

  return (
    <div className="space-y-8">
      {/* Top Navigation Back Link & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/contracts">
          <Button variant="outline" size="sm" className="gap-2 border-slate-800 bg-slate-900 text-slate-300">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Contracts</span>
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            size="sm"
            className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/25"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Extracting Obligations...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-indigo-200" />
                <span>{obligations.length > 0 ? 'Re-analyze Contract' : 'Run AI Extraction'}</span>
              </>
            )}
          </Button>

          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="destructive"
            size="sm"
            className="gap-2 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isDeleting ? 'Deleting...' : 'Delete Contract'}</span>
          </Button>
        </div>
      </div>

      <PageHeader
        title={contract.title}
        description={`File: ${contract.fileName} • Preserved ${contract.pageCount || 0} pages • ${obligations.length} extracted obligations.`}
        badgeText={contract.status}
      />

      {/* Metadata Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-indigo-400 shrink-0" />
            <div>
              <span className="text-[11px] text-slate-500 block uppercase tracking-wider font-semibold">
                Contract Name
              </span>
              <span className="text-xs font-semibold text-slate-200 truncate block max-w-[140px]">
                {contract.title}
              </span>
            </div>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-3">
            <FileType className="h-5 w-5 text-indigo-400 shrink-0" />
            <div>
              <span className="text-[11px] text-slate-500 block uppercase tracking-wider font-semibold">
                File Type / Name
              </span>
              <span className="text-xs font-semibold text-slate-200 truncate block max-w-[140px]">
                {contract.fileName}
              </span>
            </div>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-3">
            <HardDrive className="h-5 w-5 text-indigo-400 shrink-0" />
            <div>
              <span className="text-[11px] text-slate-500 block uppercase tracking-wider font-semibold">
                File Size
              </span>
              <span className="text-xs font-semibold text-slate-200 block">
                {formattedSize}
              </span>
            </div>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-indigo-400 shrink-0" />
            <div>
              <span className="text-[11px] text-slate-500 block uppercase tracking-wider font-semibold">
                Upload Date
              </span>
              <span className="text-[11px] font-medium text-slate-200 block">
                {formattedDate}
              </span>
            </div>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[11px] text-slate-500 block uppercase tracking-wider font-semibold">
                Extraction Status
              </span>
              <Badge
                variant={contract.status === 'ANALYZED' ? 'success' : 'secondary'}
                className="mt-0.5 text-[10px]"
              >
                {contract.status === 'ANALYZED' ? 'ANALYZED' : contract.status}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 4: AI ANALYSIS & OBLIGATION EXTRACTION SECTION             */}
      {/* ==================================================================== */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              AI Compliance & Obligation Analysis
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Structured extraction of contractual duties, SLAs, notice periods, and data-handling rules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={
                isAnalyzing
                  ? 'outline'
                  : contract.status === 'ANALYZED'
                  ? 'success'
                  : 'secondary'
              }
              className="px-3 py-1 text-xs"
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analyzing Text...
                </span>
              ) : contract.status === 'ANALYZED' ? (
                'ANALYSIS COMPLETE'
              ) : (
                'PENDING ANALYSIS'
              )}
            </Badge>
          </div>
        </div>

        {/* AI Analysis Metrics Counters */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="border-slate-800 bg-slate-900/70 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Obligations
                </span>
                <span className="text-2xl font-bold text-slate-100 mt-1 block">
                  {totalObligationsCount}
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Deadlines
                </span>
                <span className="text-2xl font-bold text-amber-400 mt-1 block">
                  {deadlinesCount}
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Notice Periods
                </span>
                <span className="text-2xl font-bold text-sky-400 mt-1 block">
                  {noticePeriodsCount}
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-sky-600/10 border border-sky-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-sky-400" />
              </div>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  SLA Requirements
                </span>
                <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                  {slaCount}
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Data Handling
                </span>
                <span className="text-2xl font-bold text-purple-400 mt-1 block">
                  {dataHandlingCount}
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                <Database className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* AI Error Alert / Missing API Key Box */}
        {analysisError && (
          <Card className="border-rose-900/50 bg-rose-950/30 p-5">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h4 className="text-sm font-semibold text-rose-200">
                  AI Obligation Extraction Error
                </h4>
                <p className="text-xs text-rose-300 leading-relaxed max-w-3xl">
                  {analysisError}
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <Button
                    onClick={handleRunAnalysis}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-rose-500/40 bg-rose-900/20 text-rose-200 hover:bg-rose-900/40 gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Retry AI Analysis</span>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Extracted Obligations Table */}
        <Card className="border-slate-800 bg-slate-900/70 overflow-hidden">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-indigo-400" />
                  Extracted Obligations & Compliance Findings ({obligations.length})
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Validated against Zod schema with supporting evidence traceability and page anchor references.
                </CardDescription>
              </div>

              {obligations.length > 0 && (
                <Button
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 border-slate-800 bg-slate-950 text-slate-300"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>Re-extract</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {obligations.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-800/80 bg-slate-950/40">
                      <TableHead className="w-[30%]">Obligation Description</TableHead>
                      <TableHead className="w-[14%]">Responsible Party</TableHead>
                      <TableHead className="w-[14%]">Deadline / Notice</TableHead>
                      <TableHead className="w-[12%]">Category</TableHead>
                      <TableHead className="w-[10%]">Confidence</TableHead>
                      <TableHead className="w-[8%]">Clause / Page</TableHead>
                      <TableHead className="w-[12%] text-right">Evidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {obligations.map((ob) => {
                      const confidenceVal = ob.confidence
                        ? Math.round(ob.confidence * 100)
                        : 90;

                      let confColor = 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20';
                      if (confidenceVal < 80) {
                        confColor = 'border-amber-500/30 text-amber-400 bg-amber-950/20';
                      } else if (confidenceVal < 90) {
                        confColor = 'border-sky-500/30 text-sky-400 bg-sky-950/20';
                      }

                      return (
                        <TableRow key={ob.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          {/* Description */}
                          <TableCell className="align-top py-3.5">
                            <div className="space-y-1">
                              <span className="font-semibold text-xs text-slate-100 block">
                                {ob.title}
                              </span>
                              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                                {ob.description}
                              </p>

                              {/* Specialized Badges */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                {ob.slaRequirement && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-500/30">
                                    <ShieldAlert className="h-2.5 w-2.5" />
                                    SLA: {ob.slaRequirement}
                                  </span>
                                )}
                                {ob.dataHandlingRequirement && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/50 text-purple-300 border border-purple-500/30">
                                    <Database className="h-2.5 w-2.5" />
                                    Data: {ob.dataHandlingRequirement}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Responsible Party */}
                          <TableCell className="align-top py-3.5">
                            {ob.responsibleParty ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-200">
                                <UserCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                {ob.responsibleParty}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500 italic">Unassigned</span>
                            )}
                          </TableCell>

                          {/* Deadline / Notice */}
                          <TableCell className="align-top py-3.5">
                            {ob.deadlineText || ob.noticePeriod ? (
                              <div className="space-y-0.5">
                                {ob.deadlineText && (
                                  <span className="block text-xs text-slate-200 font-medium">
                                    {ob.deadlineText}
                                  </span>
                                )}
                                {ob.noticePeriod && (
                                  <span className="block text-[11px] text-sky-400">
                                    Notice: {ob.noticePeriod}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 italic">None</span>
                            )}
                          </TableCell>

                          {/* Category */}
                          <TableCell className="align-top py-3.5">
                            <Badge variant="outline" className="text-[10px] border-slate-700 bg-slate-950 text-slate-300">
                              {ob.category}
                            </Badge>
                          </TableCell>

                          {/* Confidence */}
                          <TableCell className="align-top py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${confColor}`}>
                              {confidenceVal}%
                            </span>
                          </TableCell>

                          {/* Clause / Page */}
                          <TableCell className="align-top py-3.5">
                            <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                              {ob.clauseNumber && <div>Cl. {ob.clauseNumber}</div>}
                              {ob.pageNumber && <div className="text-slate-500">Pg. {ob.pageNumber}</div>}
                              {!ob.clauseNumber && !ob.pageNumber && <span>-</span>}
                            </div>
                          </TableCell>

                          {/* View Evidence Action */}
                          <TableCell className="align-top py-3.5 text-right">
                            <Button
                              onClick={() => handleOpenEvidence(ob)}
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] gap-1 border-indigo-500/30 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-600 hover:text-white"
                            >
                              <Eye className="h-3 w-3" />
                              <span>View Evidence</span>
                            </Button>
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
                  icon={Sparkles}
                  title="No Obligations Extracted Yet"
                  description="Run AI compliance extraction to analyze contract text and extract duties, deadlines, SLAs, and data handling rules."
                  actionText={isAnalyzing ? 'Extracting...' : 'Run AI Analysis'}
                  onAction={handleRunAnalysis}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 2: ORIGINAL EXTRACTED CONTRACT DOCUMENT VIEWER              */}
      {/* ==================================================================== */}
      <div className="space-y-4 pt-6 border-t border-slate-800">
        <h3 className="text-md font-bold text-slate-200 flex items-center gap-2">
          <FileCode className="h-4 w-4 text-indigo-400" />
          Original Extracted Text & Page Viewer
        </h3>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Left: Page/Section Selector Sidebar */}
          <Card className="border-slate-800 bg-slate-900/70 p-4 h-fit max-h-[500px] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                Document Pages ({contract.pages.length})
              </span>
            </div>

            <div className="space-y-1">
              {contract.pages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPage(p.pageNumber)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    selectedPage === p.pageNumber
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>{p.sectionTitle || `Page ${p.pageNumber}`}</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {p.textContent.length} chars
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Right: Extracted Page Content Box */}
          <Card className="lg:col-span-3 border-slate-800 bg-slate-900/70 flex flex-col">
            <CardHeader className="border-b border-slate-800/80 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm text-slate-100 flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-indigo-400" />
                    {activePageData?.sectionTitle || `Page ${selectedPage}`} Verbatim Text
                  </CardTitle>
                </div>

                {activePageData?.textContent && (
                  <Button
                    onClick={() => handleCopyText(activePageData.textContent)}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 border-slate-800 bg-slate-950 text-slate-300"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {activePageData?.textContent ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                  {activePageData.textContent}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No text on this page"
                  description="This page section does not contain readable text."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Supporting Evidence Modal Component */}
      <EvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        obligation={selectedObligationForEvidence}
        contractTitle={contract.title}
      />
    </div>
  );
}
