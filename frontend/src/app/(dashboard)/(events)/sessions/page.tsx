'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { sessionService, SessionApiResponse } from '@/services/sessions';
import { YearTarget } from '@/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, User, Video, ExternalLink, Presentation, Pencil, Trash2, HelpCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import EventFormDialog from '../components/EventFormDialog';

export default function SessionsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const selectedYearTarget = (searchParams.get('yearTarget') as YearTarget) || 'ALL';

  // Edit / Delete states
  const [editingSession, setEditingSession] = useState<SessionApiResponse | null>(null);

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions', selectedYearTarget],
    queryFn: () => sessionService.getAllSessions(selectedYearTarget === 'ALL' ? undefined : selectedYearTarget),
    staleTime: 1000 * 60 * 2, // 2 minutes stale time
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sessionService.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete session.');
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatSessionDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isUpcoming = (dateStr: string) => {
    return new Date() < new Date(dateStr);
  };

  const canEditOrDelete = (session: SessionApiResponse) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'SENIOR') {
      return session.createdBy === user.id;
    }
    return false;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {isLoading ? (
        /* Loading Skeletons */
        <div className="grid gap-6 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border p-6 space-y-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="space-y-2 border-t border-border pt-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-12 text-center text-sm text-destructive bg-destructive/5 font-mono">
          Failed to fetch sessions data. Please refresh or try again.
        </div>
      ) : !sessions || sessions.length === 0 ? (
        <div className="text-center p-16 rounded-xl border border-dashed border-border">
          <Presentation className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-base font-semibold text-foreground">No Sessions Scheduled</h3>
          <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
            No training sessions or speaker panels are scheduled for Year {selectedYearTarget} yet.
          </p>
        </div>
      ) : (
        /* Sessions catalog list */
        <div className="grid gap-6 sm:grid-cols-2">
          {sessions.map((session) => {
            const hasCrud = canEditOrDelete(session);
            const active = isUpcoming(session.date);

            return (
              <div
                key={session.id}
                className="rounded-xl border border-border bg-card p-6 hover:border-foreground/15 hover:scale-[1.02] transition-all duration-200 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Badge Headers */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-mono border border-border bg-muted/40 text-muted-foreground px-2 py-0.5 rounded uppercase tracking-wider">
                      {session.yearTarget} TARGET
                    </span>

                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-[10px] font-mono border px-2 py-0.5 rounded-full',
                        active 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : 'bg-muted text-muted-foreground border-border'
                      )}>
                        {active ? 'UPCOMING' : 'COMPLETED'}
                      </span>

                      {hasCrud && (
                        <div className="flex items-center gap-1 border-l border-border pl-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingSession(session)}
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            title="Edit Session"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(session.id)}
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            title="Delete Session"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground line-clamp-1">{session.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-3 mt-2 min-h-[48px]">{session.description}</p>
                  </div>

                  {/* Speaker Details */}
                  <div className="bg-muted/30 border border-border/40 p-3 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <User className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{session.speakerName}</span>
                    </div>
                    {session.speakerBio && (
                      <p className="text-[10px] text-muted-foreground pl-5 line-clamp-1">{session.speakerBio}</p>
                    )}
                  </div>

                  {/* Date & Location */}
                  <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/50 pt-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatSessionDate(session.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>{session.venue}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-border/50 flex flex-col gap-2">
                  {(session.slidesUrl || session.recordingUrl) && (
                    <div className="flex gap-3 w-full">
                      {session.slidesUrl && (
                        <a
                          href={session.slidesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center border border-border bg-card hover:bg-muted text-foreground py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all h-9"
                        >
                          <Presentation className="h-3.5 w-3.5 text-primary" />
                          Slide Deck
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                      )}
                      {session.recordingUrl && (
                        <a
                          href={session.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center border border-border bg-card hover:bg-muted text-foreground py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all h-9"
                        >
                          <Video className="h-3.5 w-3.5 text-primary" />
                          Recording
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                      )}
                    </div>
                  )}

                  <Link
                    href={`/sessions/${session.id}`}
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
          })}
        </div>
      )}

      {/* Editing Dialog */}
      {editingSession && (
        <EventFormDialog
          open={editingSession !== null}
          onOpenChange={(open) => {
            if (!open) setEditingSession(null);
          }}
          type="sessions"
          mode="edit"
          initialData={editingSession}
        />
      )}
    </div>
  );
}
