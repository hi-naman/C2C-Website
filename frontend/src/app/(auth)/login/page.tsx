'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

function LoginContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const handleGoogleLogin = () => {
    // Direct redirect to the backend auth path
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
      {/* Premium Minimalist Background Grid */}
      <div className="absolute inset-0 -z-10 dot-grid opacity-35" />

      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-8 shadow-sm transition-all duration-200 hover:border-foreground/10">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#202d3d] dark:bg-zinc-100 border border-border/10 mb-4 font-mono text-[24px] font-black tracking-tighter leading-none shadow-md select-none shrink-0 transition-colors">
            <span className="text-[#E0772E]">C</span>
            <span className="text-white dark:text-zinc-950 transition-colors">2</span>
            <span className="text-[#E0772E]">C</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Code to Career
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect your college email and accelerate your path.
          </p>
        </div>

        {errorParam === 'invalid_domain' && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 dark:border-amber-500/25 dark:bg-amber-500/10 p-4 text-left space-y-2">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-wider font-mono">College Email Required</p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Registration is restricted to MNIT Jaipur students and staff. Please sign in using your official <strong className="font-semibold text-foreground">@mnit.ac.in</strong> email address.
            </p>
          </div>
        )}

        {errorParam && errorParam !== 'invalid_domain' && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-left space-y-2">
            <div className="flex items-center gap-2.5 text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-wider font-mono">Authentication Failed</p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {errorParam === 'unauthorized'
                ? 'Your account is not authorized to access this platform. Please use an authorized college email.'
                : 'An unexpected authentication error occurred. Please try signing in again.'}
            </p>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <Button
            onClick={handleGoogleLogin}
            size="lg"
            className="w-full flex items-center justify-center gap-3"
          >
            <GoogleIcon className="h-4 w-4 fill-current shrink-0" />
            {errorParam === 'invalid_domain' ? 'Sign in with @mnit.ac.in' : 'Continue with Google'}
          </Button>

          {errorParam && (
            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to clean sign in
              </Link>
            </div>
          )}

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-4 text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
              Features
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl border border-border bg-background p-3">
              <p className="text-xs font-semibold text-foreground">Contests</p>
              <p className="text-[10px] text-muted-foreground mt-1 font-sans">Synced HackerRank challenges</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-3">
              <p className="text-xs font-semibold text-foreground">Hackathons</p>
              <p className="text-[10px] text-muted-foreground mt-1 font-sans">Team registrations & grading</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-3">
              <p className="text-xs font-semibold text-foreground">Forum</p>
              <p className="text-[10px] text-muted-foreground mt-1 font-sans">Markdown topics & updates</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-3">
              <p className="text-xs font-semibold text-foreground">Leaderboard</p>
              <p className="text-[10px] text-muted-foreground mt-1 font-sans">Year-wise ranks & trends</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground font-mono">
        &copy; {new Date().getFullYear()} C2C Platform. Built for developers.
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground font-mono text-sm">
        Loading authentication page...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
