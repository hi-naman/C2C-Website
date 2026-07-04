'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { campService } from '@/services/camps';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  MapPin,
  Users,
  Check,
  Flame,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Pencil,
  Trash2,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Shield,
  Layers,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import EventFormDialog from '../../components/EventFormDialog';

export default function CampDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<'details' | 'registrants'>('details');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '';
    const stringified = String(val);
    if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
      return `"${stringified.replace(/"/g, '""')}"`;
    }
    return stringified;
  };

  const handleExportCampsCSV = () => {
    if (!registrations || registrations.length === 0 || !camp) return;

    const headers = ['Student Name', 'Target Year', 'Email Address', 'Contact Number'];
    const rows = registrations.map((reg: any) => {
      const student = reg.user;
      return [
        student?.name || '',
        student ? `Year ${student.year}` : '',
        student?.email || '',
        student?.phone || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${camp.title.replace(/\s+/g, '_')}_registrants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Query camp details
  const { data: camp, isLoading, error } = useQuery({
    queryKey: ['camp', id],
    queryFn: () => campService.getCampById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  // Query camp registrations (Admin only)
  const isAdmin = user?.role === 'ADMIN';
  const { data: registrations, isLoading: isLoadingRegs } = useQuery({
    queryKey: ['camp-registrations', id],
    queryFn: () => campService.getCampRegistrations(id),
    enabled: !!id && isAdmin,
  });

  const { data: myRegistrations } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: campService.getMyRegistrations,
    staleTime: 1000 * 60 * 2,
  });

  const registerMutation = useMutation({
    mutationFn: () => campService.registerForCamp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camp', id] });
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['camp-registrations', id] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to register for camp.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => campService.deleteCamp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      router.push('/camps');
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete camp.');
    },
  });

  const handleRegister = () => {
    if (window.confirm('Are you sure you want to register for this camp?')) {
      registerMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this camp?')) {
      deleteMutation.mutate();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
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

  if (error || !camp) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Button
          onClick={() => router.push('/camps')}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-8 gap-1.5 pl-2 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Events
        </Button>
        <div className="p-12 text-center text-sm text-destructive bg-destructive/5 font-mono">
          Failed to fetch training camp details. Please return and try again.
        </div>
      </div>
    );
  }

  const registered = myRegistrations?.some((r: any) => r.campId === id) ?? false;
  const seatsRegistered = camp._count?.registrations ?? 0;
  const isFull = camp.maxSeats ? seatsRegistered >= camp.maxSeats : false;

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header section */}
      <div className="space-y-4">
        <Button
          onClick={() => router.push('/camps')}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-8 gap-1.5 pl-2 pr-3 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Events
        </Button>

        <div className="flex flex-col gap-4 border-b border-border/40 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{camp.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Platform training camps details and registration tracker.
            </p>
          </div>

          {/* Tab Selection */}
          {isAdmin && (
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('registrants')}
                className={cn(
                  'rounded-lg text-xs font-semibold px-4 h-8 transition-all',
                  activeTab === 'registrants'
                    ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                Registrants ({seatsRegistered})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Details view */}
      {activeTab === 'details' && (
        <div className="grid gap-6 md:grid-cols-3 items-start">
          {/* Main Info (Left 2 cols) */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-3">
                <Flame className="h-4 w-4 text-primary" />
                About the Camp
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {camp.description}
              </p>
            </div>

            {/* Registration action panel */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider border-b border-border/40 pb-3">
                Registration Status
              </h3>
              {registered ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-500 flex items-center gap-2.5">
                  <Check className="h-5 w-5 shrink-0" />
                  <div>
                    <span className="font-semibold block text-foreground">You are Registered!</span>
                    <span className="text-muted-foreground mt-0.5 block">Your seat is reserved. Report to the venue on time.</span>
                  </div>
                </div>
              ) : isFull ? (
                <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground flex items-center gap-2.5">
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
                  <div>
                    <span className="font-semibold block text-foreground">Registration Closed</span>
                    <span className="text-muted-foreground mt-0.5 block">All available seats for this program have been filled.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Enroll to unlock entry, receive study materials, and track attendance.
                  </p>
                  <Button
                    onClick={handleRegister}
                    disabled={registerMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs rounded-xl h-10 px-5 flex items-center gap-1.5"
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Register for Camp'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (Right 1 col) */}
          <div className="space-y-6">
            {/* Admin panel actions */}
            {isAdmin && (
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

            {/* Event metrics card */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4 text-xs font-mono">
              <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider border-b border-border/40 pb-2">
                Camp Details
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground block">Timeline</span>
                    <span className="text-muted-foreground mt-0.5 block">
                      {formatDate(camp.startDate)} - {formatDate(camp.endDate)}
                    </span>
                  </div>
                </div>

                {camp.venue && (
                  <div className="flex gap-3 border-t border-border/40 pt-4">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground block">Venue</span>
                      <span className="text-muted-foreground mt-0.5 block">{camp.venue}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 border-t border-border/40 pt-4">
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground block">Seats Capacity</span>
                    <span className="text-muted-foreground mt-0.5 block">
                      {seatsRegistered} / {camp.maxSeats || '∞'} Reserved
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick specifications widget */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 text-xs font-mono">
              <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider border-b border-border/40 pb-2">
                Specifications
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Season:</span>
                <span className="font-bold text-foreground uppercase">{camp.type} Camp</span>
              </div>
              <div className="flex justify-between items-center border-t border-border/40 pt-2">
                <span className="text-muted-foreground">Target Audience:</span>
                <span className="font-bold text-foreground">{camp.yearTarget} Target</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registrants view (Admins only) */}
      {activeTab === 'registrants' && isAdmin && (
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
            <div>
              <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-primary" />
                Registered Students
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Contact sheet and attendance checklist for camp attendees.
              </p>
            </div>
            {registrations && registrations.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCampsCSV}
                className="flex items-center gap-2 border-border hover:bg-muted text-xs h-9 rounded-xl self-start sm:self-auto"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>

          {isLoadingRegs ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !registrations || registrations.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground font-mono border border-dashed border-border/60 rounded-xl">
              No registrations recorded for this camp yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-muted-foreground">
                <thead className="border-b border-border bg-muted/40 font-mono text-foreground font-bold">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Target Year</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Contact Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {registrations.map((reg: any) => {
                    const student = reg.user;
                    if (!student) return null;
                    return (
                      <tr key={reg.id} className="hover:bg-muted/15 transition-colors">
                        <td className="p-3 font-semibold text-foreground flex items-center gap-2.5">
                          {student.avatarUrl ? (
                            <img
                              src={student.avatarUrl}
                              alt={student.name}
                              className="h-6 w-6 rounded-full border border-border"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-[10px] text-foreground">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {student.name}
                        </td>
                        <td className="p-3 font-mono">
                          <span className="bg-muted px-2 py-0.5 rounded text-[10px] text-foreground font-semibold">
                            Year {student.year}
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          <a href={`mailto:${student.email}`} className="hover:text-primary flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground/60" />
                            {student.email}
                          </a>
                        </td>
                        <td className="p-3 font-mono">
                          {student.phone ? (
                            <a href={`tel:${student.phone}`} className="hover:text-primary flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground/60" />
                              {student.phone}
                            </a>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Editing event modal */}
      {isEditOpen && (
        <EventFormDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          type="camps"
          mode="edit"
          initialData={camp}
        />
      )}
    </div>
  );
}
