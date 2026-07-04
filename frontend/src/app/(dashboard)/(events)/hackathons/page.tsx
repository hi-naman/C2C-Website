'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { hackathonService } from '@/services/hackathons';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Layers, Calendar, Users, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import EventFormDialog from '../components/EventFormDialog';

export default function HackathonsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Edit / Delete states
  const [editingHackathon, setEditingHackathon] = useState<any | null>(null);

  const { data: hackathons, isLoading, error } = useQuery({
    queryKey: ['hackathons'],
    queryFn: hackathonService.getAllHackathons,
    staleTime: 1000 * 60 * 5, // 5 minutes stale cache
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hackathonService.deleteHackathon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hackathons'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete hackathon.');
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this hackathon?')) {
      deleteMutation.mutate(id);
    }
  };

  const getDaysRemaining = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-8 animate-fade-in">
      {isLoading ? (
        /* Loading Skeletons */
        <div className="grid gap-6 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-4 pt-4 border-t border-border">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-12 text-center text-sm text-destructive bg-destructive/5 font-mono">
          Failed to fetch hackathons catalog. Please try again.
        </div>
      ) : !hackathons || hackathons.length === 0 ? (
        <div className="text-center p-16 rounded-xl border border-dashed border-border">
          <Layers className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-base font-semibold text-foreground">No Arenas Active</h3>
          <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
            There are no hackathons scheduled in the system at this time. Check back later!
          </p>
        </div>
      ) : (
        /* Catalog list */
        <div className="grid gap-6 sm:grid-cols-2">
          {hackathons.map((h) => {
            const daysLeft = getDaysRemaining(h.regDeadline);
            const isClosed = daysLeft <= 0;
            const teamsCount = (h as any)._count?.teams ?? 0;
            const regCount = (h as any)._count?.registrations ?? 0;

            return (
              <div
                key={h.id}
                className="rounded-xl border border-border bg-card p-6 hover:border-foreground/15 hover:scale-[1.02] transition-all duration-200 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1">
                      {h.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-mono border border-border bg-muted/30 px-2 py-0.5 rounded text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-[10px] font-mono border px-2 py-0.5 rounded-full',
                        isClosed 
                          ? 'bg-muted text-muted-foreground border-border' 
                          : 'bg-primary/10 text-primary border-primary/20'
                      )}>
                        {isClosed ? 'REG CLOSED' : `${daysLeft} DAYS LEFT`}
                      </span>

                      {isAdmin && (
                        <div className="flex items-center gap-1 border-l border-border/80 pl-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingHackathon(h)}
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            title="Edit Hackathon"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(h.id)}
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            title="Delete Hackathon"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground line-clamp-1">{h.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2 min-h-[32px]">{h.description}</p>
                  </div>

                  {/* Summary info */}
                  <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4 text-xs font-mono text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>{teamsCount} Teams ({regCount} Devs)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>Starts: {formatDate(h.regDeadline)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50">
                  <Link
                    href={`/hackathons/${h.id}`}
                    className={buttonVariants({
                      variant: 'outline',
                      className: 'w-full border-border bg-card/45 hover:bg-muted hover:text-foreground flex items-center justify-center gap-2 text-xs',
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
      {editingHackathon && (
        <EventFormDialog
          open={editingHackathon !== null}
          onOpenChange={(open) => {
            if (!open) setEditingHackathon(null);
          }}
          type="hackathons"
          mode="edit"
          initialData={editingHackathon}
        />
      )}
    </div>
  );
}
