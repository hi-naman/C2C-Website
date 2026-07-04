'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { hackathonService } from '@/services/hackathons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Layers,
  Calendar,
  Clock,
  Users,
  Trophy,
  Plus,
  ArrowRight,
  ClipboardList,
  AlertCircle,
  Copy,
  Check,
  Award,
  Terminal,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HackathonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const id = params.id as string;

  // Tabs: 'details' | 'team' | 'admin'
  const [activeTab, setActiveTab] = useState<'details' | 'team' | 'admin'>('details');
  const [copiedCode, setCopiedCode] = useState(false);

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '';
    const stringified = String(val);
    if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
      return `"${stringified.replace(/"/g, '""')}"`;
    }
    return stringified;
  };

  const handleExportHackathonsCSV = () => {
    if (!hackathon || !hackathon.teams || hackathon.teams.length === 0) return;

    const headers = ['Team Name', 'Team Code', 'Status', 'Member Name', 'Target Year', 'Email Address', 'Contact Number'];
    const rows: string[][] = [];

    hackathon.teams.forEach((team) => {
      const sizeMet = (team.members?.length || 0) >= hackathon.minTeamSize;
      const status = sizeMet ? 'ACTIVE' : 'PENDING';

      if (!team.members || team.members.length === 0) {
        rows.push([
          team.teamName,
          team.joinCode,
          status,
          '',
          '',
          '',
          ''
        ]);
      } else {
        team.members.forEach((m: any) => {
          const student = m.user;
          rows.push([
            team.teamName,
            team.joinCode,
            status,
            student?.name || '',
            student ? `Year ${student.year}` : '',
            student?.email || '',
            student?.phone || ''
          ]);
        });
      }
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${hackathon.title.replace(/\s+/g, '_')}_squads.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Forms state
  const [teamName, setTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { data: hackathon, isLoading, error } = useQuery({
    queryKey: ['hackathon', id],
    queryFn: () => hackathonService.getHackathonById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 mins cache
  });

  const registerMutation = useMutation({
    mutationFn: () => hackathonService.register(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hackathon', id] });
      setFormSuccess('You have successfully registered for this hackathon!');
      setActiveTab('team');
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to register. Please try again.');
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: (name: string) => hackathonService.createTeam(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hackathon', id] });
      setTeamName('');
      setFormSuccess('Your squad has been successfully created!');
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create team. Please try again.');
    },
  });

  const joinTeamMutation = useMutation({
    mutationFn: (code: string) => hackathonService.joinTeam(id, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hackathon', id] });
      setJoinCode('');
      setFormSuccess('You have successfully joined the squad!');
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to join team. Verify the code and try again.');
    },
  });

  const handleRegister = () => {
    setFormError(null);
    setFormSuccess(null);
    registerMutation.mutate();
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setFormError(null);
    setFormSuccess(null);
    createTeamMutation.mutate(teamName.trim());
  };

  const handleJoinTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setFormError(null);
    setFormSuccess(null);
    joinTeamMutation.mutate(joinCode.trim().toUpperCase());
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatDate = (dateStr: string) => {
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

  if (error || !hackathon) {
    return (
      <div className="p-12 text-center text-sm text-destructive bg-destructive/5 font-mono max-w-3xl mx-auto mt-8">
        Failed to fetch hackathon details. Please return and try again.
      </div>
    );
  }

  const isAdminOrSenior = user?.role === 'ADMIN' || user?.role === 'SENIOR';
  const isRegistered = hackathon.isRegistered ?? false;
  // User squad status
  const userTeam = hackathon.teams && hackathon.teams.length > 0 ? hackathon.teams[0] : null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Back button & Title Section */}
      <div className="space-y-4">
        <Button
          onClick={() => router.push('/hackathons')}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-8 gap-1.5 pl-2 pr-3 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Events
        </Button>

        <div className="flex flex-col gap-4 border-b border-border/40 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{hackathon.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Collaborative coding challenge arena details and registration.
            </p>
          </div>

          {/* Navigation Tab controls */}
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

            {isRegistered && !isAdminOrSenior && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('team')}
                className={cn(
                  'rounded-lg text-xs font-semibold px-4 h-8 transition-all',
                  activeTab === 'team'
                    ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                My Squad
              </Button>
            )}

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
                Squad Standings ({hackathon.teams?.length || 0})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Message Notifications */}
      {formError && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive max-w-3xl">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {formSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-500 max-w-3xl">
          <Check className="h-4 w-4 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Tabs panels */}
      {activeTab === 'details' && (
        <div className="grid gap-6 md:grid-cols-3 items-start">
          {/* Main Info Blocks (Left 2 columns) */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-3">
                <Terminal className="h-4 w-4 text-primary" />
                Problem Statement
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {hackathon.problemStatement}
              </p>
            </div>

            {hackathon.rules && (
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-3">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Guidelines & Rules
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {hackathon.rules}
                </p>
              </div>
            )}
          </div>

          {/* Hackathon schedule info (Right 1 column) */}
          <div className="space-y-6">
            {/* Registration action wrapper */}
            {!isRegistered && !isAdminOrSenior && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground">Registration Open</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Register for the hackathon to configure your development squad and submit project source repositories.
                </p>
                <Button
                  onClick={handleRegister}
                  disabled={registerMutation.isPending}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/95 py-5 flex items-center justify-center gap-2 rounded-xl text-xs hover:scale-[1.02] transition-transform"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register for Hackathon'
                  )}
                </Button>
              </div>
            )}

            {isRegistered && !isAdminOrSenior && !userTeam && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center space-y-3">
                <p className="text-sm font-bold text-primary flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Registered
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You are registered! Form a new squad or join an existing one to finalize eligibility.
                </p>
                <Button 
                  onClick={() => setActiveTab('team')} 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl h-10 text-xs hover:scale-[1.02] transition-transform"
                >
                  Manage Squad
                </Button>
              </div>
            )}

            {/* Timings summary */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider border-b border-border/40 pb-2">
                Event Schedule
              </h3>
              <div className="space-y-4 text-xs font-mono">
                <div className="flex gap-3">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground block">Registration Closes</span>
                    <span className="text-muted-foreground mt-0.5 block">{formatDate(hackathon.regDeadline)}</span>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-border/40 pt-4">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="font-semibold text-foreground block">Submission Deadline</span>
                    <span className="text-muted-foreground mt-0.5 block">{formatDate(hackathon.submissionDeadline)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Team size parameters */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4 text-xs font-mono">
              <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider border-b border-border/40 pb-2">
                Team Details & Prizes
              </h3>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Team Size Limit:</span>
                <span className="text-foreground font-bold">{hackathon.minTeamSize} - {hackathon.maxTeamSize} Devs</span>
              </div>
              {hackathon.prizes && (
                <div className="space-y-1">
                  <span className="text-muted-foreground block">Prizes:</span>
                  <span className="text-foreground font-bold block">{hackathon.prizes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Team tab */}
      {activeTab === 'team' && isRegistered && !isAdminOrSenior && (
        <div className="max-w-3xl">
          {!userTeam ? (
            /* Unassigned state — Create or Join */
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Create squad */}
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-foreground tracking-tight">Create a Squad</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Form a new team. You will receive an invitation passcode to share with other members.
                  </p>
                </div>
                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Squad Name (e.g. CodeCraft)"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="bg-background border-border focus-visible:ring-primary focus-visible:border-primary rounded-xl"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={createTeamMutation.isPending}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-2 rounded-xl h-10 text-xs hover:scale-[1.02] transition-transform"
                  >
                    <Plus className="h-4 w-4" />
                    Create Team
                  </Button>
                </form>
              </div>

              {/* Join squad */}
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-foreground tracking-tight">Join a Squad</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Enter the 6-character team join code shared by your teammate.
                  </p>
                </div>
                <form onSubmit={handleJoinTeam} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Join Code (e.g. AB12CD)"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="bg-background border-border focus-visible:ring-primary focus-visible:border-primary text-center font-mono tracking-widest text-base rounded-xl uppercase"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={joinTeamMutation.isPending}
                    className="w-full border border-border hover:bg-muted text-foreground bg-card/50 flex items-center justify-center gap-2 rounded-xl h-10 text-xs hover:scale-[1.02] transition-all"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Join Team
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            /* Assigned squad view */
            <div className="space-y-6">
              {/* Squad banner details */}
              <div className="rounded-2xl border border-border bg-card p-6 grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">Squad Name</span>
                  <h3 className="text-xl font-bold text-foreground tracking-tight">{userTeam.teamName}</h3>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">Join Passcode</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-lg font-bold tracking-widest bg-muted border border-border px-3 py-1 rounded-lg text-primary select-all">
                      {userTeam.joinCode}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyCode(userTeam.joinCode)}
                      className="text-muted-foreground hover:bg-muted rounded-lg"
                      title="Copy join code"
                    >
                      {copiedCode ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <span className="text-[9px] text-muted-foreground block leading-none">Share code to invite members.</span>
                </div>
              </div>

              {/* Dynamic validation banner */}
              {(userTeam.members?.length || 0) < hackathon.minTeamSize ? (
                <div className="flex gap-3.5 items-start p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-xs text-yellow-600 dark:text-yellow-500">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Team Registration Pending</p>
                    <p className="opacity-90 leading-relaxed">
                      Your squad currently has {userTeam.members?.length || 0} member(s). A minimum of {hackathon.minTeamSize} member(s) is required to be fully registered. Please invite {hackathon.minTeamSize - (userTeam.members?.length || 0)} more member(s).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3.5 items-start p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-600 dark:text-emerald-500">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Registration Valid & Active</p>
                    <p className="opacity-90 leading-relaxed">
                      Your team meets the size requirements and is officially validated for this hackathon!
                    </p>
                  </div>
                </div>
              )}

              {/* Members List */}
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-3">
                  <Users className="h-4 w-4 text-primary" />
                  Squad Members ({userTeam.members?.length || 0})
                </h3>
                <div className="divide-y divide-border/40">
                  {userTeam.members?.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      {member.user?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.user.avatarUrl}
                          alt={member.user.name}
                          className="h-8 w-8 rounded-full border border-border object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-xs">
                          {member.user?.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-foreground">{member.user?.name}</p>
                        <p className="text-[9px] font-mono text-muted-foreground uppercase mt-0.5">{member.user?.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Panel tab (Registered Squads Audit) */}
      {activeTab === 'admin' && isAdminOrSenior && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-primary" />
                  Registered Squads Standings ({hackathon.teams?.length || 0})
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Overview of registered squads, passcode parameters, and member contact lists.
                </p>
              </div>
              {hackathon.teams && hackathon.teams.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportHackathonsCSV}
                  className="flex items-center gap-2 border-border hover:bg-muted text-xs h-9 rounded-xl self-start sm:self-auto"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              )}
            </div>
            
            {(!hackathon.teams || hackathon.teams.length === 0) ? (
              <div className="text-center py-12 text-sm text-muted-foreground font-mono border border-dashed border-border/60 rounded-xl">
                No squads have registered for this hackathon yet.
              </div>
            ) : (
              <div className="space-y-8">
                {hackathon.teams.map((team) => {
                  const sizeMet = (team.members?.length || 0) >= hackathon.minTeamSize;
                  return (
                    <div key={team.id} className="border border-border rounded-xl bg-card/35 p-5 space-y-4">
                      {/* Team Header Summary Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/50 pb-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-bold text-foreground text-sm">{team.teamName}</span>
                          
                          {/* Eligibility visual badges */}
                          {sizeMet ? (
                            <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-mono uppercase px-2 py-0.5 rounded-full inline-block">
                              Active ({team.members?.length || 0}/{hackathon.maxTeamSize})
                            </span>
                          ) : (
                            <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[9px] font-mono uppercase px-2 py-0.5 rounded-full inline-block" title={`Requires at least ${hackathon.minTeamSize} members`}>
                              Pending ({team.members?.length || 0}/{hackathon.minTeamSize})
                            </span>
                          )}
                        </div>

                        <span className="text-xs font-mono bg-muted border border-border/80 px-2 py-0.5 rounded-lg text-primary self-start sm:self-auto select-all">
                          Code: {team.joinCode}
                        </span>
                      </div>

                      {/* Members list styled as a table */}
                      {(!team.members || team.members.length === 0) ? (
                        <div className="text-center py-6 text-xs text-muted-foreground font-mono italic">
                          No members in this squad yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-left text-xs text-muted-foreground">
                            <thead className="border-b border-border bg-muted/40 font-mono text-foreground font-bold">
                              <tr>
                                <th className="p-2.5">Member Name</th>
                                <th className="p-2.5">Target Year</th>
                                <th className="p-2.5">Email Address</th>
                                <th className="p-2.5">Contact Number</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {team.members.map((m: any) => {
                                const student = m.user;
                                if (!student) return null;
                                return (
                                  <tr key={m.id} className="hover:bg-muted/15 transition-colors">
                                    <td className="p-2.5 font-semibold text-foreground flex items-center gap-2.5">
                                      {student.avatarUrl ? (
                                        <img
                                          src={student.avatarUrl}
                                          alt={student.name}
                                          className="h-6 w-6 rounded-full border border-border object-cover"
                                        />
                                      ) : (
                                        <div className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-[10px] text-foreground">
                                          {student.name.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                      {student.name}
                                    </td>
                                    <td className="p-2.5 font-mono">
                                      <span className="bg-muted px-2 py-0.5 rounded text-[10px] text-foreground font-semibold">
                                        Year {student.year}
                                      </span>
                                    </td>
                                    <td className="p-2.5 font-mono">
                                      <a href={`mailto:${student.email}`} className="hover:text-primary flex items-center gap-1">
                                        <Mail className="h-3 w-3 text-muted-foreground/60" />
                                        {student.email}
                                      </a>
                                    </td>
                                    <td className="p-2.5 font-mono">
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
