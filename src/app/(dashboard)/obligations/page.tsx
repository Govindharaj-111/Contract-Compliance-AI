'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { EvidenceModal } from '@/components/shared/evidence-modal';
import { Obligation } from '@/types';
import { CheckSquare, Search, Filter, Eye, UserCheck, ShieldAlert, Database, FileText } from 'lucide-react';
import Link from 'next/link';

interface ObligationWithContract extends Obligation {
  contract?: {
    title: string;
    fileName: string;
  };
}

export default function ObligationsPage() {
  const [obligations, setObligations] = useState<ObligationWithContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const [selectedObligation, setSelectedObligation] = useState<ObligationWithContract | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

  useEffect(() => {
    async function fetchObligations() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/obligations');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setObligations(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch obligations:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchObligations();
  }, []);

  const handleOpenEvidence = (ob: Obligation) => {
    setSelectedObligation(ob);
    setIsEvidenceModalOpen(true);
  };

  const filteredObligations = obligations.filter((ob) => {
    const matchesSearch =
      ob.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ob.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ob.responsibleParty && ob.responsibleParty.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ob.contract?.title && ob.contract.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'ALL' ||
      ob.category.toLowerCase().includes(categoryFilter.toLowerCase());

    const matchesSeverity =
      severityFilter === 'ALL' || ob.severity === severityFilter;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extracted Obligations & Compliance Intelligence"
        description="View extracted contractual duties, responsible parties, SLA requirements, and data-handling rules across all contracts."
        badgeText="Step 4 AI Engine"
      />

      {/* Toolbar & Filters */}
      <Card className="border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="text"
              placeholder="Search obligations or contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Filter className="h-3.5 w-3.5" />
              <span>Category:</span>
            </div>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-40"
            >
              <option value="ALL">All Categories</option>
              <option value="Compliance">Compliance</option>
              <option value="SLA">SLA Requirement</option>
              <option value="Data">Data Handling</option>
              <option value="Payment">Payment Terms</option>
              <option value="Notice">Notice Window</option>
            </Select>

            <Select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full sm:w-36"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Obligations Table */}
      <Card className="border-slate-800 bg-slate-900/70 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="text-xs text-slate-400">Loading extracted obligations...</p>
            </div>
          ) : filteredObligations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-800 bg-slate-950/40">
                    <TableHead className="w-[28%]">Obligation Title & Duty</TableHead>
                    <TableHead className="w-[18%]">Contract Source</TableHead>
                    <TableHead className="w-[14%]">Responsible Party</TableHead>
                    <TableHead className="w-[14%]">Deadline / Notice</TableHead>
                    <TableHead className="w-[10%]">Category</TableHead>
                    <TableHead className="w-[8%]">Clause/Pg</TableHead>
                    <TableHead className="w-[8%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredObligations.map((ob) => (
                    <TableRow key={ob.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <TableCell className="align-top py-3.5">
                        <div className="space-y-1">
                          <span className="font-semibold text-xs text-slate-100 block">
                            {ob.title}
                          </span>
                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                            {ob.description}
                          </p>
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

                      <TableCell className="align-top py-3.5">
                        <Link
                          href={`/contracts/${ob.contractId}`}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 truncate max-w-[180px]"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{ob.contract?.title || 'Contract Details'}</span>
                        </Link>
                      </TableCell>

                      <TableCell className="align-top py-3.5">
                        {ob.responsibleParty ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-200">
                            <UserCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            {ob.responsibleParty}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Unassigned</span>
                        )}
                      </TableCell>

                      <TableCell className="align-top py-3.5">
                        {ob.deadlineText || ob.noticePeriod ? (
                          <div className="space-y-0.5 text-xs text-slate-200">
                            {ob.deadlineText && <div>{ob.deadlineText}</div>}
                            {ob.noticePeriod && (
                              <div className="text-[11px] text-sky-400">
                                Notice: {ob.noticePeriod}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">None</span>
                        )}
                      </TableCell>

                      <TableCell className="align-top py-3.5">
                        <Badge variant="outline" className="text-[10px] border-slate-700 bg-slate-950 text-slate-300">
                          {ob.category}
                        </Badge>
                      </TableCell>

                      <TableCell className="align-top py-3.5">
                        <div className="text-[11px] font-mono text-slate-400">
                          {ob.clauseNumber ? `Cl. ${ob.clauseNumber}` : ''}
                          {ob.pageNumber ? ` (Pg. ${ob.pageNumber})` : ''}
                          {!ob.clauseNumber && !ob.pageNumber && '-'}
                        </div>
                      </TableCell>

                      <TableCell className="align-top py-3.5 text-right">
                        <Button
                          onClick={() => handleOpenEvidence(ob)}
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] gap-1 border-indigo-500/30 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-600 hover:text-white"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Evidence</span>
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
                icon={CheckSquare}
                title="No Obligations Found"
                description="Upload a contract document and run AI analysis to extract obligations, deadlines, and SLA terms."
              />
            </div>
          )}
        </CardContent>
      </Card>

      <EvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        obligation={selectedObligation}
        contractTitle={selectedObligation?.contract?.title}
      />
    </div>
  );
}
