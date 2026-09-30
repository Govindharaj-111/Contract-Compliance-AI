'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Search, Bell, ShieldCheck, User } from 'lucide-react';

const pathTitleMap: Record<string, string> = {
  '/': 'Dashboard Overview',
  '/contracts': 'Contract Ingestion & Storage',
  '/obligations': 'Obligations & SLAs',
  '/deadlines': 'Deadlines & Notice Windows',
  '/conflicts': 'Policy Compliance Conflicts',
  '/policies': 'Internal Corporate Policies',
  '/ai-assistant': 'AI Contract Assistant',
};

export function Header() {
  const pathname = usePathname() || '/';

  const currentTitle = pathTitleMap[pathname] || 'Compliance Intelligence';

  const breadcrumbItems =
    pathname === '/'
      ? [{ label: 'Overview', active: true }]
      : [{ label: currentTitle, active: true }];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/90 px-8 backdrop-blur-md">
      {/* Left: Breadcrumb Context */}
      <div className="flex flex-col gap-0.5">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Right: Search, System Badge, Notifications & Account */}
      <div className="flex items-center gap-4">
        {/* Global Search Shell */}
        <div className="relative hidden md:block w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search contracts, clauses..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* System Engine Status */}
        <Badge variant="outline" className="gap-1.5 border-slate-800 bg-slate-900 text-slate-300">
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
          <span className="hidden sm:inline">PostgreSQL & Architecture Active</span>
        </Badge>

        {/* Notifications Icon Shell */}
        <button
          className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500" />
        </button>

        {/* User Account Avatar Shell */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700">
            <User className="h-4 w-4 text-indigo-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
