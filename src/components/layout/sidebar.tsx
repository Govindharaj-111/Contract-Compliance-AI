'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Bot,
  FileSearch,
  Database,
  Layers,
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Contracts', href: '/contracts', icon: FileText },
  { name: 'Obligations', href: '/obligations', icon: CheckSquare },
  { name: 'Deadlines', href: '/deadlines', icon: Clock },
  { name: 'Policy Conflicts', href: '/conflicts', icon: AlertTriangle },
  { name: 'Internal Policies', href: '/policies', icon: ShieldCheck },
  { name: 'AI Assistant', href: '/assistant', icon: Bot },
];


export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-800 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between">
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <FileSearch className="h-5 w-5" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white block leading-tight">
              Compliance AI
            </span>
            <span className="text-[10px] font-mono text-indigo-400 tracking-wide">
              SYSTEM AI-03
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1 px-3 py-4">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Main Navigation
          </div>
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-indigo-400' : 'text-slate-400')} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Database / Foundation Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Database className="h-3.5 w-3.5 text-emerald-400" />
          <span>Prisma & PostgreSQL</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
          <Layers className="h-3 w-3 text-indigo-400" />
          <span>LLM Architecture Ready</span>
        </div>
      </div>
    </aside>
  );
}
