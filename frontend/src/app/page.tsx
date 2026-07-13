'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button, buttonVariants } from '@/components/ui/button';
import Galaxy from '@/components/Galaxy';
import { useReducedMotion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Calendar, Layers, MessageSquare, Trophy } from 'lucide-react';
import { useTheme } from '@/components/shared/theme-provider';
import { ThemeToggle } from '@/components/shared/theme-toggle';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: 'Events',
    description: 'Contests, hackathons, sessions, and camps organized in one place.',
    icon: Layers,
  },
  {
    title: 'Leaderboard',
    description: 'Year-wise ranks and contest scores with clear competition tracking.',
    icon: Trophy,
  },
  {
    title: 'Calendar',
    description: 'Plan upcoming sessions and deadlines without digging through pages.',
    icon: Calendar,
  },
  {
    title: 'Forum',
    description: 'Markdown posts, tags, comments, and upvotes for student discussion.',
    icon: MessageSquare,
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const handleStart = () => {
    window.location.href = isAuthenticated ? '/dashboard' : `${API_BASE_URL}/api/auth/google`;
  };

  useEffect(() => {
    if (reduceMotion || !rootRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from('[data-hero]', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
        gsap.fromTo(
          element,
          { y: 16, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 84%',
            },
          }
        );
      });
    }, rootRef);

    return () => ctx.revert();
  }, [reduceMotion]);

  return (
    <div id="top" ref={rootRef} className="relative z-0 min-h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      <div className="absolute inset-0 -z-30 opacity-100">
        <Galaxy
          mouseRepulsion={false}
          mouseInteraction={false}
          density={1}
          glowIntensity={isLight ? 0.005 : 0.5}
          saturation={isLight ? 0 : 1}
          hueShift={140}
          twinkleIntensity={isLight ? 0.1 : 0.3}
          rotationSpeed={0.1}
          repulsionStrength={2}
          autoCenterRepulsion={0}
          starSpeed={0.5}
          speed={1}
          lightMode={isLight}
        />
      </div>

      <header className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 sm:px-4">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between rounded-full border border-border bg-card/60 px-4 shadow-[0_12px_60px_-24px_rgba(0,0,0,0.3)] dark:shadow-[0_12px_60px_-24px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:px-5">
          <Link href="/" className="cursor-target flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#202d3d] dark:bg-zinc-100 border border-border/10 flex items-center justify-center font-mono text-[16px] font-black tracking-tighter leading-none shadow-sm select-none shrink-0 transition-colors">
              <span className="text-[#E0772E]">C</span>
              <span className="text-white dark:text-zinc-950 transition-colors">2</span>
              <span className="text-[#E0772E]">C</span>
            </div>
            <span className="hidden text-sm font-semibold tracking-tight text-foreground sm:block">Code to Career</span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#features"
              className="cursor-target rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/10 hover:text-[#E0772E] dark:text-white/75 dark:hover:bg-white/8 dark:hover:text-white"
            >
              Features
            </a>
            <ThemeToggle />
            {!isAuthenticated && (
              <Button onClick={handleStart} size="sm" className="cursor-target rounded-full bg-[#E0772E] text-white hover:bg-[#E0772E]/90 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90">
                Sign in
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col px-4 pb-16 pt-32 sm:px-6 lg:px-8 lg:pt-36">
        <section data-hero className="flex min-h-[calc(100vh-10rem)] items-center justify-center text-center">
          <div className="max-w-3xl space-y-8">
            <div className="mx-auto inline-flex items-center rounded-full border border-border bg-card/60 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground backdrop-blur-sm dark:border-white/10 dark:bg-white/6 dark:text-white/70">
              Student events and competition platform
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Code to Career
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg dark:text-white/70">
                A focused campus platform for contests, hackathons, sessions, camps, leaderboard tracking, calendar planning, and discussion.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button onClick={handleStart} size="lg" className="cursor-target rounded-full bg-[#E0772E] text-white hover:bg-[#E0772E]/90 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90">
                {isAuthenticated ? 'Go to dashboard' : 'Sign in with Google'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <a
                href="#features"
                className={buttonVariants({
                  variant: 'outline',
                  size: 'lg',
                  className: 'cursor-target rounded-full border-border bg-secondary/50 text-foreground hover:bg-secondary dark:border-white/15 dark:bg-white/6 dark:text-white dark:hover:bg-white/10',
                })}
              >
                Explore features
              </a>
            </div>
          </div>
        </section>

        <section id="features" data-reveal className="scroll-mt-28 pb-20 pt-6 sm:pt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 dark:text-white/45">Features</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">What the platform includes</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="cursor-target group rounded-[1.5rem] border border-border bg-card/50 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:bg-card/80 dark:border-white/10 dark:bg-white/6 dark:hover:border-white/20 dark:hover:bg-white/8"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-secondary text-[#E0772E] transition-transform group-hover:scale-105 dark:border-white/10 dark:bg-white/10 dark:text-white/90">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#E0772E]/80 dark:text-white/40">0{features.indexOf(feature) + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card/30 dark:border-white/10 dark:bg-black/20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Code to Career</p>
          <a href="#top" className="cursor-target font-medium text-muted-foreground hover:text-foreground dark:text-white/60 dark:hover:text-white">
            Back to top
          </a>
        </div>
      </footer>
    </div>
  );
}
