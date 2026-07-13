'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { campService, CampApiResponse } from '@/services/camps';
import { YearTarget } from '@/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar, MapPin, Users, Check, Flame, AlertCircle, Pencil, Trash2, ShieldAlert, Award, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import EventFormDialog from '../components/EventFormDialog';

export default function CampsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const selectedYearTarget = (searchParams.get('yearTarget') as YearTarget) || 'ALL';

  // Modal / Dialog States
  const [editingCamp, setEditingCamp] = useState<CampApiResponse | null>(null);
  const [viewingRegistrationsCamp, setViewingRegistrationsCamp] = useState<CampApiResponse | null>(null);
  
  // Registration notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Queries
  const { data: camps, isLoading, error } = useQuery({
    queryKey: ['camps', selectedYearTarget],
    queryFn: () => campService.getAllCamps(selectedYearTarget === 'ALL' ? undefined : selectedYearTarget),
    staleTime: 1000 * 60 * 2,
  });

  const { data: myRegistrations } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: campService.getMyRegistrations,
    staleTime: 1000 * 60 * 2,
  });

  const { data: campRegistrations, isLoading: isLoadingRegs } = useQuery({
    queryKey: ['camp-registrations', viewingRegistrationsCamp?.id],
    queryFn: () => campService.getCampRegistrations(viewingRegistrationsCamp!.id),
    enabled: viewingRegistrationsCamp !== null,
  });

  // Mutations
  const registerMutation = useMutation({
    mutationFn: (campId: string) => campService.registerForCamp(campId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      setSuccessMsg('You have successfully registered for the camp!');
      setTimeout(() => setSuccessMsg(null), 5000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to register for camp. Please complete profile and check year eligibility.');
      setTimeout(() => setErrorMsg(null), 5000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campService.deleteCamp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camps'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete camp.');
    },
  });

  const handleRegister = (campId: string) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    registerMutation.mutate(campId);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this camp?')) {
      deleteMutation.mutate(id);
    }
  };

  const isAlreadyRegistered = (campId: string) => {
    return myRegistrations?.some((reg) => reg.campId === campId) ?? false;
  };

  const formatCampDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Alert boxes */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-500 max-w-3xl">
          <Check className="h-4 w-4 shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive max-w-3xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

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
          Failed to fetch camps data. Please refresh or try again.
        </div>
      ) : !camps || camps.length === 0 ? (
        <div className="text-center p-16 rounded-xl border border-dashed border-border">
          <Award className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-base font-semibold text-foreground">No Camps Registered</h3>
          <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
            No training camps are listed for Year {selectedYearTarget} currently. Check back later!
          </p>
        </div>
      ) : (
        /* Camps catalog list */
        <div className="grid gap-6 sm:grid-cols-2">
          {camps.map((camp) => {
            const seatsRegistered = camp._count?.registrations ?? 0;
            const maxSeats = camp.maxSeats;
            const isFull = maxSeats ? seatsRegistered >= maxSeats : false;
            const registered = isAlreadyRegistered(camp.id);
            const statusLabel = camp.type === 'WINTER' ? 'Winter camp' : 'Summer camp';

            return (
              <div
                key={camp.id}
                className="rounded-xl border border-border bg-card p-6 hover:border-foreground/15 hover:scale-[1.02] transition-all duration-200 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Badge Headers */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-mono border border-border bg-muted/40 text-muted-foreground px-2 py-0.5 rounded uppercase tracking-wider">
                      {camp.yearTarget} TARGET
                    </span>

                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-[10px] font-mono border px-2 py-0.5 rounded-full uppercase',
                        camp.type === 'WINTER' 
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      )}>
                        {statusLabel}
                      </span>

                      {isAdmin && (
                        <div className="flex items-center gap-1 border-l border-border pl-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingCamp(camp)}
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            title="Edit Camp"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(camp.id)}
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            title="Delete Camp"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground line-clamp-1">{camp.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-3 mt-2 min-h-[48px]">{camp.description}</p>
                  </div>

                  {/* Summary Parameter Info */}
                  <div className="grid grid-cols-2 gap-4 border-y border-border/50 py-4 text-xs font-mono text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary shrink-0" />
                      <span>
                        {maxSeats ? `${seatsRegistered} / ${maxSeats} Seats` : `${seatsRegistered} Reg.`}
                      </span>
                    </div>
                    {camp.venue && (
                      <div className="flex items-center gap-2 overflow-hidden">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate">{camp.venue}</span>
                      </div>
                    )}
                  </div>

                  {/* Schedule dates */}
                  <div className="space-y-1 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>Runs: {formatCampDate(camp.startDate)} - {formatCampDate(camp.endDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-border/50 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3 w-full">
                    {registered ? (
                      <Button disabled className="w-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-not-allowed text-xs rounded-xl flex items-center justify-center gap-1.5 h-9">
                        <Check className="h-4 w-4" />
                        Registered
                      </Button>
                    ) : isFull ? (
                      <Button disabled className="w-full bg-muted text-muted-foreground border border-border cursor-not-allowed text-xs rounded-xl h-9">
                        Seats Full
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleRegister(camp.id)}
                        disabled={registerMutation.isPending}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs rounded-xl flex items-center justify-center gap-1.5 h-9"
                      >
                        {registerMutation.isPending ? (
                          <>
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                            Processing...
                          </>
                        ) : (
                          'Register for Camp'
                        )}
                      </Button>
                    )}

                    {isAdmin && (
                      <Button
                        variant="outline"
                        onClick={() => setViewingRegistrationsCamp(camp)}
                        className="text-xs border-border bg-card/45 hover:bg-muted text-foreground px-4 h-9 rounded-xl shrink-0 font-mono"
                      >
                        Regs ({seatsRegistered})
                      </Button>
                    )}
                  </div>

                  <Link
                    href={`/camps/${camp.id}`}
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
      {editingCamp && (
        <EventFormDialog
          open={editingCamp !== null}
          onOpenChange={(open) => {
            if (!open) setEditingCamp(null);
          }}
          type="camps"
          mode="edit"
          initialData={editingCamp}
        />
      )}

      {/* Admin registrations list modal */}
      {viewingRegistrationsCamp && (
        <Dialog open={viewingRegistrationsCamp !== null} onOpenChange={(open) => {
          if (!open) setViewingRegistrationsCamp(null);
        }}>
          <DialogContent className="max-w-xl bg-card border border-border text-foreground rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Registrations: {viewingRegistrationsCamp.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Displaying full list of registered developers. Only accessible to system administrators.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 max-h-[50vh] overflow-y-auto pr-1">
              {isLoadingRegs ? (
                <div className="space-y-2 py-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : !campRegistrations || campRegistrations.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground font-mono">
                  No registrations recorded for this camp yet.
                </div>
              ) : (
                <div className="divide-y divide-border border-y border-border">
                  {campRegistrations.map((reg: any) => {
                    const student = reg.user;
                    if (!student) return null;
                    return (
                      <div key={reg.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          {student.avatarUrl ? (
                            <img
                              src={student.avatarUrl}
                              alt={student.name}
                              className="h-8 w-8 rounded-full border border-border"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-xs text-foreground">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-foreground">{student.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{student.email}</p>
                          </div>
                        </div>

                        <div className="text-right font-mono text-[10px] space-y-0.5 text-muted-foreground">
                          <span className="bg-muted px-1.5 py-0.5 rounded text-foreground font-semibold">
                            Year {student.year}
                          </span>
                          {student.phone && <p className="mt-0.5">{student.phone}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={() => setViewingRegistrationsCamp(null)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs rounded-xl"
              >
                Close List
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
