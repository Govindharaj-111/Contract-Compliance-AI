import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-slate-800 bg-slate-900/90 text-center p-6">
        <CardContent className="space-y-4 pt-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
            <FileQuestion className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-100">404 - Page Not Found</h2>
            <p className="text-xs text-slate-400">
              The requested contract compliance view does not exist.
            </p>
          </div>
          <Link href="/">
            <Button variant="default" className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white">
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
