'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { YearTarget, UserRole } from '@/types';
import EventFormDialog from './components/EventFormDialog';

const mapYearNumberToTarget = (year: number): YearTarget => {
  switch (year) {
    case 1: return 'FIRST';
    case 2: return 'SECOND';
    case 3: return 'THIRD';
    case 4: return 'FOURTH';
    default: return 'ALL';
  }
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Check if current route is a details view (e.g., /hackathons/[id])
  const isDetailPage = !!pathname.match(/^\/(hackathons|contests|sessions|camps)\/[^\/]+$/);

  // Identify active event type from pathname
  const getActiveType = () => {
    if (pathname.startsWith('/contests')) return 'contests';
    if (pathname.startsWith('/sessions')) return 'sessions';
    if (pathname.startsWith('/camps')) return 'camps';
    return 'hackathons'; // default
  };

  const activeType = getActiveType();
  const activeYearTarget = searchParams.get('yearTarget') as YearTarget | null;

  // Initialize query param on mount if not set (skip on detail views)
  useEffect(() => {
    if (isDetailPage) return;
    if (!searchParams.get('yearTarget')) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('yearTarget', 'ALL');
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [searchParams, pathname, router, isDetailPage]);

  const handleTypeChange = (newType: string) => {
    const params = new URLSearchParams(searchParams.toString());
    router.push(`/${newType}?${params.toString()}`);
  };

  const handleYearChange = (newYear: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('yearTarget', newYear);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Determine permissions
  const canCreate = () => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'SENIOR') {
      return activeType === 'contests' || activeType === 'sessions';
    }
    return false;
  };

  const eventTypeOptions = [
    { value: 'contests', label: 'Contests' },
    { value: 'hackathons', label: 'Hackathons' },
    { value: 'sessions', label: 'Sessions' },
    { value: 'camps', label: 'Camps' },
  ];

  const yearOptions = [
    { value: 'ALL', label: 'All Years' },
    { value: 'FIRST', label: 'Year 1' },
    { value: 'SECOND', label: 'Year 2' },
    { value: 'THIRD', label: 'Year 3' },
    { value: 'FOURTH', label: 'Year 4' },
  ];

  if (isDetailPage) {
    return <div className="animate-fade-in">{children}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Events Hub</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Explore and manage contests, hackathons, sessions, and training camps.
          </p>
        </div>

        {/* Dropdowns & Create Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground uppercase">Type:</span>
            <select
              value={activeType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="bg-card border border-border rounded-xl text-xs font-medium px-3 py-1.5 h-9 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary text-foreground cursor-pointer"
            >
              {eventTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground uppercase">Year:</span>
            <select
              value={activeYearTarget || 'ALL'}
              onChange={(e) => handleYearChange(e.target.value)}
              className="bg-card border border-border rounded-xl text-xs font-medium px-3 py-1.5 h-9 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary text-foreground cursor-pointer"
            >
              {yearOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {canCreate() && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 h-9 rounded-xl text-xs px-4 ml-2 hover:scale-[1.02] transition-all"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          )}
        </div>
      </div>

      {/* Main route view content */}
      <div className="min-h-[400px]">
        {children}
      </div>

      {/* Reusable creation modal */}
      {canCreate() && (
        <EventFormDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          type={activeType as 'contests' | 'hackathons' | 'sessions' | 'camps'}
          mode="create"
        />
      )}
    </div>
  );
}
