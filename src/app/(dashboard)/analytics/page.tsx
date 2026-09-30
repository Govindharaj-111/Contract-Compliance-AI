'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import {
  ShieldAlert,
  BarChart3,
  Award,
  AlertTriangle,
  FileText,
  Users,
  Loader2,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  PieChart,
} from 'lucide-react';
import { PortfolioAnalyticsSummary } from '@/lib/ai/risk-scoring';


export default function AnalyticsPage() {
  const [data, setData] = useState<PortfolioAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadAnalytics() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await fetch('/api/analytics');
        const json = await res.json();
        if (!isMounted) return;

        if (json.success && json.data) {
          setData(json.data);
        } else {
          throw new Error(json.error || 'Failed to load portfolio compliance analytics.');
        }
      } catch (err: unknown) {
        const e = err as { message?: string };
        if (isMounted) setErrorMsg(e.message || 'Error connecting to analytics engine.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAnalytics();
    return () => {
      isMounted = false;
    };
  }, []);

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'border-rose-500/40 text-rose-300 bg-rose-950/40';
      case 'HIGH':
        return 'border-orange-500/40 text-orange-300 bg-orange-950/40';
      case 'MEDIUM':
        return 'border-amber-500/40 text-amber-300 bg-amber-950/40';
      default:
        return 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40';
    }
  };

  const getGradeBadgeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40';
    if (grade === 'B') return 'border-indigo-500/40 text-indigo-300 bg-indigo-950/40';
    if (grade === 'C') return 'border-amber-500/40 text-amber-300 bg-amber-950/40';
    return 'border-rose-500/40 text-rose-300 bg-rose-950/40';
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <PageHeader
        title="Contract Portfolio Risk & Vendor Intelligence"
        description="Automated risk scoring, vendor compliance matrix, and portfolio analytics across all contracts."
        badgeText="Stage 8 Risk Engine"
        action={
          <Link href="/assistant">
            <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
              <ShieldAlert className="h-4 w-4" />
              <span>Ask AI Assistant</span>
            </Button>
          </Link>
        }
      />

      {errorMsg && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4 Stat Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Stat 1: Portfolio Risk Score */}
        <Card className="border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Portfolio Risk Score
            </CardTitle>
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <BarChart3 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold text-white">
                {loading ? <Loader2 className="h-6 w-6 animate-spin text-indigo-400" /> : `${data?.averagePortfolioRiskScore || 0} / 100`}
              </div>
              {data && (
                <Badge variant="outline" className={`text-[10px] font-mono ${getRiskBadgeColor(data.portfolioRiskLevel)}`}>
                  {data.portfolioRiskLevel} RISK
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Weighted score across contracts</p>
          </CardContent>
        </Card>

        {/* Stat 2: High Risk Contracts */}
        <Card className="border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              High Risk Contracts
            </CardTitle>
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-rose-400" /> : data?.highRiskContractsCount || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Contracts requiring risk mitigation</p>
          </CardContent>
        </Card>

        {/* Stat 3: Monitored Vendors */}
        <Card className="border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Monitored Vendors
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-emerald-400" /> : data?.activeVendorsCount || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Vendors & responsible parties</p>
          </CardContent>
        </Card>

        {/* Stat 4: Critical Action Items */}
        <Card className="border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Critical Action Items
            </CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {loading ? <Loader2 className="h-6 w-6 animate-spin text-amber-400" /> : (data?.criticalConflictsCount || 0) + (data?.overdueDeadlinesCount || 0)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Overdue deadlines & critical conflicts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Vendor Compliance Ratings & Ranked Risk Matrix */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Section 1: Vendor Compliance Matrix */}
        <Card className="border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-400" />
                  Vendor Compliance Rating Matrix
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Compliance grades & breach metrics grouped by supplier/vendor
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 text-[10px]">
                Graded A+ to F
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor / Party</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Compliance %</TableHead>
                  <TableHead>Overdue / Conflicts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-400 text-xs">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-emerald-400 mb-2" />
                      Evaluating vendor compliance ratings...
                    </TableCell>
                  </TableRow>
                ) : !data || data.topVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <EmptyState
                        icon={Users}
                        title="No Vendor Ratings Calculated"
                        description="Upload contracts with assigned responsible parties to populate vendor compliance matrix."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  data.topVendors.map((v, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-800/40">
                      <TableCell className="font-semibold text-slate-100 text-xs">
                        {v.vendorName}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">{v.role}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-mono text-xs font-bold ${getGradeBadgeColor(v.grade)}`}>
                          Grade {v.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                v.compliancePercentage >= 80
                                  ? 'bg-emerald-500'
                                  : v.compliancePercentage >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${v.compliancePercentage}%` }}
                            />
                          </div>
                          <span>{v.compliancePercentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        <span className={v.overdueDeadlines > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                          {v.overdueDeadlines} Overdue
                        </span>
                        <span className="text-slate-600 mx-1">•</span>
                        <span className={v.activeConflicts > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                          {v.activeConflicts} Conflicts
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Section 2: Ranked Contract Risk Matrix */}
        <Card className="border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                  Contract Risk Ranking Matrix
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Ingested contracts ranked by algorithmic compliance risk score (0-100)
                </CardDescription>
              </div>
              <Link href="/contracts">
                <Button variant="ghost" size="sm" className="gap-1 text-indigo-400 hover:text-indigo-300 text-xs">
                  <span>Contracts</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract Document</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Factors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-400 text-xs">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-indigo-400 mb-2" />
                      Computing contract risk scores...
                    </TableCell>
                  </TableRow>
                ) : !data || data.rankedContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <EmptyState
                        icon={FileText}
                        title="No Contracts Analyzed"
                        description="Ingest contract PDF/DOCX files to view risk ranking matrix."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  data.rankedContracts.map((c) => (
                    <TableRow key={c.contractId} className="hover:bg-slate-800/40">
                      <TableCell className="font-semibold text-slate-100 text-xs">
                        <Link href={`/contracts/${c.contractId}`} className="hover:text-indigo-400 flex items-center gap-1.5">
                          <span>{c.contractTitle}</span>
                          <ExternalLink className="h-3 w-3 text-slate-500 shrink-0" />
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-white">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                c.riskScore >= 75
                                  ? 'bg-rose-500'
                                  : c.riskScore >= 50
                                  ? 'bg-orange-500'
                                  : c.riskScore >= 25
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.max(c.riskScore, 5)}%` }}
                            />
                          </div>
                          <span>{c.riskScore}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-mono text-[10px] ${getRiskBadgeColor(c.riskLevel)}`}>
                          {c.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {c.criticalConflictsCount > 0 && (
                          <span className="text-rose-400 font-semibold mr-2">
                            {c.criticalConflictsCount} Crit Conf
                          </span>
                        )}
                        {c.overdueDeadlinesCount > 0 && (
                          <span className="text-amber-400 font-semibold mr-2">
                            {c.overdueDeadlinesCount} Overdue
                          </span>
                        )}
                        {c.criticalConflictsCount === 0 && c.overdueDeadlinesCount === 0 && (
                          <span className="text-emerald-400 font-medium">Clear</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution Breakdown Card */}
      {data && Object.keys(data.categoryBreakdown).length > 0 && (
        <Card className="border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <PieChart className="h-4 w-4 text-indigo-400" />
              Contract Obligation Category Distribution
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Total Obligations: {Object.values(data.categoryBreakdown).reduce((a, b) => a + b, 0)}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {Object.entries(data.categoryBreakdown).map(([category, count]) => (
              <div key={category} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {category}
                </span>
                <div className="text-2xl font-bold text-indigo-400">{count}</div>
                <p className="text-[10px] text-slate-500">Tracked duties & requirements</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
