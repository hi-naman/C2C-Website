'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import { userService } from '@/services/users';
import { useAuth } from '@/hooks/use-auth';
import { useUpload } from '@/hooks/use-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Camera,
  Search,
  Award,
  Calendar,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const { uploadImage, isUploading: isImageUploading, error: uploadError } = useUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form State
  const [phone, setPhone] = useState('');
  const [hackerrankUsername, setHackerrankUsername] = useState('');
  const [bio, setBio] = useState('');
  
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Admin Panel User Directory State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Load user data into form states on mount/change
  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
      setHackerrankUsername(user.hackerrankUsername || '');
      setBio(user.bio || '');
    }
  }, [user]);

  // Fetch all users list (Admin only)
  const { data: users, isLoading: isUsersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAllUsers,
    enabled: user?.role === 'ADMIN',
    staleTime: 1000 * 60 * 5,
  });

  // Profile fields save mutation
  const updateProfileMutation = useMutation({
    mutationFn: authService.completeProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['auth-user'], updatedUser);
      setSuccessMsg('Profile updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update profile settings.');
    },
  });

  // Avatar upload and update mutation
  const updateAvatarMutation = useMutation({
    mutationFn: authService.updateAvatar,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['auth-user'], updatedUser);
      setSuccessMsg('Profile avatar updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to sync uploaded avatar.');
    },
  });

  // Admin user role update mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: any }) => userService.updateUserRole(id, role),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (updatedUser.id === user?.id) {
        queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      }
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to update user authorization role');
    },
  });

  // Form submit handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    setErrorMsg(null);
    setSuccessMsg(null);

    const phoneRegex = /^[6-9]\d{9}$/;
    if (phone && !phoneRegex.test(phone)) {
      setPhoneError('Enter a valid 10-digit Indian mobile number starting with 6-9');
      return;
    }

    updateProfileMutation.mutate({
      phone,
      hackerrankUsername,
      bio: bio.trim() || undefined,
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const secureUrl = await uploadImage(file, 'avatars');
      updateAvatarMutation.mutate(secureUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Avatar upload failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const filteredUsers = users
    ? users.filter((u) => {
        const matchesSearch =
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
        return matchesSearch && matchesRole;
      })
    : [];

  const getProfileCompleteness = () => {
    if (!user) return 0;
    let score = 0;
    if (user.phone) score += 30;
    if (user.hackerrankUsername) score += 30;
    if (user.bio) score += 20;
    if (user.avatarUrl) score += 20;
    return score;
  };

  if (isAuthLoading) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-xl max-w-md mx-auto mt-12 space-y-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">Authentication Required</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Please sign in to access your profile settings.
          </p>
        </div>
        <Button onClick={() => router.push('/login')} className="rounded-lg h-9 px-4 text-xs">
          Sign In
        </Button>
      </div>
    );
  }

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'N/A';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Profile Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your personal information and developer profiles.
          </p>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg h-9 px-3 text-xs border border-border shrink-0 flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {(errorMsg || uploadError) && (
        <div className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg || uploadError}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3 items-start">
        {/* Main Form Panel */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              {/* Profile Avatar & Header info */}
              <div className="flex items-center gap-4 pb-6 border-b border-border">
                <div 
                  onClick={handleAvatarClick}
                  className="relative group cursor-pointer rounded-full overflow-hidden h-16 w-16 border border-border hover:border-foreground/30 transition-all shrink-0 bg-muted flex items-center justify-center"
                >
                  {isImageUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
                      <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                    </div>
                  )}

                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className={cn(
                        "h-full w-full object-cover group-hover:brightness-90 transition-all",
                        isImageUploading && "brightness-50"
                      )}
                    />
                  ) : (
                    <span className="text-lg font-semibold text-muted-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-foreground tracking-tight">{user.name}</h2>
                    {user.role === 'ADMIN' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                
                <Button
                  type="button"
                  onClick={handleAvatarClick}
                  variant="outline"
                  className="h-8 px-3 text-xs rounded-lg text-muted-foreground hover:text-foreground shrink-0 border border-border"
                >
                  Change Photo
                </Button>
              </div>

              {/* Form Input Fields Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={user.name}
                    disabled
                    className="bg-muted/30 border-border text-muted-foreground rounded-lg cursor-not-allowed text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-muted/30 border-border text-muted-foreground rounded-lg cursor-not-allowed text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Academic Year
                  </label>
                  <Input
                    type="text"
                    value={`Year ${user.year}`}
                    disabled
                    className="bg-muted/30 border-border text-muted-foreground rounded-lg cursor-not-allowed text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Contact Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="bg-background border-border rounded-lg text-xs"
                  />
                  {phoneError && (
                    <p className="text-[11px] text-destructive mt-1">{phoneError}</p>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-foreground">
                    HackerRank Username
                  </label>
                  <Input
                    type="text"
                    value={hackerrankUsername}
                    onChange={(e) => setHackerrankUsername(e.target.value)}
                    placeholder="e.g. hacker_profile"
                    className="bg-background border-border rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-foreground">
                    Bio
                  </label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about your technical background and goals..."
                    maxLength={500}
                    rows={3}
                    className="bg-background border-border rounded-lg text-xs resize-none"
                  />
                </div>
              </div>

              {/* Security notice */}
              <div className="flex gap-3 items-center p-3 rounded-lg border border-border bg-muted/20 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Account authentication is managed securely via Google OAuth.</span>
              </div>

              {/* Form Footer */}
              <div className="flex justify-end pt-2 border-t border-border">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="h-9 px-4 rounded-lg text-xs font-medium transition-all duration-200"
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          
          {/* Profile Strength */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Profile Completion
            </h3>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Strength</span>
                <span className="font-semibold text-foreground">{getProfileCompleteness()}%</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300 rounded-full" 
                  style={{ width: `${getProfileCompleteness()}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Complete your profile details to ensure seamless contest and hackathon registrations.
            </p>
          </div>

          {/* Account Details */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Account Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined
                </span>
                <span className="font-medium text-foreground">{joinDate}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Award className="h-3.5 w-3.5" />
                  HackerRank
                </span>
                <span className={cn("font-medium", user.hackerrankUsername ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                  {user.hackerrankUsername ? 'Connected' : 'Not linked'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5" />
                  Status
                </span>
                <span className="font-medium text-foreground">
                  {user.isProfileComplete ? 'Complete' : 'Incomplete'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Panel User Directory */}
      {user.role === 'ADMIN' && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
            <div>
              <h3 className="text-base font-bold text-foreground tracking-tight">User Directory</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage user permissions and authority roles across the platform.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 w-56 text-xs rounded-lg border-border bg-background"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-background border border-border rounded-lg text-xs font-medium px-2.5 py-1 h-8 focus:outline-none text-foreground cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="SENIOR">Senior</option>
                <option value="MEMBER">Member</option>
              </select>
            </div>
          </div>

          {isUsersLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : usersError ? (
            <div className="p-6 text-center text-xs text-destructive bg-destructive/5 rounded-lg">
              Failed to load directory.
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No users found matching filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-medium">
                    <th className="pb-2.5 pl-1 font-semibold">User</th>
                    <th className="pb-2.5 font-semibold">Email</th>
                    <th className="pb-2.5 font-semibold">Joined</th>
                    <th className="pb-2.5 font-semibold">Year</th>
                    <th className="pb-2.5 font-semibold text-right pr-4">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.map((u) => {
                    const joined = u.createdAt 
                      ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'N/A';
                    
                    const isSelf = u.id === user.id;
                    const isOtherAdmin = u.role === 'ADMIN' && !isSelf;
                    const isDisabled = isSelf || isOtherAdmin;

                    return (
                      <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 pl-1">
                          <div className="flex items-center gap-2.5">
                            {u.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={u.avatarUrl} alt={u.name} className="h-6 w-6 rounded-full border border-border object-cover" />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-[10px] text-muted-foreground">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-semibold text-foreground">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground">{u.email}</td>
                        <td className="py-3 text-muted-foreground">{joined}</td>
                        <td className="py-3 font-medium text-foreground">Year {u.year}</td>
                        <td className="py-3 text-right pr-4">
                          <select
                            value={u.role}
                            disabled={isDisabled || updateRoleMutation.isPending}
                            onChange={(e) => updateRoleMutation.mutate({ id: u.id, role: e.target.value as any })}
                            className={cn(
                              "bg-background border border-border rounded-md text-xs font-medium px-2 h-7 focus:outline-none text-foreground cursor-pointer inline-block",
                              isDisabled && "opacity-50 cursor-not-allowed bg-muted/30"
                            )}
                          >
                            <option value="MEMBER">Member</option>
                            <option value="SENIOR">Senior</option>
                            <option value="ADMIN">Admin</option>
                          </select>
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
    </div>
  );
}
