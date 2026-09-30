'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { Dialog } from '@/components/ui/dialog';
import { Policy } from '@/types';
import {
  ShieldCheck,
  Plus,
  Search,
  BookOpen,
  Filter,
  CheckCircle2,
  Trash2,
  Eye,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isAddPolicyOpen, setIsAddPolicyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Form inputs
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Data Privacy');
  const [formVersion, setFormVersion] = useState('1.0');
  const [formContent, setFormContent] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/policies');
      const json = await res.json();
      if (json.success) {
        setPolicies(json.data || []);
      } else {
        setError(json.error || 'Failed to load policies.');
      }
    } catch (err) {
      console.error('Fetch policies error:', err);
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formContent) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formCode,
          title: formTitle,
          category: formCategory,
          version: formVersion,
          content: formContent,
          isActive: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsAddPolicyOpen(false);
        setFormCode('');
        setFormTitle('');
        setFormContent('');
        fetchPolicies();
      } else {
        alert(json.error || 'Failed to save policy');
      }
    } catch (err) {
      console.error('Error creating policy:', err);
      alert('Error submitting policy form.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm('Are you sure you want to delete this policy rule?')) return;
    try {
      const res = await fetch(`/api/policies/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        fetchPolicies();
      } else {
        alert(json.error || 'Failed to delete policy');
      }
    } catch (err) {
      console.error('Delete policy error:', err);
    }
  };

  const handleSeedDefaultPolicies = async () => {
    try {
      setSeeding(true);
      const samplePolicies = [
        {
          code: 'POL-PRIV-001',
          title: 'Customer Data Erasure & Retention Limits',
          category: 'Data Privacy',
          version: '1.0',
          content: 'Customer data must be deleted within 90 days following contract termination or written erasure request.',
        },
        {
          code: 'POL-SEC-001',
          title: 'Encryption Standard & Data Breach Notice',
          category: 'Security',
          version: '1.5',
          content: 'All confidential customer records must be encrypted using AES-256 at rest and TLS 1.3 in transit. Security data breaches must be reported within 24 hours.',
        },
        {
          code: 'POL-SLA-001',
          title: 'Minimum Platform Availability SLA',
          category: 'SLA',
          version: '2.0',
          content: 'SaaS platforms and managed cloud services must maintain a minimum SLA uptime availability of 99.9% per calendar month.',
        },
        {
          code: 'POL-TERM-001',
          title: 'Termination Advance Notice Window',
          category: 'Notice',
          version: '1.0',
          content: 'Contracts must require at least 30 days prior written notice for termination without cause.',
        },
      ];

      for (const p of samplePolicies) {
        await fetch('/api/policies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p),
        });
      }

      fetchPolicies();
    } catch (err) {
      console.error('Error seeding policies:', err);
    } finally {
      setSeeding(false);
    }
  };

  // Filtered policies
  const filteredPolicies = policies.filter((p) => {
    const matchesCategory =
      selectedCategory === 'ALL' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal Corporate Policies"
        description="Maintain company security, data privacy, SLA, and operational compliance standards used for automated contract conflict cross-referencing."
        badgeText="Policy Store"
        action={
          <div className="flex items-center gap-2">
            {policies.length === 0 && (
              <Button
                onClick={handleSeedDefaultPolicies}
                disabled={seeding}
                variant="outline"
                className="gap-2 border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/40"
              >
                {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-400" />}
                <span>Load Sample Policies</span>
              </Button>
            )}
            <Button
              onClick={() => setIsAddPolicyOpen(true)}
              className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>Add Corporate Policy</span>
            </Button>
          </div>
        }
      />

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Total Policies</span>
              <p className="text-2xl font-bold text-slate-100 mt-1">{policies.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-indigo-400/80" />
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Active Policies</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {policies.filter((p) => p.isActive).length}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-400/80" />
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Categories Covered</span>
              <p className="text-2xl font-bold text-sky-400 mt-1">
                {new Set(policies.map((p) => p.category)).size}
              </p>
            </div>
            <ShieldCheck className="h-8 w-8 text-sky-400/80" />
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Conflicts Detected</span>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {policies.reduce((sum, p) => sum + (p._count?.conflicts || 0), 0)}
              </p>
            </div>
            <ShieldCheck className="h-8 w-8 text-amber-400/80" />
          </div>
        </Card>
      </div>

      {/* Filter & Toolbar */}
      <Card className="border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="text"
              placeholder="Search policies by code or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-slate-400 hidden sm:inline" />
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-56 text-xs"
            >
              <option value="ALL">All Categories</option>
              <option value="Data Privacy">Data Privacy</option>
              <option value="Security">Security</option>
              <option value="SLA">SLA Uptime</option>
              <option value="Notice">Notice Windows</option>
              <option value="Financial">Financial & Payment</option>
              <option value="Retention">Data Retention</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Policies Data Table */}
      <Card className="border-slate-800 bg-slate-900/70">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
              <span className="text-xs">Loading corporate policies...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-xs text-rose-400 bg-rose-950/20 border border-rose-500/30 rounded-lg">
              {error}
            </div>
          ) : filteredPolicies.length === 0 ? (
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <EmptyState
                      icon={ShieldCheck}
                      title="No Policies Configured"
                      description="Add corporate compliance rules, data-handling standards, and payment terms to enable automated contract conflict detection."
                      actionText="Add Corporate Policy"
                      onAction={() => setIsAddPolicyOpen(true)}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-xs font-semibold text-slate-300">Policy Code</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-300">Policy Title & Rule Summary</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-300">Category</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-300">Version</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-300">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPolicies.map((p) => (
                  <TableRow key={p.id} className="border-slate-800/60 hover:bg-slate-800/40">
                    <TableCell className="font-mono text-xs font-bold text-indigo-300">
                      {p.code}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 max-w-md">
                        <Link
                          href={`/policies/${p.id}`}
                          className="text-xs font-semibold text-slate-100 hover:text-indigo-400 transition-colors block"
                        >
                          {p.title}
                        </Link>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {p.content}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                        {p.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-300 font-mono">
                      v{p.version}
                    </TableCell>
                    <TableCell>
                      {p.isActive ? (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                          ACTIVE
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          INACTIVE
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/policies/${p.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-300">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          onClick={() => handleDeletePolicy(p.id)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Policy Modal */}
      <Dialog
        isOpen={isAddPolicyOpen}
        onClose={() => setIsAddPolicyOpen(false)}
        title="Add Corporate Compliance Policy"
        description="Define a standard internal policy rule for automated contract compliance comparison."
      >
        <form onSubmit={handleCreatePolicy} className="space-y-4 pt-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Policy Code
              </label>
              <Input
                placeholder="e.g. POL-PRIV-001"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Compliance Category
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

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Policy Title *
              </label>
              <Input
                required
                placeholder="e.g. Customer Data Erasure & Retention Limits"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Version
              </label>
              <Input
                placeholder="e.g. 1.0"
                value={formVersion}
                onChange={(e) => setFormVersion(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Policy Rule & Mandated Requirement *
            </label>
            <textarea
              required
              rows={4}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="e.g. Customer data must be deleted within 90 days after agreement termination or request."
              className="w-full rounded-lg border border-slate-800 bg-slate-900/90 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddPolicyOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !formTitle || !formContent}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Policy Rule</span>
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
