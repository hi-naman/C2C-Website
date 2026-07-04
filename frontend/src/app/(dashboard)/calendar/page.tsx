'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { calendarService, CalendarEventResponse } from '@/services/calendar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Award, 
  Layers, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Clock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Generate 42 days representing the 6-row calendar grid
const getDaysInMonth = (year: number, month: number) => {
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  
  const days: Date[] = [];
  
  // Previous month dates padding
  const prevMonthEnd = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month - 1, prevMonthEnd - i));
  }
  
  // Current month dates
  const currentMonthDays = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= currentMonthDays; i++) {
    days.push(new Date(year, month, i));
  }
  
  // Next month dates padding to reach exactly 42 cells (6 rows)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
};

const isSameDay = (d1: Date, d2Val: Date | string) => {
  const d2 = typeof d2Val === 'string' ? new Date(d2Val) : d2Val;
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

export default function CalendarPage() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeDay, setActiveDay] = useState<Date>(new Date());
  const [now, setNow] = useState(new Date());

  // Real-time ticking for countdown sidebar
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['calendar', selectedYear],
    queryFn: () => calendarService.getEvents(selectedYear),
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });

  const years = [
    { value: undefined, label: 'All Years' },
    { value: 1, label: 'Year 1' },
    { value: 2, label: 'Year 2' },
    { value: 3, label: 'Year 3' },
    { value: 4, label: 'Year 4' },
  ];

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const calendarDays = getDaysInMonth(currentYear, currentMonth);

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const getEventsForDay = (day: Date) => {
    return events?.filter((e) => isSameDay(day, e.date)) || [];
  };

  const getEventBadge = (type: 'SESSION' | 'CONTEST' | 'CAMP' | 'HACKATHON') => {
    switch (type) {
      case 'SESSION':
        return {
          icon: BookOpen,
          colorClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20',
          dotColor: 'bg-blue-500',
          label: 'Session',
        };
      case 'CONTEST':
        return {
          icon: Award,
          colorClass: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20',
          dotColor: 'bg-yellow-500',
          label: 'Contest',
        };
      case 'CAMP':
        return {
          icon: Sparkles,
          colorClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20',
          dotColor: 'bg-emerald-500',
          label: 'Camp',
        };
      case 'HACKATHON':
        return {
          icon: Layers,
          colorClass: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
          dotColor: 'bg-primary',
          label: 'Hackathon',
        };
    }
  };

  // Navigates directly to corresponding page on click
  const handleEventClick = (event: CalendarEventResponse) => {
    if (event.type === 'HACKATHON') {
      router.push(`/hackathons/${event.id}`);
    } else if (event.type === 'CONTEST') {
      router.push(`/contests/${event.id}`);
    } else if (event.type === 'SESSION') {
      router.push(`/sessions/${event.id}`);
    } else if (event.type === 'CAMP') {
      router.push(`/camps/${event.id}`);
    }
  };

  // Parse title to extract platform indicator if present (Codeforces, AtCoder, etc.)
  const getEventPlatform = (event: CalendarEventResponse) => {
    const titleLower = event.title.toLowerCase();
    if (titleLower.includes('leetcode')) return 'LeetCode';
    if (titleLower.includes('atcoder')) return 'AtCoder';
    if (titleLower.includes('codeforces')) return 'Codeforces';
    if (titleLower.includes('codechef')) return 'CodeChef';
    if (titleLower.includes('hackerrank')) return 'HackerRank';
    
    switch (event.type) {
      case 'SESSION': return 'Mentor Session';
      case 'CAMP': return 'Training Camp';
      case 'HACKATHON': return 'C2C Hackathon';
      case 'CONTEST': return 'C2C Contest';
      default: return 'C2C Event';
    }
  };

  // Dynamic countdown calculations
  const getCountdown = (dateStr: string) => {
    const eventTime = new Date(dateStr).getTime();
    const currentTime = now.getTime();
    const diff = eventTime - currentTime;
    
    if (diff <= 0) return 'Active';
    
    const secs = Math.floor(diff / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${mins % 60}m`;
    }
    if (mins > 0) {
      return `${mins}m ${secs % 60}s`;
    }
    return `${secs}s`;
  };

  // Filter events that occur from today onwards (Upcoming)
  const upcomingEvents = events
    ? events
        .filter((e) => new Date(e.date).getTime() > now.getTime() - 2 * 60 * 60 * 1000) // Keep active within 2 hours
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5)
    : [];

  const monthLabel = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const activeDayEvents = getEventsForDay(activeDay);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Academic Calendar</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Check and plan ahead for coding events, bootcamp camps, and mentor sessions.
          </p>
        </div>

        {/* Year selectors */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-card border border-border self-start shrink-0">
          {years.map((y) => (
            <Button
              key={y.label}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedYear(y.value)}
              className={cn(
                'rounded-lg text-xs font-medium px-3.5 py-1.5 h-8 transition-all',
                selectedYear === y.value
                  ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {y.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Grid Columns layout (Calendar vs Sidebar) */}
      <div className="grid gap-8 lg:grid-cols-4 items-start">
        {/* Calendar grid view column (Left 3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Calendar Box wrapper */}
          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            
            {/* Calendar Controls row */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/60">
              <h3 className="text-base font-bold text-foreground tracking-tight">{monthLabel}</h3>
              <div className="flex items-center gap-1.5 border border-border rounded-xl p-1 bg-background/50">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevMonth}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextMonth}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Grid structure */}
            {isLoading ? (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-7 gap-2">
                  {weekdayLabels.map((l) => (
                    <Skeleton key={l} className="h-6 w-full rounded" />
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="p-12 text-center text-sm text-destructive bg-destructive/5 font-mono">
                Failed to fetch calendar grid details. Please refresh the page.
              </div>
            ) : (
              <div>
                {/* Weekday headers row */}
                <div className="grid grid-cols-7 border-b border-border/40 bg-muted/10 font-mono text-[10px] font-bold uppercase text-muted-foreground/80 tracking-widest text-center">
                  {weekdayLabels.map((label) => (
                    <div key={label} className="py-2.5 border-r border-border/40 last:border-r-0">
                      {label}
                    </div>
                  ))}
                </div>

                {/* Calendar Days grid */}
                <div className="grid grid-cols-7 bg-background/20 divide-y divide-x divide-border/40 border-b border-border/40">
                  {calendarDays.map((day, idx) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth = day.getMonth() === currentMonth;
                    const isToday = isSameDay(day, new Date());
                    const isActive = isSameDay(day, activeDay);

                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveDay(day)}
                        className={cn(
                          "min-h-[90px] sm:min-h-[110px] p-2 flex flex-col justify-between cursor-pointer transition-colors relative hover:bg-muted/10 group",
                          !isCurrentMonth && "bg-muted/5 opacity-40",
                          isToday && "bg-primary/5",
                          isActive && "ring-1 ring-primary/45 bg-primary/5"
                        )}
                      >
                        {/* Day indicator header */}
                        <div className="flex justify-between items-center">
                          <span
                            className={cn(
                              "text-xs font-mono text-muted-foreground font-semibold flex items-center justify-center h-6 w-6 rounded-full transition-colors",
                              isToday && "bg-primary text-primary-foreground font-bold",
                              isActive && !isToday && "text-primary"
                            )}
                          >
                            {day.getDate()}
                          </span>

                          {/* Count nodes indicator on mobile */}
                          {dayEvents.length > 0 && (
                            <div className="flex md:hidden gap-0.5">
                              {dayEvents.slice(0, 3).map((e) => {
                                const b = getEventBadge(e.type);
                                return (
                                  <span
                                    key={e.id}
                                    className={cn("h-1.5 w-1.5 rounded-full shrink-0", b.dotColor)}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Events list within day (Desktop only) */}
                        <div className="mt-2 space-y-1.5 hidden md:flex flex-col flex-1 justify-end">
                          {dayEvents.slice(0, 3).map((event) => {
                            const badge = getEventBadge(event.type);
                            const BadgeIcon = badge.icon;

                            return (
                              <div
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventClick(event);
                                }}
                                className={cn(
                                  "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all duration-150 shadow-2xs hover:scale-[1.02]",
                                  badge.colorClass
                                )}
                                title={`${badge.label}: ${event.title}`}
                              >
                                <BadgeIcon className="h-3 w-3 shrink-0" />
                                <span className="truncate flex-1 text-left">{event.title}</span>
                              </div>
                            );
                          })}
                          
                          {dayEvents.length > 3 && (
                            <span className="text-[9px] font-mono text-muted-foreground pl-1 mt-0.5 block">
                              + {dayEvents.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Selected day listings view (Mobile default / Desktop auxiliary details) */}
          <div className="rounded-2xl border border-border bg-card p-6 md:hidden">
            <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              Schedules for {activeDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>

            {activeDayEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground italic pl-6">No events scheduled on this day.</p>
            ) : (
              <div className="space-y-3">
                {activeDayEvents.map((event) => {
                  const badge = getEventBadge(event.type);
                  const BadgeIcon = badge.icon;
                  return (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:scale-[1.01] transition-transform",
                        badge.colorClass
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <BadgeIcon className="h-4 w-4 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-foreground">{event.title}</p>
                          <p className="text-[9px] font-mono opacity-85 uppercase mt-0.5">{badge.label}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Contests / Events Sidebar (Right 1 col) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary animate-pulse" />
              Upcoming Contests
            </h3>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-6">
                <CalendarIcon className="h-8 w-8 text-muted-foreground/20 mx-auto" />
                <p className="text-xs text-muted-foreground mt-2">No upcoming contests scheduled.</p>
              </div>
            ) : (
              <div className="space-y-4 divide-y divide-border/40">
                {upcomingEvents.map((event, idx) => {
                  const evDate = new Date(event.date);
                  const monthName = evDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                  const dayNum = evDate.getDate();
                  const platform = getEventPlatform(event);
                  const isContest = event.type === 'CONTEST';
                  const countdown = getCountdown(event.date);

                  return (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className={cn(
                        "flex gap-3 pt-4 first:pt-0 items-start cursor-pointer group hover:scale-[1.01] transition-transform",
                        idx !== 0 && "border-t border-border/40"
                      )}
                    >
                      {/* Left Date badge */}
                      <div className="flex flex-col items-center justify-center h-11 w-11 shrink-0 rounded-xl bg-muted border border-border font-mono leading-none">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{monthName}</span>
                        <span className="text-base font-extrabold text-foreground mt-1">{dayNum}</span>
                      </div>

                      {/* Right details block */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-muted-foreground flex-wrap">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 text-[9px] px-1.5 py-0.2 rounded border",
                            event.type === 'CONTEST' && 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5',
                            event.type === 'SESSION' && 'text-blue-500 border-blue-500/20 bg-blue-500/5',
                            event.type === 'CAMP' && 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
                            event.type === 'HACKATHON' && 'text-primary border-primary/20 bg-primary/5'
                          )}>
                            {platform}
                          </span>
                          <span>•</span>
                          <span className="text-primary font-semibold flex items-center gap-1">
                            {countdown === 'Active' ? (
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                              </span>
                            ) : null}
                            {countdown}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
