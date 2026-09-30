'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Obligation } from '@/types';
import { FileText, Copy, Check, Quote, Tag, UserCheck, Calendar, ShieldCheck, Database, Percent } from 'lucide-react';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  obligation: Obligation | null;
  contractTitle?: string;
}

export function EvidenceModal({
  isOpen,
  onClose,
  obligation,
  contractTitle,
}: EvidenceModalProps) {
  const [copied, setCopied] = useState(false);

  if (!obligation) return null;

  const handleCopy = () => {
    if (obligation.evidenceText) {
      navigator.clipboard.writeText(obligation.evidenceText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const confidencePercent = obligation.confidence
    ? Math.round(obligation.confidence * 100)
    : 90;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Supporting Contract Evidence"
      description={`Exact text snippet and page citation for extracted obligation.`}
      className="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Header Metadata Summary */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              Contract: <strong className="text-slate-200 font-semibold">{contractTitle || 'Contract'}</strong>
            </span>
            <div className="flex items-center gap-2">
              {obligation.clauseNumber && (
                <Badge variant="outline" className="border-indigo-500/40 text-indigo-300 text-[10px]">
                  Clause {obligation.clauseNumber}
                </Badge>
              )}
              {obligation.pageNumber && (
                <Badge variant="secondary" className="text-[10px]">
                  Page {obligation.pageNumber}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-100 leading-snug">
            {obligation.description}
          </p>
        </div>

        {/* Verbatim Evidence Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Quote className="h-3.5 w-3.5 text-indigo-400" />
              Verbatim Contract Snippet
            </span>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="h-7 text-[11px] gap-1 border-slate-800 bg-slate-900 text-slate-300"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 text-slate-400" />
                  <span>Copy Snippet</span>
                </>
              )}
            </Button>
          </div>

          <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 font-mono text-xs text-indigo-200 leading-relaxed whitespace-pre-wrap relative max-h-56 overflow-y-auto">
            <span className="absolute top-2 left-2 text-indigo-500/20 text-3xl select-none">“</span>
            <span className="relative z-10">{obligation.evidenceText || 'No evidence snippet available.'}</span>
          </div>
        </div>

        {/* Extracted Obligation Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-emerald-400" />
              Responsible Party
            </span>
            <span className="font-medium text-slate-200 block truncate">
              {obligation.responsibleParty || 'Unassigned'}
            </span>
          </div>

          <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Calendar className="h-3 w-3 text-amber-400" />
              Deadline / Window
            </span>
            <span className="font-medium text-slate-200 block truncate">
              {obligation.deadlineText || obligation.noticePeriod || 'None specified'}
            </span>
          </div>

          <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Tag className="h-3 w-3 text-sky-400" />
              Compliance Category
            </span>
            <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
              {obligation.category}
            </Badge>
          </div>

          <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-cyan-400" />
              SLA Requirement
            </span>
            <span className="font-medium text-slate-200 block truncate">
              {obligation.slaRequirement || 'N/A'}
            </span>
          </div>

          <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Database className="h-3 w-3 text-purple-400" />
              Data Handling
            </span>
            <span className="font-medium text-slate-200 block truncate">
              {obligation.dataHandlingRequirement || 'N/A'}
            </span>
          </div>

          <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Percent className="h-3 w-3 text-teal-400" />
              AI Confidence
            </span>
            <span className="font-bold text-emerald-400 block">
              {confidencePercent}%
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <Button onClick={onClose} variant="secondary" size="sm">
            Close Evidence
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
