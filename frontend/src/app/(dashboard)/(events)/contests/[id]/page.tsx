'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { contestService } from '@/services/contests';
import { leaderboardService } from '@/services/leaderboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Trophy,
  Calendar,
  Clock,
  Lock,
  Unlock,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Pencil,
  Trash2,
  RefreshCw,
  Terminal,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import EventFormDialog from '../../components/EventFormDialog';

export default function ContestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<'details' | 'admin'>('details');
  const [accessCode, setAccessCode] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] = useState<string | null>(null);

  // Admin Leaderboard Sync states
  const [jsonInput, setJsonInput] = useState('');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<any | null>(null);

  // Edit / Delete states
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: contest, isLoading, error } = useQuery({
    queryKey: ['contest', id],
    queryFn: () => contestService.getContestById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 mins cache
  });

  const unlockMutation = useMutation({
    mutationFn: (code: string) => contestService.unlockContest(id, code),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contest', id] });
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      setUnlockSuccess('Contest unlocked successfully!');
      setUnlockError(null);
      setAccessCode('');
      // Open HackerRank in new tab
      window.open(data.hackerrankUrl, '_blank', 'noopener,noreferrer');
    },
    onError: (err: any) => {
      setUnlockError(err.message || 'Incorrect access code. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => contestService.deleteContest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      router.push('/contests');
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete contest.');
    },
  });

  const syncMutation = useMutation({
    mutationFn: (data: any) => leaderboardService.syncLeaderboard(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      setSyncResult(data);
      setSyncSuccess('Leaderboard synced successfully!');
      setSyncError(null);
      setJsonInput('');
    },
    onError: (err: any) => {
      setSyncError(err.message || 'Failed to sync leaderboard. Check JSON format.');
    },
  });

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;
    setUnlockError(null);
    setUnlockSuccess(null);
    unlockMutation.mutate(accessCode.trim());
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this contest?')) {
      deleteMutation.mutate();
    }
  };

  const handleSyncSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonInput.trim()) {
      setSyncError('Please paste HackerRank leaderboard JSON.');
      return;
    }
    setSyncError(null);
    setSyncSuccess(null);
    setSyncResult(null);

    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Pasted content is not a valid JSON object.');
      }
      if (!parsed.models || !Array.isArray(parsed.models)) {
        throw new Error('Pasted JSON must contain a "models" array.');
      }
      syncMutation.mutate(parsed);
    } catch (err: any) {
      setSyncError(err.message || 'Invalid JSON format. Check format.');
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
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Button
          onClick={() => router.push('/contests')}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-8 gap-1.5 pl-2 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Events
        </Button>
        <div className="p-12 text-center text-sm text-destructive bg-destructive/5 font-mono">
          Failed to fetch contest details. Please return and try again.
        </div>
      </div>
    );
  }

  const isAdminOrSenior = user?.role === 'ADMIN' || user?.role === 'SENIOR';
  const status = getContestStatus(contest.startTime, contest.endTime);
  const canEditOrDelete = user?.role === 'ADMIN' || (user?.role === 'SENIOR' && contest.createdBy === user.id);

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Back navigation & Title */}
      <div className="space-y-4">
        <Button
          onClick={() => router.push('/contests')}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-8 gap-1.5 pl-2 pr-3 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Events
        </Button>

        <div className="flex flex-col gap-4 border-b border-border/40 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{contest.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Synchronized HackerRank competitive coding challenge details.
            </p>
          </div>

          {/* Navigation tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border self-start shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('details')}
              className={cn(
                'rounded-lg text-xs font-semibold px-4 h-8 transition-all',
                activeTab === 'details'
                  ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              Details
            </Button>

            {isAdminOrSenior && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('admin')}
                className={cn(
                  'rounded-lg text-xs font-semibold px-4 h-8 transition-all',
                  activeTab === 'admin'
                    ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                Sync Leaderboard
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Panels */}
      {activeTab === 'details' && (
        <div className="grid gap-6 md:grid-cols-3 items-start">
          {/* Main info blocks (Left 2 columns) */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-3">
                <Terminal className="h-4 w-4 text-primary" />
                Challenge Description
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {contest.description}
              </p>
            </div>

            {/* Access Code verification if gated and active */}
            {status === 'ACTIVE' && contest.isLocked && (
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-3">
                  <Lock className="h-4 w-4 text-primary" />
                  Gated Access Link
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This challenge is password-protected. Input the access key distributed by seniors to reveal the HackerRank link.
                </p>

                {unlockError && (
                  <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{unlockError}</span>
                  </div>
                )}

                {unlockSuccess && (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-500">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{unlockSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleUnlockSubmit} className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="Enter Access Code"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="bg-background border-border focus-visible:ring-primary rounded-xl font-mono text-sm max-w-sm"
                  />
                  <Button
                    type="submit"
                    disabled={unlockMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs rounded-xl h-10 px-5"
                  >
                    {unlockMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Unlock link'
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* Resolved Link status */}
            {status === 'ACTIVE' && !contest.isLocked && contest.hackerrankUrl && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                    <Unlock className="h-4 w-4" />
                    Contest Unlocked
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click the button to access the official programming challenges on HackerRank.
                  </p>
                </div>
                <a
                  href={contest.hackerrankUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs px-5 h-10 flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0 font-medium transition-colors"
                >
                  Solve on HackerRank
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

            {status === 'PAST' && contest.hackerrankUrl && (
              <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">Contest Archive</p>
                  <p className="text-xs text-muted-foreground">
                    This contest has ended. You can still solve the challenges in sandbox mode.
                  </p>
                </div>
                <a
                  href={contest.hackerrankUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-border bg-card hover:bg-muted text-foreground rounded-xl text-xs px-5 h-10 flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0 font-medium transition-colors"
                >
                  View Archive
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>

          {/* Timing details sidebar (Right 1 column) */}
          <div className="space-y-6">
            {/* Action buttons (Edit/Delete) for admins */}
            {canEditOrDelete && (
              <div className="rounded-2xl border border-border bg-card p-6 space-y-3.5">
                <h4 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider">
                  Admin Panel Actions
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setIsEditOpen(true)}
                    variant="outline"
                    className="border-border bg-card hover:bg-muted text-foreground rounded-xl text-xs gap-1.5 h-10"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    Edit
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    variant="ghost"
                    className="border border-transparent hover:border-destructive/20 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl text-xs gap-1.5 h-10"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Schedule details */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider border-b border-border/40 pb-2">
                Event Details
              </h3>
              <div className="space-y-4 text-xs font-mono">
                <div className="flex gap-3">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground block">Target Audience</span>
                    <span className="text-muted-foreground mt-0.5 block">{contest.yearTarget} Target</span>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-border/40 pt-4">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground block">Start Time</span>
                    <span className="text-muted-foreground mt-0.5 block">{formatContestDate(contest.startTime)}</span>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-border/40 pt-4">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground block">End Time</span>
                    <span className="text-muted-foreground mt-0.5 block">{formatContestDate(contest.endTime)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event status widget */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3.5 text-xs font-mono">
              <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider border-b border-border/40 pb-2">
                Status
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Timing State:</span>
                <span className={cn(
                  'font-bold border px-2 py-0.5 rounded-full text-[10px]',
                  status === 'ACTIVE' && 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                  status === 'UPCOMING' && 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                  status === 'PAST' && 'bg-muted text-muted-foreground border-border'
                )}>
                  {status}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-border/40 pt-2">
                <span className="text-muted-foreground">Access Type:</span>
                <span className="font-bold text-foreground">
                  {contest.accessCode ? 'Gated Passcode' : 'Public'}
                </span>
              </div>
              {contest.creator && (
                <div className="flex justify-between items-center border-t border-border/40 pt-2">
                  <span className="text-muted-foreground">Created By:</span>
                  <span className="font-semibold text-foreground">{contest.creator.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel tab: Leaderboard Sync */}
      {activeTab === 'admin' && isAdminOrSenior && (
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 max-w-3xl">
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
              <RefreshCw className="h-4.5 w-4.5 text-primary" />
              Sync Leaderboard Scores
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Synchronize coding scores for this contest. Paste the HackerRank leaderboard REST endpoint JSON.
            </p>
          </div>

          {syncError && (
            <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{syncError}</span>
            </div>
          )}

          {syncSuccess && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-500">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{syncSuccess}</span>
            </div>
          )}

          {syncResult && (
            <div className="grid grid-cols-3 gap-4 border border-border/60 bg-muted/20 p-4 rounded-xl text-center text-xs font-mono text-muted-foreground">
              <div>
                <p className="text-lg font-bold text-foreground">{syncResult.totalFetched}</p>
                <p className="text-[9px] uppercase mt-1">Fetched</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-500">{syncResult.matched}</p>
                <p className="text-[9px] uppercase mt-1">Matched Devs</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-500">{syncResult.unmatchedCount}</p>
                <p className="text-[9px] uppercase mt-1">Unmatched Users</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSyncSubmit} className="space-y-4">
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Paste the HackerRank leaderboard JSON response (must contain a "models" array)...'
              required
              className="flex h-48 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-mono transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary resize-none p-3 text-foreground"
            />
            <Button
              type="submit"
              disabled={syncMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs rounded-xl h-10 px-5"
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Syncing scores...
                </>
              ) : (
                'Import scores'
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Editing event modal */}
      {isEditOpen && (
        <EventFormDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          type="contests"
          mode="edit"
          initialData={contest}
        />
      )}
    </div>
  );
}
