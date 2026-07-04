'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button, buttonVariants } from '@/components/ui/button';
import { ArrowRight, Code, Trophy, MessageSquare, Terminal, Layers } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/theme-toggle';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  const handleStart = () => {
    if (isAuthenticated) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = `${API_BASE_URL}/api/auth/google`;
    }
  };

  return (
    <div className="relative min-h-screen bg-background flex flex-col justify-between overflow-hidden animate-fade-in">
      {/* Premium Minimalist Background Grid */}
      <div className="absolute inset-0 -z-10 dot-grid opacity-35" />

      {/* Navigation */}
      <header className="w-full border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-[#202d3d] dark:bg-zinc-100 border border-border/10 flex items-center justify-center font-mono text-[16px] font-black tracking-tighter leading-none shadow-sm select-none shrink-0 transition-colors">
              <span className="text-[#E0772E]">C</span>
              <span className="text-white dark:text-zinc-950 transition-colors">2</span>
              <span className="text-[#E0772E]">C</span>
            </div>
            <span className="font-semibold tracking-tight text-foreground">Code to Career</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded-lg bg-muted"></div>
            ) : isAuthenticated ? (
              <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Dashboard
              </Link>
            ) : (
              <Button onClick={handleStart} size="sm">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex items-center justify-center py-24 sm:py-32 px-4 relative">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-mono text-muted-foreground">
            <Terminal className="h-3.5 w-3.5 text-brand-accent" />
            <span>Accelerate Your Coding Career</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-[1.1] max-w-3xl mx-auto">
              Bridging the Gap from <br />
              <span className="text-foreground">
                Code to Career
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
              Coordinate college hackathons, participate in automated coding contests synced with HackerRank, check year-wise ranks, and share insights in our developer forums.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Button
              onClick={handleStart}
              size="lg"
              className="w-full sm:w-auto px-8"
            >
              {isLoading ? (
                <span>Loading session...</span>
              ) : isAuthenticated ? (
                <>
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Get Started <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <a
              href={`${API_BASE_URL}/api/docs`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({
                variant: 'outline',
                size: 'lg',
                className: 'w-full sm:w-auto px-8'
              })}
            >
              Explore APIs
            </a>
          </div>

          {/* Cards Panel */}
          <div className="pt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:scale-[1.02] hover:border-foreground/20 hover:shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-secondary text-foreground flex items-center justify-center border border-border mb-4">
                <Trophy className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Sync Contests</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Join access-gated competitive events synced directly with your HackerRank credentials.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:scale-[1.02] hover:border-foreground/20 hover:shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-secondary text-foreground flex items-center justify-center border border-border mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Hackathon Arenas</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Form dynamic team slots, submit git repos, and track grading lists as a student or admin.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:scale-[1.02] hover:border-foreground/20 hover:shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-secondary text-foreground flex items-center justify-center border border-border mb-4">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Interactive Forum</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Write posts with full markdown, request cloudinary image upload tokens, and comment in real-time.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border py-8 text-center text-xs text-muted-foreground font-mono bg-background">
        &copy; {new Date().getFullYear()} Code to Career (C2C). All rights reserved.
      </footer>
    </div>
  );
}
