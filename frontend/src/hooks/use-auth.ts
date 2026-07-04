'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, CompleteProfilePayload } from '@/services/auth';
import { useAuthStore } from '@/store/auth-store';

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setUser, clearAuth, setLoading } = useAuthStore();

  const { data: profile, isPending } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      try {
        return await authService.getUserProfile();
      } catch (err: any) {
        // If unauthenticated (401), we treat it as null instead of throwing an error to block queries
        if (err.status === 401) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 15, // 15 mins cache validity
    retry: false,
  });

  // Sync state between React Query and Zustand global store
  useEffect(() => {
    if (isPending) {
      setLoading(true);
    } else {
      setUser(profile || null);
    }
  }, [profile, isPending, setUser, setLoading]);

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      clearAuth();
      queryClient.setQueryData(['auth-user'], null);
      router.push('/login');
    },
  });

  const completeProfileMutation = useMutation({
    mutationFn: (payload: CompleteProfilePayload) => authService.completeProfile(payload),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(['auth-user'], updatedUser);
      router.push('/dashboard');
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    completeProfile: completeProfileMutation.mutateAsync,
    isCompletingProfile: completeProfileMutation.isPending,
    completeProfileError: completeProfileMutation.error,
  };
}
export default useAuth;
