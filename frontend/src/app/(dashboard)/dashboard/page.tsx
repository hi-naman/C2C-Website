'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { LayoutDashboard, Award, Code, MessageSquare, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="relative space-y-8 animate-fade-in">
      {/* Welcome banner */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {user?.name}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Here is a quick snapshot of your developer credentials and system statistics.
        </p>
      </div>

      {/* Dashboard Quick Status Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs transition-all duration-200 hover:scale-[1.02] hover:border-foreground/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Class Year</span>
            <Calendar className="h-4 w-4 text-brand-accent" />
          </div>
          <p className="mt-2.5 text-3xl font-bold text-foreground">Year {user?.year}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">Derived from email</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-xs transition-all duration-200 hover:scale-[1.02] hover:border-foreground/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">HackerRank</span>
            <Code className="h-4 w-4 text-brand-accent" />
          </div>
          <p className="mt-2.5 text-lg font-semibold truncate text-foreground">{user?.hackerrankUsername || 'Not connected'}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">Connected account username</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-xs transition-all duration-200 hover:scale-[1.02] hover:border-foreground/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">System Role</span>
            <Award className="h-4 w-4 text-brand-accent" />
          </div>
          <p className="mt-2.5 text-3xl font-bold text-foreground">{user?.role}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">Access level permissions</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-xs transition-all duration-200 hover:scale-[1.02] hover:border-foreground/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Profile Status</span>
            <LayoutDashboard className="h-4 w-4 text-brand-accent" />
          </div>
          <p className="mt-2.5 text-3xl font-bold text-foreground">
            {user?.isProfileComplete ? 'Complete' : 'Incomplete'}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {user?.isProfileComplete ? 'All features unlocked' : 'Setup profile details'}
          </p>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
          <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <h3 className="text-base font-semibold text-foreground">Dashboard Feed</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            No recent platform updates or activity announcements. Stay tuned for upcoming hackathon evaluations and synced coding contests.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h4 className="text-xs font-semibold text-foreground font-mono uppercase tracking-wider">Useful Resources</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <a
                href="http://localhost:5000/api/docs"
                target="_blank"
                rel="noreferrer"
                className="text-brand-accent hover:underline font-medium block"
              >
                Swagger API reference &rarr;
              </a>
              <span className="text-xs text-muted-foreground">Browse all endpoints and request schemas.</span>
            </li>
            <li className="border-t border-border pt-3">
              <a
                href="https://hackerrank.com"
                target="_blank"
                rel="noreferrer"
                className="text-brand-accent hover:underline font-medium block"
              >
                HackerRank Platform &rarr;
              </a>
              <span className="text-xs text-muted-foreground">Prepare coding challenges for contests.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
