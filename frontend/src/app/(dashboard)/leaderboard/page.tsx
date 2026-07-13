'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { leaderboardService } from '@/services/leaderboard';
import { contestService } from '@/services/contests';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Trophy,
  Medal,
  Award,
  Flame,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Users,
  UserCheck,
  UserX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  // Default to the logged-in user's college class year (or Year 1 as fallback)
  const [selectedYearOverride, setSelectedYearOverride] = useState<number | null>(null);
  const selectedYear = selectedYearOverride ?? user?.year ?? 1;

  // Sync Modal States
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [selectedContestId, setSelectedContestId] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{
    totalFetched: number;
    matched: number;
    unmatchedCount: number;
    unmatched: string[];
  } | null>(null);

  const { data: entries, isLoading, error } = useQuery({
    queryKey: ['leaderboard', selectedYear],
    queryFn: () => leaderboardService.getLeaderboard(selectedYear),
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });

  // Query contests to populate the dropdown
  const { data: contests, isLoading: isLoadingContests } = useQuery({
    queryKey: ['contests', 'all'],
    queryFn: () => contestService.getAllContests(),
    enabled: isAdmin && isSyncOpen,
  });

  const syncMutation = useMutation({
    mutationFn: ({ contestId, data }: { contestId: string; data: any }) =>
      leaderboardService.syncLeaderboard(contestId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      setSyncResult(data);
      setValidationError(null);
    },
    onError: (err: any) => {
      setValidationError(err.message || 'Failed to sync leaderboard. Please check the JSON format.');
    },
  });

  const handleOpenSync = () => {
    setSelectedContestId('');
    setJsonInput('');
    setValidationError(null);
    setSyncResult(null);
    setIsSyncOpen(true);
  };

  const handleSyncSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContestId) {
      setValidationError('Please select a contest.');
      return;
    }
    if (!jsonInput.trim()) {
      setValidationError('Please paste the HackerRank leaderboard JSON.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Pasted content is not a valid JSON object.');
      }
      if (!parsed.models || !Array.isArray(parsed.models)) {
        throw new Error('Pasted JSON must contain a "models" array.');
      }
      setValidationError(null);
      syncMutation.mutate({ contestId: selectedContestId, data: parsed });
    } catch (err: any) {
      setValidationError(err.message || 'Invalid JSON format. Please verify the copied text.');
    }
  };

  const years = [1, 2, 3, 4];

  // Helper to render rank icons/badges
  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
          <Trophy className="h-4 w-4" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-400/20 text-zinc-300 border border-zinc-400/30">
          <Medal className="h-4 w-4" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/30">
          <Award className="h-4 w-4" />
        </div>
      );
    }
    return (
      <span className="font-mono text-xs font-semibold text-muted-foreground w-7 text-center">
        #{rank}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Leaderboards</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Browse cumulative competitive programming scores synced across local contests.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-3 self-start">
          {isAdmin && (
            <Button
              onClick={handleOpenSync}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-medium px-4 py-1.5 h-8 gap-2 border border-border hover:bg-muted hover:scale-[1.02] transition-transform duration-200"
            >
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
              Sync Leaderboard
            </Button>
          )}

          {/* Year Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border">
            {years.map((year) => (
              <Button
                key={year}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedYearOverride(year)}
                className={cn(
                  'rounded-lg text-xs font-medium px-4 py-1.5 h-8 transition-all',
                  selectedYear === year
                    ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                Year {year}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          /* Loading skeleton */
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="flex items-center justify-between p-4 sm:px-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-6 w-12 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-sm text-destructive bg-destructive/5 font-mono">
            Failed to load leaderboard data. Please try again.
          </div>
        ) : !entries || entries.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Flame className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <h3 className="text-base font-semibold text-foreground">No Rank Standings</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              There are no scores synced for Year {selectedYear} yet. Once the initial contest ends, rankings will populate here.
            </p>
          </div>
        ) : (
          /* Ranked List */
          <div className="divide-y divide-border">
            {/* Header row */}
            <div className="hidden sm:flex items-center justify-between p-4 px-6 text-xs font-mono uppercase tracking-wider text-muted-foreground bg-muted/20">
              <div className="flex items-center gap-4">
                <span className="w-7 text-center">Rank</span>
                <span>Developer Profile</span>
              </div>
              <span>HackerRank Username</span>
              <span>Cumulative Score</span>
            </div>

            {/* User rows */}
            {entries.map((entry) => (
              <div
                key={entry.userId}
                className={cn(
                  'flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 gap-3 transition-colors hover:bg-muted/10',
                  entry.userId === user?.id && 'bg-primary/5 border-y border-primary/10'
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="shrink-0 flex items-center justify-center">
                    {renderRankBadge(entry.rank)}
                  </div>
                  {entry.user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.user.avatarUrl}
                      alt={entry.user.name}
                      className="h-8 w-8 rounded-full border border-border shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-xs shrink-0">
                      {entry.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex flex-col">
                    <span className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                      {entry.user.name}
                      {entry.userId === user?.id && (
                        <span className="text-[10px] font-mono font-normal bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono sm:hidden truncate mt-0.5">
                      {entry.user.hackerrankUsername || 'No Username'}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:block text-xs font-mono text-muted-foreground truncate">
                  {entry.user.hackerrankUsername || '-'}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 text-right">
                  <span className="sm:hidden text-xs text-muted-foreground font-mono">Score:</span>
                  <span className="text-sm font-bold text-foreground font-mono">
                    {entry.totalScore.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sync Leaderboard Dialog */}
      {isAdmin && (
        <Dialog open={isSyncOpen} onOpenChange={setIsSyncOpen}>
          <DialogContent className="sm:max-w-lg bg-card border border-border text-foreground rounded-2xl shadow-2xl p-0 gap-0 overflow-hidden outline-none">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border/80 bg-card">
              <DialogHeader className="space-y-1.5">
                <DialogTitle className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-primary animate-pulse" />
                  {syncResult ? 'Sync Results' : 'Sync Leaderboard'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {syncResult
                    ? 'Summary of the leaderboard synchronization outcome.'
                    : 'Paste the HackerRank leaderboard REST JSON response to import scores.'}
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Content & Form */}
            {!syncResult ? (
              <form onSubmit={handleSyncSubmit} className="flex flex-col">
                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                  {validationError && (
                    <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {/* Contest Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">
                      Target Contest
                    </label>
                    {isLoadingContests ? (
                      <Skeleton className="h-10 w-full rounded-xl" />
                    ) : contests && contests.length > 0 ? (
                      <select
                        value={selectedContestId}
                        onChange={(e) => setSelectedContestId(e.target.value)}
                        required
                        className="w-full bg-background border border-border rounded-xl text-xs font-medium px-3 py-2.5 h-10 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary text-foreground cursor-pointer"
                      >
                        <option value="">Choose a contest to update...</option>
                        {contests.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} ({c.yearTarget} Target)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-xs text-muted-foreground rounded-xl border border-border p-3 bg-muted/10">
                        No contests found. Please create a contest first.
                      </div>
                    )}
                  </div>

                  {/* JSON Paste Area */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">
                      Leaderboard JSON
                    </label>
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder='Paste the HackerRank leaderboard REST endpoint JSON (containing the "models" array)...'
                      required
                      className="flex h-48 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-mono transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary overflow-y-auto resize-none p-3 text-foreground"
                    />
                  </div>
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-4 border-t border-border/80 bg-card/50 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsSyncOpen(false)}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground h-9 px-4 rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={syncMutation.isPending || !selectedContestId}
                    className="bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2 h-9 px-5 rounded-xl text-xs hover:scale-[1.02] transition-all duration-200"
                  >
                    {syncMutation.isPending ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      'Sync Scores'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="flex flex-col">
                <div className="p-6 space-y-6">
                  {/* Success Banner */}
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-500">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Scores successfully imported. Invalidation complete.</span>
                  </div>

                  {/* Stat Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/40 border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
                      <Users className="h-4 w-4 text-muted-foreground mb-1" />
                      <span className="text-lg font-bold text-foreground font-mono">
                        {syncResult.totalFetched}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">Total Fetched</span>
                    </div>

                    <div className="bg-muted/40 border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
                      <UserCheck className="h-4 w-4 text-emerald-500 mb-1" />
                      <span className="text-lg font-bold text-foreground font-mono">
                        {syncResult.matched}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">Matched</span>
                    </div>

                    <div className="bg-muted/40 border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
                      <UserX className="h-4 w-4 text-amber-500 mb-1" />
                      <span className="text-lg font-bold text-foreground font-mono">
                        {syncResult.unmatchedCount}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">Unmatched</span>
                    </div>
                  </div>

                  {/* Unmatched Users List */}
                  {syncResult.unmatchedCount > 0 && (
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-xs font-semibold text-foreground">
                          Unmatched Usernames ({syncResult.unmatchedCount})
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          These HackerRank profiles are not associated with any registered system users.
                        </p>
                      </div>
                      <div className="max-h-28 overflow-y-auto rounded-xl border border-border bg-muted/20 p-3 font-mono text-[10px] text-muted-foreground gap-1.5 flex flex-wrap custom-scrollbar">
                        {syncResult.unmatched.map((username, idx) => (
                          <span
                            key={idx}
                            className="bg-background border border-border/80 rounded px-2 py-0.5"
                          >
                            {username}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-4 border-t border-border/80 bg-card/50 flex items-center justify-end">
                  <Button
                    onClick={() => setIsSyncOpen(false)}
                    className="bg-primary text-primary-foreground hover:bg-primary/95 h-9 px-5 rounded-xl text-xs hover:scale-[1.02] transition-transform duration-200"
                  >
                    Done
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
