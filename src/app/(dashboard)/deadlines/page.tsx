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
import { Deadline, Obligation } from '@/types';
import {
  Clock,
  Filter,
  Search,
  Calendar,
  AlertCircle,
  FileText,
  Bell,
  CheckCircle2,
  Loader2,
  Hourglass,
  ArrowRight,
} from 'lucide-react';

interface ObligationItem extends Obligation {
  contract?: { title: string };
}

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [obligations, setObligations] = useState<ObligationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowFilter, setWindowFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDeadlinesData = useCallback(async () => {
    try {
      setLoading(true);
      const [deadRes, obRes] = await Promise.all([
        fetch('/api/deadlines').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/obligations').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
      ]);

      if (deadRes.success && Array.isArray(deadRes.data)) {
        setDeadlines(deadRes.data);
      }
      if (obRes.success && Array.isArray(obRes.data)) {
        setObligations(obRes.data.filter((o: ObligationItem) => Boolean(o.deadlineText || o.noticePeriod)));
      }
    } catch (err) {
      console.error('Failed to load deadlines:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeadlinesData();
  }, [fetchDeadlinesData]);

  // Combine deadlines and obligations with notice/deadline info
  const combinedItems = [
    ...deadlines.map((d) => ({
      id: d.id,
      title: d.title,
      contractTitle: d.contract?.title || 'Contract',
      contractId: d.contractId,
      dueDate: new Date(d.dueDate),
      noticeDays: d.noticeDays,
      category: 'Contractual Deadline',
      isAlertSent: d.isAlertSent,
      sourceType: 'DEADLINE',
    })),
    ...obligations.map((o) => {
      // Calculate estimated due date based on created date + notice period or 60 days
      const days = parseInt(o.noticePeriod || '60', 10) || 60;
      const calculatedDate = new Date(o.createdAt || Date.now());
      calculatedDate.setDate(calculatedDate.getDate() + days);

      return {
        id: o.id,
        title: o.title || o.description.slice(0, 60),
        contractTitle: o.contract?.title || 'Contract',
        contractId: o.contractId,
        dueDate: calculatedDate,
        noticeDays: days,
        category: o.category || 'Notice Window',
        isAlertSent: false,
        sourceType: 'OBLIGATION',
      };
    }),
  ];

  const now = new Date();

  // Filtering
  const filteredItems = combinedItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contractTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const diffDays = Math.ceil((item.dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (windowFilter === '7_DAYS') return diffDays >= 0 && diffDays <= 7;
    if (windowFilter === '30_DAYS') return diffDays >= 0 && diffDays <= 30;
    if (windowFilter === '90_DAYS') return diffDays >= 0 && diffDays <= 90;

    return true;
  });

  const next30DaysCount = combinedItems.filter((i) => {
    const diff = Math.ceil((i.dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diff >= 0 && diff <= 30;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deadlines & Notice Periods"
        description="Monitor critical contract dates, renewal windows, opt-out deadlines, and automated compliance alerts."
        badgeText="Step 4 Deadline Tracker"
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Total Tracked Deadlines</span>
              <p className="text-2xl font-bold text-slate-100 mt-1">{combinedItems.length}</p>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Next 30-Day Notice Windows</span>
              <p className="text-2xl font-bold text-amber-400 mt-1">{next30DaysCount}</p>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <Hourglass className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Contracts Monitored</span>
              <p className="text-2xl font-bold text-sky-400 mt-1">
                {new Set(combinedItems.map((i) => i.contractId)).size}
              </p>
            </div>
            <div className="rounded-lg bg-sky-500/10 p-2 text-sky-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Alert Engine</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">ACTIVE</p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <Bell className="h-5 w-5" />
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
              placeholder="Search by deadline title or contract..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Time Window:</span>
            <Select
              value={windowFilter}
              onChange={(e) => setWindowFilter(e.target.value)}
              className="w-full sm:w-56 text-xs"
            >
              <option value="ALL">All Deadlines</option>
              <option value="7_DAYS">Next 7 Days</option>
              <option value="30_DAYS">Next 30 Days (Notice Window)</option>
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
              <p className="text-xs text-slate-400">Loading contract deadlines...</p>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-800 bg-slate-950/40">
                    <TableHead className="w-[32%]">Deadline / Event Title</TableHead>
                    <TableHead className="w-[22%]">Associated Contract</TableHead>
                    <TableHead className="w-[16%]">Due Date</TableHead>
                    <TableHead className="w-[14%]">Notice Window</TableHead>
                    <TableHead className="w-[16%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const diffDays = Math.ceil(
                      (item.dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
                    );
                    const isUrgent = diffDays <= 30;

                    return (
                      <TableRow key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <TableCell className="align-top py-3.5">
                          <div className="space-y-1">
                            <span className="font-semibold text-xs text-slate-100 block">
                              {item.title}
                            </span>
                            <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                              {item.category}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell className="align-top py-3.5">
                          <Link
                            href={`/contracts/${item.contractId}`}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 truncate max-w-[200px]"
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{item.contractTitle}</span>
                          </Link>
                        </TableCell>

                        <TableCell className="align-top py-3.5">
                          <div className="space-y-0.5">
                            <span className={`text-xs font-mono font-bold block ${isUrgent ? 'text-amber-400' : 'text-slate-200'}`}>
                              {item.dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {diffDays > 0 ? `In ${diffDays} days` : diffDays === 0 ? 'Today' : `${Math.abs(diffDays)} days ago`}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="align-top py-3.5">
                          <span className="text-xs text-slate-300 font-mono">
                            {item.noticeDays} Days Advance Notice
                          </span>
                        </TableCell>

                        <TableCell className="align-top py-3.5 text-right">
                          <Link href={`/contracts/${item.contractId}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] gap-1 border-slate-700 bg-slate-800 text-slate-200 hover:bg-indigo-600 hover:text-white"
                            >
                              <span>View Contract</span>
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
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
                title="No Active Deadlines Tracked"
                description="Upload contract PDF or DOCX documents to automatically extract renewal dates and notice windows."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
