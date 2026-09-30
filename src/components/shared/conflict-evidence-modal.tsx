'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PolicyConflict } from '@/types';
import {
  FileText,
  ShieldAlert,
  Copy,
  Check,
  Quote,
  Scale,
  AlertOctagon,
  HelpCircle,
  FileCheck,
} from 'lucide-react';

interface ConflictEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: PolicyConflict | null;
  onStatusUpdate?: (conflictId: string, newStatus: string) => void;
}

export function ConflictEvidenceModal({
  isOpen,
  onClose,
  conflict,
  onStatusUpdate,
}: ConflictEvidenceModalProps) {
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedPolicy, setCopiedPolicy] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!conflict) return null;

  const handleCopyContract = () => {
    const text = conflict.contractEvidence || conflict.contractRequirement || '';
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    }
  };

  const handleCopyPolicy = () => {
    const text = conflict.policyEvidence || conflict.policyRequirement || '';
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedPolicy(true);
      setTimeout(() => setCopiedPolicy(false), 2000);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!conflict.id || updating) return;
    try {
      setUpdating(true);
      const res = await fetch(`/api/conflicts/${conflict.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success && onStatusUpdate) {
        onStatusUpdate(conflict.id, newStatus);
      }
    } catch (err) {
      console.error('Failed to update conflict status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[11px] gap-1 px-2.5 py-0.5">
            <AlertOctagon className="h-3 w-3 text-rose-400" />
            CRITICAL SEVERITY
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/40 text-[11px] gap-1 px-2.5 py-0.5">
            <ShieldAlert className="h-3 w-3 text-orange-400" />
            HIGH SEVERITY
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[11px] gap-1 px-2.5 py-0.5">
            <ShieldAlert className="h-3 w-3 text-amber-400" />
            MEDIUM SEVERITY
          </Badge>
        );
      case 'LOW':
      default:
        return (
          <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 text-[11px] gap-1 px-2.5 py-0.5">
            LOW SEVERITY
          </Badge>
        );
    }
  };

  const getStatusBadge = (st: string) => {
    if (st === 'NEEDS_REVIEW') {
      return (
        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[11px] gap-1">
          <HelpCircle className="h-3 w-3 text-purple-400" />
          Needs Review
        </Badge>
      );
    }
    if (st === 'RESOLVED') {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px] gap-1">
          <FileCheck className="h-3 w-3 text-emerald-400" />
          Resolved
        </Badge>
      );
    }
    if (st === 'WAIVED') {
      return (
        <Badge className="bg-slate-700/60 text-slate-300 border-slate-600 text-[11px]">
          Waived
        </Badge>
      );
    }
    return (
      <Badge className="bg-rose-500/10 text-rose-300 border-rose-500/30 text-[11px]">
        Unresolved
      </Badge>
    );
  };

  const confidencePercent = conflict.confidence
    ? Math.round(conflict.confidence * 100)
    : 85;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Contract vs Policy Conflict Evidence"
      description="Side-by-side evidence analysis and explanation of compliance mismatch."
      className="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Header Metadata Bar */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-3 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">
                {conflict.title || 'Policy Conflict Mismatch'}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {getSeverityBadge(conflict.severity)}
              {getStatusBadge(conflict.status)}
              <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 text-[11px]">
                AI Confidence: {confidencePercent}%
              </Badge>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" />
              Detected Conflict & Impact Explanation:
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-medium bg-amber-950/10 border border-amber-500/20 rounded-lg p-3">
              {conflict.description}
            </p>
          </div>
        </div>

        {/* Side-by-Side Evidence Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT: Contract Evidence Box */}
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/10 p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  Contract Requirement & Source
                </span>
                <div className="flex items-center gap-1">
                  {conflict.contractClause && (
                    <Badge variant="outline" className="border-indigo-400/40 text-indigo-300 text-[10px]">
                      Clause {conflict.contractClause}
                    </Badge>
                  )}
                  {conflict.pageNumber && (
                    <Badge variant="secondary" className="text-[10px]">
                      Page {conflict.pageNumber}
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                  Document Title:
                </span>
                <span className="text-xs font-semibold text-slate-200 block truncate">
                  {conflict.contractName || conflict.contract?.title || 'Contract Document'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                  Contract Requirement:
                </span>
                <p className="text-xs font-medium text-slate-100 bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
                  {conflict.contractRequirement || 'No extracted requirement text.'}
                </p>
              </div>

              {/* Verbatim Contract Snippet */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
                    <Quote className="h-3 w-3" />
                    Contract Verbatim Evidence:
                  </span>
                  <Button
                    onClick={handleCopyContract}
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2 border-slate-800 bg-slate-900 text-slate-300"
                  >
                    {copiedContract ? (
                      <>
                        <Check className="h-2.5 w-2.5 text-emerald-400 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-2.5 w-2.5 text-slate-400 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="rounded-lg border border-indigo-500/30 bg-slate-950/80 p-3 font-mono text-[11px] text-indigo-200 leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto">
                  “{conflict.contractEvidence || conflict.contractRequirement}”
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Policy Evidence Box */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-emerald-400" />
                  Internal Policy Rule & Source
                </span>
                <Badge variant="outline" className="border-emerald-400/40 text-emerald-300 text-[10px]">
                  v{conflict.policyVersion || conflict.policy?.version || '1.0'}
                </Badge>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                  Policy Code & Name:
                </span>
                <span className="text-xs font-semibold text-slate-200 block truncate">
                  {conflict.policy?.code || 'POL'} - {conflict.policyName || conflict.policy?.title || 'Corporate Policy'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                  Internal Policy Requirement:
                </span>
                <p className="text-xs font-medium text-slate-100 bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
                  {conflict.policyRequirement || 'No policy requirement text available.'}
                </p>
              </div>

              {/* Verbatim Policy Snippet */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                    <Quote className="h-3 w-3" />
                    Internal Policy Verbatim Evidence:
                  </span>
                  <Button
                    onClick={handleCopyPolicy}
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2 border-slate-800 bg-slate-900 text-slate-300"
                  >
                    {copiedPolicy ? (
                      <>
                        <Check className="h-2.5 w-2.5 text-emerald-400 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-2.5 w-2.5 text-slate-400 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-slate-950/80 p-3 font-mono text-[11px] text-emerald-200 leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto">
                  “{conflict.policyEvidence || conflict.policyRequirement}”
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Update Status:</span>
            <Button
              onClick={() => handleStatusChange('RESOLVED')}
              disabled={updating || conflict.status === 'RESOLVED'}
              size="sm"
              variant="outline"
              className="h-8 text-xs border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-300"
            >
              Mark Resolved
            </Button>
            <Button
              onClick={() => handleStatusChange('WAIVED')}
              disabled={updating || conflict.status === 'WAIVED'}
              size="sm"
              variant="outline"
              className="h-8 text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
            >
              Waive Risk
            </Button>
            <Button
              onClick={() => handleStatusChange('NEEDS_REVIEW')}
              disabled={updating || conflict.status === 'NEEDS_REVIEW'}
              size="sm"
              variant="outline"
              className="h-8 text-xs border-purple-500/40 hover:bg-purple-500/20 text-purple-300"
            >
              Needs Review
            </Button>
          </div>

          <Button onClick={onClose} variant="secondary" size="sm">
            Close Evidence Window
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
