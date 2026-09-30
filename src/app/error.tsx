'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void; }) {
  useEffect(() => {
    console.error('Unhandled System Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-rose-900/50 bg-slate-900/90 text-center p-6">
        <CardContent className="space-y-4 pt-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-100">Application Error</h2>
            <p className="text-xs text-slate-400 font-mono">
              {error.message || 'An unexpected error occurred in the compliance system.'}
            </p>
          </div>
          <Button
            onClick={() => reset()}
            variant="outline"
            className="gap-2 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            Retry Action
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
