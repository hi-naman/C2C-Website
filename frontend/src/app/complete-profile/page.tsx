'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, UserCheck, Phone, User, BookOpen } from 'lucide-react';

// Form validation schema mirrored with backend validators
const completeProfileSchema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, { message: 'Must be a valid 10-digit Indian phone number starting with 6-9' }),
  hackerrankUsername: z
    .string()
    .min(1, { message: 'HackerRank username is required' })
    .max(50, { message: 'Username is too long' }),
  bio: z
    .string()
    .max(500, { message: 'Bio cannot exceed 500 characters' })
    .optional(),
});

type CompleteProfileValues = z.infer<typeof completeProfileSchema>;

export default function CompleteProfilePage() {
  const { user, isAuthenticated, isLoading, completeProfile, isCompletingProfile } = useAuth();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CompleteProfileValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      phone: '',
      hackerrankUsername: '',
      bio: '',
    },
  });

  const bioContent = watch('bio') || '';

  // Auth gate checks:
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user && user.isProfileComplete) {
        // If profile is already complete, redirect to dashboard
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const onSubmit = async (values: CompleteProfileValues) => {
    setErrorMessage(null);
    try {
      await completeProfile({
        phone: values.phone,
        hackerrankUsername: values.hackerrankUsername,
        bio: values.bio || undefined,
      });
      // useAuth automatically routes to /dashboard upon mutation success
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete profile. Please try again.');
    }
  };

  if (isLoading || !isAuthenticated || (user && user.isProfileComplete)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground font-mono text-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span>Syncing authentication status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
      {/* Premium Minimalist Background Grid */}
      <div className="absolute inset-0 -z-10 dot-grid opacity-35" />

      <div className="w-full max-w-lg space-y-8 rounded-xl border border-border bg-card p-8 shadow-sm transition-all duration-200 hover:border-foreground/10">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground border border-border mb-4">
            <UserCheck className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Hey <span className="font-semibold text-foreground">{user?.name}</span>, we need a few more details to set up your student sandbox environment.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Phone input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground select-none">
                +91
              </span>
              <Input
                type="tel"
                placeholder="9876543210"
                className="pl-12 bg-background"
                {...register('phone')}
              />
            </div>
            {errors.phone ? (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            ) : (
              <p className="text-[10px] text-muted-foreground font-mono">10-digit Indian phone number starting with 6-9</p>
            )}
          </div>

          {/* HackerRank username */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              HackerRank Username
            </label>
            <Input
              type="text"
              placeholder="username_hr"
              className="bg-background"
              {...register('hackerrankUsername')}
            />
            {errors.hackerrankUsername ? (
              <p className="text-xs text-destructive">{errors.hackerrankUsername.message}</p>
            ) : (
              <p className="text-[10px] text-muted-foreground font-mono">Used to synchronize and grade competitive programming contests</p>
            )}
          </div>

          {/* Bio input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Developer Bio
            </label>
            <Textarea
              placeholder="Tell us about your interests, skills, or what you are looking to build..."
              className="min-h-[100px] bg-background"
              maxLength={500}
              {...register('bio')}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.bio ? (
                <p className="text-xs text-destructive">{errors.bio.message}</p>
              ) : (
                <span />
              )}
              <span className="text-[10px] font-mono text-muted-foreground">
                {bioContent.length}/500 chars
              </span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isCompletingProfile}
            size="lg"
            className="w-full flex items-center justify-center gap-2 mt-8"
          >
            {isCompletingProfile ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                Saving Profile Details...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Finish Setup
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
