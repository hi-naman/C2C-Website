'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { sessionService } from '@/services/sessions';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  MapPin,
  User,
  Video,
  Presentation,
  ExternalLink,
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import EventFormDialog from '../../components/EventFormDialog';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const id = params.id as string;

  const [isEditOpen, setIsEditOpen] = useState(false);

  // Fetch session details
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', id],
    queryFn: () => sessionService.getSessionById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const deleteMutation = useMutation({
    mutationFn: () => sessionService.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      router.push('/sessions');
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete session.');
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteMutation.mutate();
    }
  };

  const formatSessionDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
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

  const canEditOrDelete = () => {
    if (!user || !session) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role === 'SENIOR') {
      return session.createdBy === user.id;
    }
    return false;
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

  if (error || !session) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Button
          onClick={() => router.push('/sessions')}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-8 gap-1.5 pl-2 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Events
        </Button>
        <div className="p-12 text-center text-sm text-destructive bg-destructive/5 font-mono">
          Failed to fetch session details. Please return and try again.
        </div>
      </div>
    );
  }

  const active = isUpcoming(session.date);
  const hasCrud = canEditOrDelete();

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Navigation & Header */}
      <div className="space-y-4">
        <Button
          onClick={() => router.push('/sessions')}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-8 gap-1.5 pl-2 pr-3 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Events
        </Button>

        <div className="flex flex-col gap-4 border-b border-border/40 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{session.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Technical speaker panel and mentoring classroom overview.
            </p>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid gap-6 md:grid-cols-3 items-start">
        {/* Main Details (Left 2 cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              Session Summary
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {session.description}
            </p>
          </div>

          {/* Speaker Bio Card */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-3">
              <User className="h-4 w-4 text-primary" />
              Speaker Spotlight
            </h3>
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-lg text-primary font-mono shrink-0">
                {session.speakerName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-foreground">{session.speakerName}</h4>
                {session.speakerBio ? (
                  <p className="text-xs text-muted-foreground leading-relaxed">{session.speakerBio}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No biography provided by host.</p>
                )}
              </div>
            </div>
          </div>

          {/* Slides & Recording resources */}
          {(session.slidesUrl || session.recordingUrl) && (
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider border-b border-border/40 pb-3">
                Learning Assets
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {session.slidesUrl && (
                  <a
                    href={session.slidesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between border border-border bg-muted/20 hover:bg-muted/40 text-foreground p-4 rounded-xl text-xs font-semibold transition-colors duration-150"
                  >
                    <span className="flex items-center gap-2.5">
                      <Presentation className="h-5 w-5 text-primary" />
                      Slide Deck PDF
                    </span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
                {session.recordingUrl && (
                  <a
                    href={session.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between border border-border bg-muted/20 hover:bg-muted/40 text-foreground p-4 rounded-xl text-xs font-semibold transition-colors duration-150"
                  >
                    <span className="flex items-center gap-2.5">
                      <Video className="h-5 w-5 text-primary" />
                      Video Recording
                    </span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar details (Right 1 col) */}
        <div className="space-y-6">
          {/* Admin editing actions */}
          {hasCrud && (
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

          {/* Location & Time specs */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4 text-xs font-mono">
            <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider border-b border-border/40 pb-2">
              Timeline Details
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <span className="font-semibold text-foreground block">Session Date</span>
                  <span className="text-muted-foreground mt-0.5 block">
                    {formatSessionDate(session.date)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 border-t border-border/40 pt-4">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <span className="font-semibold text-foreground block">Venue</span>
                  <span className="text-muted-foreground mt-0.5 block">{session.venue}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Session tags & Target */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3.5 text-xs font-mono">
            <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider border-b border-border/40 pb-2">
              Specifications
            </h3>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status:</span>
              <span className={cn(
                'font-bold border px-2 py-0.5 rounded-full text-[10px]',
                active ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'
              )}>
                {active ? 'UPCOMING' : 'COMPLETED'}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-border/40 pt-2">
              <span className="text-muted-foreground">Class Target:</span>
              <span className="font-bold text-foreground">{session.yearTarget} Target</span>
            </div>

            {session.tags && session.tags.length > 0 && (
              <div className="border-t border-border/40 pt-3 space-y-1.5">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Tags</span>
                <div className="flex flex-wrap gap-1">
                  {session.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-[9px] font-mono border border-border bg-muted/40 px-2 py-0.5 rounded text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editing Dialog */}
      {isEditOpen && (
        <EventFormDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          type="sessions"
          mode="edit"
          initialData={session}
        />
      )}
    </div>
  );
}
