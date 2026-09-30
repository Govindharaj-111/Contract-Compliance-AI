'use client';

import React, { useEffect, useState, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Policy, PolicyConflict, PolicyRequirement } from '@/types';
import {
  ShieldCheck,
  ArrowLeft,
  BookOpen,
  Edit,
  Trash2,
  AlertTriangle,
  FileText,
  Loader2,
  Scale,
} from 'lucide-react';

interface PolicyDetailData extends Omit<Policy, 'requirements'> {
  requirements: PolicyRequirement[];
  conflicts: Array<
    PolicyConflict & {
      contract?: { title: string };
    }
  >;
}

export default function PolicyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [policy, setPolicy] = useState<PolicyDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formVersion, setFormVersion] = useState('');
  const [formContent, setFormContent] = useState('');

  const fetchPolicy = useCallback(async () => {
    try {
      const res = await fetch(`/api/policies/${resolvedParams.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPolicy(json.data);
        setFormCode(json.data.code);
        setFormTitle(json.data.title);
        setFormCategory(json.data.category);
        setFormVersion(json.data.version);
        setFormContent(json.data.content);
      } else {
        setError(json.error || 'Policy not found.');
      }
    } catch (err) {
      console.error('Fetch policy error:', err);
      setError('Failed to fetch policy detail.');
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (isMounted) {
        await fetchPolicy();
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [fetchPolicy]);

  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch(`/api/policies/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formCode,
          title: formTitle,
          category: formCategory,
          version: formVersion,
          content: formContent,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsEditOpen(false);
        fetchPolicy();
      } else {
        alert(json.error || 'Failed to update policy');
      }
    } catch (err) {
      console.error('Update policy error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePolicy = async () => {
    if (!confirm('Are you sure you want to delete this policy rule?')) return;
    try {
      const res = await fetch(`/api/policies/${resolvedParams.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        router.push('/policies');
      } else {
        alert(json.error || 'Failed to delete policy');
      }
    } catch (err) {
      console.error('Delete policy error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
        <p className="text-xs text-slate-400">Loading policy details...</p>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="space-y-6">
        <Link href="/policies">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-400">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Policies</span>
          </Button>
        </Link>
        <Card className="border-rose-900/50 bg-slate-900/80 p-8 text-center">
          <CardContent className="space-y-3">
            <AlertTriangle className="mx-auto h-8 w-8 text-rose-400" />
            <h3 className="text-md font-semibold text-slate-100">Policy Error</h3>
            <p className="text-xs text-slate-400">{error || 'Policy not found.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between">
        <Link href="/policies">
          <Button variant="outline" size="sm" className="gap-2 border-slate-800 bg-slate-900 text-slate-300">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Policies</span>
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsEditOpen(true)}
            variant="outline"
            size="sm"
            className="gap-2 border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/40"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Edit Policy Rule</span>
          </Button>

          <Button
            onClick={handleDeletePolicy}
            variant="destructive"
            size="sm"
            className="gap-2 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Policy</span>
          </Button>
        </div>
      </div>

      <PageHeader
        title={`${policy.code} - ${policy.title}`}
        description={`Category: ${policy.category} • Version: ${policy.version} • Active Standard`}
        badgeText={policy.isActive ? 'ACTIVE POLICY' : 'INACTIVE'}
      />

      {/* Metadata Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-indigo-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Policy Code & Version
              </span>
              <span className="text-xs font-bold text-slate-100 font-mono">
                {policy.code} (v{policy.version})
              </span>
            </div>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Compliance Category
              </span>
              <span className="text-xs font-semibold text-slate-100">
                {policy.category}
              </span>
            </div>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Cross-Reference Conflicts
              </span>
              <span className="text-xs font-semibold text-amber-300">
                {policy.conflicts?.length || 0} Conflict(s) Detected
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Policy Verbatim Text Rule Box */}
      <Card className="border-slate-800 bg-slate-900/70">
        <CardHeader className="border-b border-slate-800/80 pb-3">
          <CardTitle className="text-sm text-slate-100 flex items-center gap-2">
            <Scale className="h-4 w-4 text-indigo-400" />
            Mandated Corporate Policy Rule & Standard Text
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
            {policy.content}
          </div>
        </CardContent>
      </Card>

      {/* Associated Policy Conflicts Table */}
      <Card className="border-slate-800 bg-slate-900/70">
        <CardHeader className="border-b border-slate-800/80 pb-3">
          <CardTitle className="text-sm text-slate-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Detected Contract Mismatches for {policy.code} ({policy.conflicts?.length || 0})
          </CardTitle>
          <CardDescription className="text-xs">
            Contracts containing clauses that breach or deviate from this policy.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {policy.conflicts && policy.conflicts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-800 bg-slate-950/40">
                  <TableHead className="w-[35%]">Conflict Summary</TableHead>
                  <TableHead className="w-[25%]">Contract Source</TableHead>
                  <TableHead className="w-[15%]">Severity</TableHead>
                  <TableHead className="w-[15%]">Status</TableHead>
                  <TableHead className="w-[10%] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policy.conflicts.map((c) => (
                  <TableRow key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <TableCell className="align-top py-3">
                      <span className="font-semibold text-xs text-slate-100 block">
                        {c.title}
                      </span>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                        {c.description}
                      </p>
                    </TableCell>

                    <TableCell className="align-top py-3">
                      <Link
                        href={`/contracts/${c.contractId}`}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span>{c.contractName || c.contract?.title || 'Contract'}</span>
                      </Link>
                    </TableCell>

                    <TableCell className="align-top py-3">
                      <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px]">
                        {c.severity}
                      </Badge>
                    </TableCell>

                    <TableCell className="align-top py-3">
                      <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                        {c.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="align-top py-3 text-right">
                      <Link href="/conflicts">
                        <Button variant="ghost" size="sm" className="h-7 text-[11px] text-indigo-400">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No contracts currently conflict with policy {policy.code}.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Policy Dialog Modal */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Policy Rule"
        description={`Update compliance parameters for ${policy.code}`}
      >
        <form onSubmit={handleUpdatePolicy} className="space-y-4 pt-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Policy Code
              </label>
              <Input
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Category
              </label>
              <Select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="text-xs"
              >
                <option value="Data Privacy">Data Privacy</option>
                <option value="Security">Security</option>
                <option value="SLA">SLA Uptime</option>
                <option value="Notice">Notice Windows</option>
                <option value="Financial">Financial & Payment</option>
                <option value="Retention">Data Retention</option>
                <option value="General">General Compliance</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Title
            </label>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Content / Requirement
            </label>
            <textarea
              rows={4}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 p-3 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
