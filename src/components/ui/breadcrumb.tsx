import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1.5 text-xs text-slate-400', className)}
    >
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-slate-200 transition-colors"
      >
        <Home className="h-3.5 w-3.5 text-slate-400" />
        <span className="sr-only">Dashboard</span>
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
          {item.href && !item.active ? (
            <Link
              href={item.href}
              className="hover:text-slate-200 transition-colors font-medium text-slate-400"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-slate-200" aria-current="page">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
