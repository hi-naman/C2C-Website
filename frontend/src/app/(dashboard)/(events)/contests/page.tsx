'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { contestService, ContestApiResponse } from '@/services/contests';
import { YearTarget } from '@/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Trophy, Clock, Lock, Unlock, ExternalLink, Calendar, AlertCircle, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import EventFormDialog from '../components/EventFormDialog';

export default function ContestsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isAdminOrSenior = user?.role === 'ADMIN' || user?.role === 'SENIOR';
  
  const selectedYearTarget = (searchParams.get('yearTarget') as YearTarget) || 'ALL';

  // Unlock Dialog states
  const [unlockContestId, setUnlockContestId] = useState<string | null>(null);
  const [unlockContestTitle, setUnlockContestTitle] = useState<string>('');
  const [accessCode, setAccessCode] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Edit / Delete states
  const [editingContest, setEditingContest] = useState<ContestApiResponse | null>(null);

  const { data: contests, isLoading, error } = useQuery({
    queryKey: ['contests', selectedYearTarget],
    queryFn: () => contestService.getAllContests(selectedYearTarget === 'ALL' ? undefined : selectedYearTarget),
    staleTime: 1000 * 60 * 2, // 2 minutes stale time
  });

  const unlockMutation = useMutation({
    mutationFn: ({ id, code }: { id: string; code: string }) => contestService.unlockContest(id, code),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      setUnlockContestId(null);
      setAccessCode('');
      setUnlockError(null);
      window.open(data.hackerrankUrl, '_blank', 'noopener,noreferrer');
    },
    onError: (err: any) => {
      setUnlockError(err.message || 'Incorrect access code. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contestService.deleteContest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete contest.');
    },
  });

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockContestId || !accessCode.trim()) return;
    setUnlockError(null);
    unlockMutation.mutate({ id: unlockContestId, code: accessCode });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this contest?')) {
      deleteMutation.mutate(id);
    }
  };

  const getContestStatus = (start: string, end: string) => {
    const now = new Date();
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (now < startTime) return 'UPCOMING';
    if (now > endTime) return 'PAST';
    return 'ACTIVE';
  };

  const formatContestDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const canEditOrDelete = (contest: ContestApiResponse) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'SENIOR') {
      return contest.createdBy === user.id;
    }
    return false;
  };

  // Grouping contests
  const activeContests: ContestApiResponse[] = [];
  const upcomingContests: ContestApiResponse[] = [];
  const pastContests: ContestApiResponse[] = [];

  if (contests) {
    contests.forEach((c) => {
      const status = getContestStatus(c.startTime, c.endTime);
      if (status === 'ACTIVE') activeContests.push(c);
      else if (status === 'UPCOMING') upcomingContests.push(c);
      else pastContests.push(c);
    });
  }

  const renderContestCard = (contest: ContestApiResponse) => {
    const status = getContestStatus(contest.startTime, contest.endTime);
    const hasCrud = canEditOrDelete(contest);
    
    return (
      <div
        key={contest.id}
        className="rounded-xl border border-border bg-card p-6 hover:border-foreground/15 hover:scale-[1.02] transition-all duration-200 shadow-sm flex flex-col justify-between"
      >
        <div className="space-y-4">
          {/* Badge Headers */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-mono border border-border bg-muted/40 text-muted-foreground px-2 py-0.5 rounded uppercase tracking-wider">
              {contest.yearTarget} TARGET
            </span>
            
            <div className="flex items-center gap-2">
              <div className={cn(
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono border',
                status === 'ACTIVE' && 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                status === 'UPCOMING' && 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                status === 'PAST' && 'bg-muted text-muted-foreground border-border'
              )}>
                {status === 'ACTIVE' && <FlameDot />}
                <span>{status}</span>
              </div>

              {hasCrud && (
                <div className="flex items-center gap-1 border-l border-border pl-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingContest(contest)}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Edit Contest"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(contest.id)}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    title="Delete Contest"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-foreground line-clamp-1">{contest.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-2 min-h-[32px]">{contest.description}</p>
          </div>

          {/* Times */}
          <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/50 pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>Starts: {formatContestDate(contest.startTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Ends: {formatContestDate(contest.endTime)}</span>
            </div>
            {isAdminOrSenior && contest.accessCode && (
              <div className="flex items-center gap-2 text-xs border-t border-border/30 pt-2 mt-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Code: <span className="font-mono font-bold text-foreground bg-muted border border-border px-1.5 py-0.5 rounded select-all">{contest.accessCode}</span></span>
              </div>
            )}
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="mt-6 pt-4 border-t border-border/50 flex flex-col gap-2">
          {status === 'UPCOMING' && (
            <Button disabled className="w-full bg-muted text-muted-foreground border-border cursor-not-allowed text-xs">
              <Clock className="h-4 w-4 mr-2" />
              Upcoming Challenge
            </Button>
          )}
          
          {status === 'ACTIVE' && contest.isLocked && (
            <Button
              onClick={() => {
                setUnlockContestId(contest.id);
                setUnlockContestTitle(contest.title);
              }}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 text-xs"
            >
              <Lock className="h-4 w-4" />
              Unlock Contest link
            </Button>
          )}

          {status === 'ACTIVE' && !contest.isLocked && contest.hackerrankUrl && (
            <a
              href={contest.hackerrankUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: 'default',
                className: 'w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 text-xs'
              })}
            >
              Solve on HackerRank
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {status === 'PAST' && contest.hackerrankUrl && (
            <a
              href={contest.hackerrankUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: 'outline',
                className: 'w-full border-border bg-card hover:bg-muted flex items-center justify-center gap-2 text-xs'
              })}
            >
              View Past Challenge
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          <Link
            href={`/contests/${contest.id}`}
            className={buttonVariants({
              variant: 'outline',
              className: 'w-full border-border bg-card/45 hover:bg-muted hover:text-foreground flex items-center justify-center gap-2 text-xs h-9 rounded-xl',
            })}
          >
            View details
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {isLoading ? (
        /* Loading Skeletons */
        <div className="space-y-8">
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-border p-6 space-y-4">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="space-y-2 border-t border-border pt-4">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-10 w-full mt-4 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="p-12 text-center text-sm text-destructive bg-destructive/5 font-mono">
          Failed to fetch contests data. Please refresh or try again.
        </div>
      ) : (
        <div className="space-y-12">
          {/* Active section */}
          {activeContests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Active Contests
              </h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activeContests.map(renderContestCard)}
              </div>
            </div>
          )}

          {/* Upcoming section */}
          {upcomingContests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Upcoming Challenges</h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingContests.map(renderContestCard)}
              </div>
            </div>
          )}

          {/* Past section */}
          {pastContests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Past Contests</h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pastContests.map(renderContestCard)}
              </div>
            </div>
          )}

          {activeContests.length === 0 && upcomingContests.length === 0 && pastContests.length === 0 && (
            <div className="text-center p-16 rounded-xl border border-dashed border-border">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 text-base font-semibold text-foreground">No Contests Listed</h3>
              <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
                No contests are registered matching Year {selectedYearTarget} yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Unlock Access Code Dialog */}
      <Dialog open={unlockContestId !== null} onOpenChange={(open) => {
        if (!open) {
          setUnlockContestId(null);
          setAccessCode('');
          setUnlockError(null);
        }
      }}>
        <DialogContent className="max-w-md bg-card border border-border text-foreground rounded-xl">
          <form onSubmit={handleUnlockSubmit}>
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Enter Contest Access Code
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                The contest <strong className="text-foreground">{unlockContestTitle}</strong> requires a secure validation code. Please enter the passcode distributed by seniors to unlock the HackerRank URL.
              </DialogDescription>
            </DialogHeader>

            {unlockError && (
              <div className="my-4 flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{unlockError}</span>
              </div>
            )}

            <div className="my-6">
              <Input
                type="text"
                placeholder="Access Code (e.g. C2C_YEAR1_C01)"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="bg-background border-border focus-visible:ring-primary focus-visible:border-primary text-center font-mono tracking-widest text-base py-6 rounded-xl"
                autoFocus
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setUnlockContestId(null);
                  setAccessCode('');
                  setUnlockError(null);
                }}
                className="text-muted-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={unlockMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
              >
                {unlockMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                    Unlocking...
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4" />
                    Unlock & Open Link
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editing Dialog */}
      {editingContest && (
        <EventFormDialog
          open={editingContest !== null}
          onOpenChange={(open) => {
            if (!open) setEditingContest(null);
          }}
          type="contests"
          mode="edit"
          initialData={editingContest}
        />
      )}
    </div>
  );
}

// Sub-component pulse dot
function FlameDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
    </span>
  );
}
