'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { leaderboardService } from '@/services/leaderboard';
import { calendarService, CalendarEventResponse } from '@/services/calendar';
import { contestService, ContestApiResponse } from '@/services/contests';
import { forumService } from '@/services/forum';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Trophy,
  Medal,
  Award,
  Code,
  Calendar,
  ChevronRight,
  BookOpen,
  Layers,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  Flame,
  ArrowRight,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

const getRelativeTime = (dateStr: string) => {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) return 'Now';

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 1) return `in ${diffDays} days`;
  if (diffDays === 1) return 'Tomorrow';
  if (diffHours >= 1) return `in ${diffHours}h`;
  return `in ${diffMins}m`;
};

const formatEventDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const getEventBadge = (type: 'SESSION' | 'CONTEST' | 'CAMP' | 'HACKATHON') => {
  switch (type) {
    case 'SESSION':
      return {
        icon: BookOpen,
        colorClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        label: 'Session',
      };
    case 'CONTEST':
      return {
        icon: Award,
        colorClass: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        label: 'Contest',
      };
    case 'CAMP':
      return {
        icon: Sparkles,
        colorClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        label: 'Camp',
      };
    case 'HACKATHON':
      return {
        icon: Layers,
        colorClass: 'bg-primary/10 text-primary border-primary/20',
        label: 'Hackathon',
      };
  }
};

const getEventDetailPath = (event: CalendarEventResponse) => {
  switch (event.type) {
    case 'CONTEST':
      return `/contests/${event.id}`;
    case 'HACKATHON':
      return `/hackathons/${event.id}`;
    case 'SESSION':
      return `/sessions/${event.id}`;
    case 'CAMP':
      return `/camps/${event.id}`;
  }
};

const getContestStatus = (start: string, end: string) => {
  const now = new Date();
  if (now < new Date(start)) return 'UPCOMING';
  if (now > new Date(end)) return 'PAST';
  return 'ACTIVE';
};

const renderLeaderboardRankBadge = (rank: number) => {
  if (rank === 1) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
        <Trophy className="h-3.5 w-3.5" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-400/20 text-zinc-300 border border-zinc-400/30">
        <Medal className="h-3.5 w-3.5" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/30">
        <Award className="h-3.5 w-3.5" />
      </div>
    );
  }
  return (
    <span className="font-mono text-xs font-semibold text-muted-foreground w-7 text-center">
      #{rank}
    </span>
  );
};

const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();

  // ── Data Fetching ──

  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ['leaderboard', user?.year],
    queryFn: () => leaderboardService.getLeaderboard(user?.year ?? 1),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: calendarEvents, isLoading: isLoadingCalendar } = useQuery({
    queryKey: ['calendar', user?.year],
    queryFn: () => calendarService.getEvents(user?.year),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: contests, isLoading: isLoadingContests } = useQuery({
    queryKey: ['contests', 'all'],
    queryFn: () => contestService.getAllContests(),
    staleTime: 1000 * 60 * 2,
  });

  const { data: forumPosts, isLoading: isLoadingForum } = useQuery({
    queryKey: ['forum-posts'],
    queryFn: () => forumService.getAllPosts(),
    staleTime: 1000 * 30,
  });

  // ── Derived Data ──

  // Find user's leaderboard entry
  const userLeaderboardEntry = leaderboard?.find(
    (entry) => entry.userId === user?.id
  );
  const totalParticipants = leaderboard?.length ?? 0;

  // Filter upcoming events (future only, sorted, top 5)
  const now = new Date();
  const upcomingEvents = calendarEvents
    ? calendarEvents
        .filter((e) => new Date(e.date).getTime() > now.getTime())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5)
    : [];

  // Active contests (between startTime and endTime)
  const activeContests = contests
    ? contests.filter(
        (c) => getContestStatus(c.startTime, c.endTime) === 'ACTIVE'
      )
    : [];

  // Trending forum posts (sorted by upvotes, top 3)
  const trendingPosts = forumPosts
    ? [...forumPosts]
        .sort((a, b) => b.upvoteCount - a.upvoteCount)
        .slice(0, 3)
    : [];

  // Leaderboard top 5
  const topFive = leaderboard ? leaderboard.slice(0, 5) : [];

  // Today's date display
  const todayLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="relative space-y-8 animate-fade-in">
      {/* ── Section 1: Welcome Header ── */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {user?.name}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{todayLabel}</p>
      </div>

      {/* ── Section 2: KPI Metric Cards ── */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Leaderboard Rank Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs transition-all duration-200 hover:scale-[1.02] hover:border-foreground/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
              Leaderboard Rank
            </span>
            <Trophy className="h-4 w-4 text-brand-accent" />
          </div>
          {isLoadingLeaderboard ? (
            <div className="mt-2.5 space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          ) : userLeaderboardEntry ? (
            <>
              <p className="mt-2.5 text-3xl font-bold text-foreground">
                #{userLeaderboardEntry.rank}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Score {userLeaderboardEntry.totalScore.toLocaleString()} ·{' '}
                {totalParticipants} participants in Year {user?.year}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2.5 text-3xl font-bold text-muted-foreground/50">
                Unranked
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Complete a contest to appear on the leaderboard
              </p>
            </>
          )}
        </div>

        {/* HackerRank Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs transition-all duration-200 hover:scale-[1.02] hover:border-foreground/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
              HackerRank
            </span>
            <Code className="h-4 w-4 text-brand-accent" />
          </div>
          <p className="mt-2.5 text-lg font-semibold truncate text-foreground">
            {user?.hackerrankUsername || 'Not connected'}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {user?.hackerrankUsername
              ? 'Connected account username'
              : 'Link your account in profile settings'}
          </p>
        </div>
      </div>

      {/* ── Section 3: Main Content Grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column — Upcoming Events Timeline */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-foreground">
              Upcoming Events
            </h3>
            <Link
              href="/calendar"
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View calendar
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {isLoadingCalendar ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 px-6">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Calendar className="mx-auto h-10 w-10 text-muted-foreground/25" />
              <h4 className="text-sm font-semibold text-foreground">
                No upcoming events
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                There are no events scheduled for your year. Check back soon or
                browse the full calendar.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {upcomingEvents.map((event) => {
                const badge = getEventBadge(event.type);
                const BadgeIcon = badge.icon;
                const detailPath = getEventDetailPath(event);

                return (
                  <Link
                    key={event.id}
                    href={detailPath}
                    className="flex items-center gap-4 p-4 px-6 hover:bg-muted/10 transition-colors group"
                  >
                    {/* Date badge */}
                    <div className="flex flex-col items-center justify-center h-11 w-11 shrink-0 rounded-xl bg-muted border border-border font-mono leading-none">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">
                        {new Date(event.date)
                          .toLocaleString('en-US', { month: 'short' })
                          .toUpperCase()}
                      </span>
                      <span className="text-base font-extrabold text-foreground mt-0.5">
                        {new Date(event.date).getDate()}
                      </span>
                    </div>

                    {/* Event info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border',
                            badge.colorClass
                          )}
                        >
                          <BadgeIcon className="h-2.5 w-2.5" />
                          {badge.label}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-foreground truncate mt-1 group-hover:text-primary transition-colors">
                        {event.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {formatEventDate(event.date)}
                      </p>
                    </div>

                    {/* Relative time */}
                    <div className="shrink-0 text-right">
                      <span className="text-[10px] font-mono font-semibold text-primary">
                        {getRelativeTime(event.date)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column — Stacked Sidebar Widgets */}
        <div className="space-y-6">
          {/* Widget 1: Active Contests */}
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
              <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-foreground flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Live Contests
              </h3>
              <Link
                href="/contests"
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                All
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {isLoadingContests ? (
              <div className="p-4 space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : activeContests.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <Flame className="mx-auto h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground">
                  No active contests right now
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {activeContests.slice(0, 3).map((contest) => (
                  <Link
                    key={contest.id}
                    href={`/contests/${contest.id}`}
                    className="flex items-center justify-between p-4 px-5 hover:bg-muted/10 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {contest.title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {contest.yearTarget} target
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Widget 2: Trending Discussions */}
          <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
              <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-foreground">
                Trending Discussions
              </h3>
              <Link
                href="/forum"
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                All
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {isLoadingForum ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                ))}
              </div>
            ) : trendingPosts.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground">
                  No discussions yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {trendingPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/forum/${post.id}`}
                    className="block p-4 px-5 hover:bg-muted/10 transition-colors group"
                  >
                    <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {post.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-1">
                      {stripHtml(post.content)}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {post.upvoteCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post._count?.comments ?? 0}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 4: Leaderboard Preview ── */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-foreground">
            Top Performers — Year {user?.year}
          </h3>
          <Link
            href="/leaderboard"
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Full leaderboard
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoadingLeaderboard ? (
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 px-6"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-5 w-12 rounded" />
              </div>
            ))}
          </div>
        ) : topFive.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Trophy className="mx-auto h-10 w-10 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground">
              No leaderboard data for Year {user?.year} yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {topFive.map((entry) => (
              <div
                key={entry.userId}
                className={cn(
                  'flex items-center justify-between p-3.5 px-6 transition-colors hover:bg-muted/10',
                  entry.userId === user?.id &&
                    'bg-primary/5 border-y border-primary/10'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 flex items-center justify-center">
                    {renderLeaderboardRankBadge(entry.rank)}
                  </div>
                  {entry.user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.user.avatarUrl}
                      alt={entry.user.name}
                      className="h-7 w-7 rounded-full border border-border shrink-0"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-[10px] shrink-0">
                      {entry.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                    {entry.user.name}
                    {entry.userId === user?.id && (
                      <span className="text-[9px] font-mono font-normal bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-sm font-bold text-foreground font-mono shrink-0">
                  {entry.totalScore.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
