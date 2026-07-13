'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { contestService } from '@/services/contests';
import { hackathonService } from '@/services/hackathons';
import { sessionService } from '@/services/sessions';
import { campService } from '@/services/camps';

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'contests' | 'hackathons' | 'sessions' | 'camps';
  mode: 'create' | 'edit';
  initialData?: any;
}

const formatToDatetimeLocal = (isoString?: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const DD = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
};

export default function EventFormDialog({
  open,
  onOpenChange,
  type,
  mode,
  initialData,
}: EventFormDialogProps) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Common fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [yearTarget, setYearTarget] = useState<string[]>(['ALL']);

  // Contest fields
  const [hackerrankUrl, setHackerrankUrl] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Hackathon fields
  const [problemStatement, setProblemStatement] = useState('');
  const [rules, setRules] = useState('');
  const [prizes, setPrizes] = useState('');
  const [regDeadline, setRegDeadline] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(4);

  // Session fields
  const [speakerName, setSpeakerName] = useState('');
  const [speakerBio, setSpeakerBio] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [venue, setVenue] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [slidesUrl, setSlidesUrl] = useState('');

  // Camp fields
  const [campType, setCampType] = useState('WINTER');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxSeats, setMaxSeats] = useState('');

  // Populate data in edit mode
  useEffect(() => {
    if (open) {
      setErrorMsg(null);
      if (mode === 'edit' && initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setTags(initialData.tags ? initialData.tags.join(', ') : '');
        const initialYearTarget = initialData.yearTarget;
        if (Array.isArray(initialYearTarget)) {
          setYearTarget(initialYearTarget);
        } else if (typeof initialYearTarget === 'string') {
          setYearTarget([initialYearTarget]);
        } else {
          setYearTarget(['ALL']);
        }

        if (type === 'contests') {
          setHackerrankUrl(initialData.hackerrankUrl || '');
          setAccessCode(initialData.accessCode || '');
          setStartTime(formatToDatetimeLocal(initialData.startTime));
          setEndTime(formatToDatetimeLocal(initialData.endTime));
        } else if (type === 'hackathons') {
          setProblemStatement(initialData.problemStatement || '');
          setRules(initialData.rules || '');
          setPrizes(initialData.prizes || '');
          setRegDeadline(formatToDatetimeLocal(initialData.regDeadline));
          setSubmissionDeadline(formatToDatetimeLocal(initialData.submissionDeadline));
          setMinTeamSize(initialData.minTeamSize ?? 1);
          setMaxTeamSize(initialData.maxTeamSize ?? 4);
        } else if (type === 'sessions') {
          setSpeakerName(initialData.speakerName || '');
          setSpeakerBio(initialData.speakerBio || '');
          setSessionDate(formatToDatetimeLocal(initialData.date));
          setVenue(initialData.venue || '');
          setRecordingUrl(initialData.recordingUrl || '');
          setSlidesUrl(initialData.slidesUrl || '');
        } else if (type === 'camps') {
          setCampType(initialData.type || 'WINTER');
          setStartDate(formatToDatetimeLocal(initialData.startDate));
          setEndDate(formatToDatetimeLocal(initialData.endDate));
          setVenue(initialData.venue || '');
          setMaxSeats(initialData.maxSeats ? String(initialData.maxSeats) : '');
        }
      } else {
        // Reset to empty
        setTitle('');
        setDescription('');
        setTags('');
        setYearTarget(['ALL']);

        setHackerrankUrl('');
        setAccessCode('');
        setStartTime('');
        setEndTime('');

        setProblemStatement('');
        setRules('');
        setPrizes('');
        setRegDeadline('');
        setSubmissionDeadline('');
        setMinTeamSize(1);
        setMaxTeamSize(4);

        setSpeakerName('');
        setSpeakerBio('');
        setSessionDate('');
        setVenue('');
        setRecordingUrl('');
        setSlidesUrl('');

        setCampType('WINTER');
        setStartDate('');
        setEndDate('');
        setMaxSeats('');
      }
    }
  }, [open, mode, type, initialData]);

  // Combined mutation helper
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (type === 'contests') {
        return mode === 'create'
          ? contestService.createContest(payload)
          : contestService.updateContest(initialData.id, payload);
      } else if (type === 'hackathons') {
        return mode === 'create'
          ? hackathonService.createHackathon(payload)
          : hackathonService.updateHackathon(initialData.id, payload);
      } else if (type === 'sessions') {
        return mode === 'create'
          ? sessionService.createSession(payload)
          : sessionService.updateSession(initialData.id, payload);
      } else {
        return mode === 'create'
          ? campService.createCamp(payload)
          : campService.updateCamp(initialData.id, payload);
      }
    },
    onSuccess: () => {
      // Invalidate queries to reload UI lists
      queryClient.invalidateQueries({ queryKey: [type] });
      if (type === 'hackathons' && mode === 'edit') {
        queryClient.invalidateQueries({ queryKey: ['hackathon', initialData.id] });
      }
      onOpenChange(false);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || `Failed to save ${type.slice(0, -1)}. Please check inputs and try again.`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Parsing common properties
    const parsedTags = tags
      ? tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      : [];

    let payload: any = {
      title,
      description,
    };

    if (type === 'contests') {
      if (!startTime || !endTime) {
        setErrorMsg('Start time and End time are required');
        return;
      }
      if (new Date(endTime) <= new Date(startTime)) {
        setErrorMsg('End time must be after start time');
        return;
      }
      payload = {
        ...payload,
        hackerrankUrl,
        accessCode: accessCode.trim() || undefined,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        yearTarget,
      };
    } else if (type === 'hackathons') {
      if (!regDeadline || !submissionDeadline) {
        setErrorMsg('Registration deadline and Submission deadline are required');
        return;
      }
      if (new Date(submissionDeadline) <= new Date(regDeadline)) {
        setErrorMsg('Submission deadline must be after registration deadline');
        return;
      }
      if (minTeamSize > maxTeamSize) {
        setErrorMsg('Minimum team size cannot exceed maximum team size');
        return;
      }
      payload = {
        ...payload,
        problemStatement,
        rules: rules.trim() || undefined,
        prizes: prizes.trim() || undefined,
        regDeadline: new Date(regDeadline).toISOString(),
        submissionDeadline: new Date(submissionDeadline).toISOString(),
        minTeamSize: Number(minTeamSize),
        maxTeamSize: Number(maxTeamSize),
        tags: parsedTags,
      };
    } else if (type === 'sessions') {
      if (!sessionDate) {
        setErrorMsg('Session date is required');
        return;
      }
      payload = {
        ...payload,
        speakerName,
        speakerBio: speakerBio.trim() || undefined,
        date: new Date(sessionDate).toISOString(),
        venue,
        recordingUrl: recordingUrl.trim() || undefined,
        slidesUrl: slidesUrl.trim() || undefined,
        tags: parsedTags,
        yearTarget,
      };
    } else if (type === 'camps') {
      if (!startDate || !endDate) {
        setErrorMsg('Start date and End date are required');
        return;
      }
      if (new Date(endDate) <= new Date(startDate)) {
        setErrorMsg('End date must be after start date');
        return;
      }
      payload = {
        ...payload,
        type: campType,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        venue: venue.trim() || undefined,
        maxSeats: maxSeats.trim() ? Number(maxSeats) : undefined,
        tags: parsedTags,
        yearTarget,
      };
    }

    saveMutation.mutate(payload);
  };

  const getTitleText = () => {
    const action = mode === 'create' ? 'Create New' : 'Edit';
    const singularType = type === 'contests' ? 'Contest'
      : type === 'hackathons' ? 'Hackathon'
      : type === 'sessions' ? 'Session'
      : 'Camp';
    return `${action} ${singularType}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border border-border text-foreground h-[90vh] sm:h-auto max-h-[90vh] md:max-h-[85vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden shadow-2xl duration-200 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
        {/* Fixed Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-border/80 bg-card shrink-0">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground">{getTitleText()}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Please fill out the details below. All dates are processed in local time and synced to UTC.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form Column */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Content Container */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 custom-scrollbar bg-card/10">
            {errorMsg && (
              <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* General Fields */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Title</label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event Title"
                  required
                  className="bg-background border-border focus-visible:ring-primary focus-visible:border-primary rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a detailed description of the event..."
                  required
                  rows={3}
                  className="bg-background border-border focus-visible:ring-primary focus-visible:border-primary rounded-xl resize-none"
                />
              </div>

              {/* Event Specific Fields */}
              {type === 'contests' && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">HackerRank Challenge URL</label>
                    <Input
                      type="url"
                      value={hackerrankUrl}
                      onChange={(e) => setHackerrankUrl(e.target.value)}
                      placeholder="https://hackerrank.com/..."
                      required
                      className="bg-background border-border focus-visible:ring-primary rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Access Unlock Code (Optional)</label>
                    <Input
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="e.g. C2C_CONTEST_CODE"
                      className="bg-background border-border focus-visible:ring-primary font-mono rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Start Time</label>
                    <Input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="bg-background border-border focus-visible:ring-primary cursor-pointer rounded-xl font-sans"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">End Time</label>
                    <Input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      className="bg-background border-border focus-visible:ring-primary cursor-pointer rounded-xl font-sans"
                    />
                  </div>
                </div>
              )}

              {type === 'hackathons' && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Problem Statement</label>
                    <Textarea
                      value={problemStatement}
                      onChange={(e) => setProblemStatement(e.target.value)}
                      placeholder="Describe the build themes and expectations..."
                      required
                      rows={4}
                      className="bg-background border-border focus-visible:ring-primary rounded-xl"
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Rules (Optional)</label>
                      <Textarea
                        value={rules}
                        onChange={(e) => setRules(e.target.value)}
                        placeholder="Squad constraints, grading code criteria..."
                        rows={2}
                        className="bg-background border-border focus-visible:ring-primary rounded-xl resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Prizes (Optional)</label>
                      <Textarea
                        value={prizes}
                        onChange={(e) => setPrizes(e.target.value)}
                        placeholder="e.g. Swags, cash prizes, certificates..."
                        rows={2}
                        className="bg-background border-border focus-visible:ring-primary rounded-xl resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Registration Closes</label>
                      <Input
                        type="datetime-local"
                        value={regDeadline}
                        onChange={(e) => setRegDeadline(e.target.value)}
                        required
                        className="bg-background border-border focus-visible:ring-primary cursor-pointer rounded-xl font-sans"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Submission Deadline</label>
                      <Input
                        type="datetime-local"
                        value={submissionDeadline}
                        onChange={(e) => setSubmissionDeadline(e.target.value)}
                        required
                        className="bg-background border-border focus-visible:ring-primary cursor-pointer rounded-xl font-sans"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Min Squad Size</label>
                      <Input
                        type="number"
                        value={minTeamSize}
                        onChange={(e) => setMinTeamSize(Math.max(1, Number(e.target.value)))}
                        required
                        min={1}
                        className="bg-background border-border focus-visible:ring-primary rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Max Squad Size</label>
                      <Input
                        type="number"
                        value={maxTeamSize}
                        onChange={(e) => setMaxTeamSize(Math.max(1, Number(e.target.value)))}
                        required
                        min={1}
                        className="bg-background border-border focus-visible:ring-primary rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {type === 'sessions' && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Speaker Name</label>
                    <Input
                      type="text"
                      value={speakerName}
                      onChange={(e) => setSpeakerName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      required
                      className="bg-background border-border focus-visible:ring-primary rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Session Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      required
                      className="bg-background border-border focus-visible:ring-primary cursor-pointer rounded-xl font-sans"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Speaker Bio (Optional)</label>
                    <Input
                      type="text"
                      value={speakerBio}
                      onChange={(e) => setSpeakerBio(e.target.value)}
                      placeholder="e.g. Senior Software Architect at Google"
                      className="bg-background border-border focus-visible:ring-primary rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Venue</label>
                    <Input
                      type="text"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. Seminar Hall 3, or Zoom link"
                      required
                      className="bg-background border-border focus-visible:ring-primary rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Slides URL (Optional)</label>
                    <Input
                      type="url"
                      value={slidesUrl}
                      onChange={(e) => setSlidesUrl(e.target.value)}
                      placeholder="https://slides.com/..."
                      className="bg-background border-border focus-visible:ring-primary rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Recording URL (Optional)</label>
                    <Input
                      type="url"
                      value={recordingUrl}
                      onChange={(e) => setRecordingUrl(e.target.value)}
                      placeholder="https://youtube.com/..."
                      className="bg-background border-border focus-visible:ring-primary rounded-xl"
                    />
                  </div>
                </div>
              )}

              {type === 'camps' && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Camp Type</label>
                    <select
                      value={campType}
                      onChange={(e) => setCampType(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl text-xs font-medium px-3 py-2.5 h-10 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary text-foreground cursor-pointer"
                    >
                      <option value="WINTER">Winter Camp</option>
                      <option value="SUMMER">Summer Camp</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Max Seats Limit (Optional)</label>
                    <Input
                      type="number"
                      value={maxSeats}
                      onChange={(e) => setMaxSeats(e.target.value)}
                      placeholder="e.g. 60"
                      min={1}
                      className="bg-background border-border focus-visible:ring-primary rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Start Date</label>
                    <Input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="bg-background border-border focus-visible:ring-primary cursor-pointer rounded-xl font-sans"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">End Date</label>
                    <Input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="bg-background border-border focus-visible:ring-primary cursor-pointer rounded-xl font-sans"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Venue (Optional)</label>
                    <Input
                      type="text"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. Block C CSE Lab, or Online Zoom"
                      className="bg-background border-border focus-visible:ring-primary rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Tags & Year target (not for hackathons) */}
              {type !== 'hackathons' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">
                    Target Academic Year
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 bg-background border border-border rounded-xl p-3">
                    {/* All Years */}
                    <label className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all hover:bg-muted/40",
                      yearTarget.includes('ALL') 
                        ? "bg-secondary text-foreground border-border shadow-2xs font-semibold" 
                        : "text-muted-foreground border-transparent"
                    )}>
                      <input
                        type="checkbox"
                        checked={yearTarget.includes('ALL')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setYearTarget(['ALL']);
                          } else {
                            setYearTarget(['ALL']);
                          }
                        }}
                        className="sr-only"
                      />
                      <span className={cn(
                        "w-3.5 h-3.5 rounded border border-muted-foreground/30 flex items-center justify-center text-[10px]",
                        yearTarget.includes('ALL') && "bg-foreground border-foreground text-background"
                      )}>
                        {yearTarget.includes('ALL') && "✓"}
                      </span>
                      All Years
                    </label>

                    {/* Individual Years */}
                    {[
                      { val: 'FIRST', label: 'Year 1' },
                      { val: 'SECOND', label: 'Year 2' },
                      { val: 'THIRD', label: 'Year 3' },
                      { val: 'FOURTH', label: 'Year 4' },
                    ].map(({ val, label }) => {
                      const isChecked = yearTarget.includes(val);
                      return (
                        <label key={val} className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all hover:bg-muted/40",
                          isChecked 
                            ? "bg-secondary text-foreground border-border shadow-2xs font-semibold" 
                            : "text-muted-foreground border-transparent"
                        )}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setYearTarget((prev) => {
                                  const filtered = prev.filter((y) => y !== 'ALL');
                                  return [...filtered, val];
                                });
                              } else {
                                setYearTarget((prev) => {
                                  const updated = prev.filter((y) => y !== val);
                                  return updated.length === 0 ? ['ALL'] : updated;
                                });
                              }
                            }}
                            className="sr-only"
                          />
                          <span className={cn(
                            "w-3.5 h-3.5 rounded border border-muted-foreground/30 flex items-center justify-center text-[10px]",
                            isChecked && "bg-foreground border-foreground text-background"
                          )}>
                            {isChecked && "✓"}
                          </span>
                          {label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {type !== 'contests' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">Tags (Comma-separated)</label>
                  <Input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. react, nextjs, algo, database"
                    className="bg-background border-border focus-visible:ring-primary rounded-xl"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="px-6 sm:px-8 py-5 border-t border-border/80 bg-card shrink-0 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:bg-muted hover:text-foreground h-10 px-4 rounded-xl text-xs hover:scale-[1.02] transition-transform duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2 h-10 px-5 rounded-xl text-xs hover:scale-[1.02] transition-all duration-200"
            >
              {saveMutation.isPending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                'Save Event'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
