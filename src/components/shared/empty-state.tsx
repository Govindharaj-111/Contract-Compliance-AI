import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  statusText?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  statusText = 'Module initialized and ready for PostgreSQL data ingestion.',
}: EmptyStateProps) {
  return (
    <Card className="border-dashed border-slate-800 bg-slate-900/40 py-12 text-center">
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-slate-800/80 p-4 text-indigo-400 ring-1 ring-slate-700/50">
          <Icon className="h-8 w-8" />
        </div>
        <div className="max-w-md space-y-1.5">
          <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
        <div className="rounded-md bg-slate-950 px-3 py-1.5 border border-slate-800 text-xs font-mono text-slate-500">
          {statusText}
        </div>
        {actionText && (
          <Button variant="outline" size="sm" onClick={onAction} className="mt-2">
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
