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
  ShieldAlert,
  Search,
  User,
  Phone,
  Mail,
  UserCheck,
  Award,
  Sparkles,
  Layers,
  Calendar,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle
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
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
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
      // In case the admin updated their own role (prevented in controller, but invalidate anyway for safety)
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

    // Validate phone number format (Indian format: starts with 6-9, exactly 10 digits)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (phone && !phoneRegex.test(phone)) {
      setPhoneError('Must be a valid 10-digit Indian mobile number (starting with 6-9)');
      return;
    }

    updateProfileMutation.mutate({
      phone,
      hackerrankUsername,
      bio: bio.trim() || undefined,
    });
  };

  // Avatar upload trigger
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

  // Filter users based on search query and role selection
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
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
          <div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-border rounded-2xl max-w-xl mx-auto mt-12 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-base font-bold text-foreground">Authentication Required</h3>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          Please log in to view your profile settings and platform records.
        </p>
        <Button onClick={() => router.push('/login')} className="rounded-xl h-9 text-xs">
          Go to Login
        </Button>
      </div>
    );
  }

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A';

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">My Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your personal information, connect accounts, and view platform metrics.
          </p>
        </div>

        <Button
          onClick={handleLogout}
          variant="ghost"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-9 text-xs border border-border hover:border-destructive/20 self-start shrink-0 flex items-center gap-2"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log Out
        </Button>
      </div>

      {/* Message Notifications */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-500">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {(errorMsg || uploadError) && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg || uploadError}</span>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        {/* Profile details panel (Left 2 columns) */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card shadow-xs p-6 sm:p-8">
            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              {/* Profile Avatar section */}
              <div className="flex flex-col sm:flex-row gap-5 items-center pb-6 border-b border-border/60">
                <div 
                  onClick={handleAvatarClick}
                  className="relative group/avatar cursor-pointer rounded-full overflow-hidden h-20 w-20 border-2 border-border hover:border-primary transition-all shrink-0 bg-muted flex items-center justify-center"
                >
                  {isImageUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : null}

                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className={cn(
                        "h-full w-full object-cover group-hover/avatar:brightness-75 transition-all",
                        isImageUploading && "brightness-50"
                      )}
                    />
                  ) : (
                    <span className="text-xl font-bold text-muted-foreground group-hover/avatar:brightness-75">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </div>

                <div className="text-center sm:text-left flex-1 space-y-1">
                  <h3 className="text-base font-bold text-foreground tracking-tight">{user.name}</h3>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-[10px] font-mono text-muted-foreground/80 uppercase tracking-widest pt-1 flex items-center justify-center sm:justify-start gap-1">
                    <User className="h-3 w-3 text-primary" />
                    Role: {user.role}
                  </p>
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
                  className="h-8 text-[10px] font-mono uppercase tracking-wider rounded-lg text-muted-foreground hover:text-foreground shrink-0 border border-border"
                >
                  Change Image
                </Button>
              </div>

              {/* Form Input Fields Grid */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">
                    Full Name (Google Account Linked)
                  </label>
                  <Input
                    type="text"
                    value={user.name}
                    disabled
                    className="bg-muted/40 border-border/80 text-muted-foreground rounded-xl cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-muted/40 border-border/80 text-muted-foreground rounded-xl cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">
                    Academic Year
                  </label>
                  <Input
                    type="text"
                    value={`Year ${user.year}`}
                    disabled
                    className="bg-muted/40 border-border/80 text-muted-foreground rounded-xl cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">
                    Platform Authorization Role
                  </label>
                  <Input
                    type="text"
                    value={user.role}
                    disabled
                    className="bg-muted/40 border-border/80 text-muted-foreground rounded-xl cursor-not-allowed uppercase font-mono tracking-wider"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">
                    Contact Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="bg-background border-border focus-visible:ring-primary focus-visible:border-primary rounded-xl"
                  />
                  {phoneError && (
                    <p className="text-[10px] text-destructive font-mono mt-1">{phoneError}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">
                    HackerRank Username
                  </label>
                  <Input
                    type="text"
                    value={hackerrankUsername}
                    onChange={(e) => setHackerrankUsername(e.target.value)}
                    placeholder="e.g. hacker_profile"
                    className="bg-background border-border focus-visible:ring-primary focus-visible:border-primary rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 block">
                    Short Bio (Max 500 characters)
                  </label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief details about your background, career interests, and skills..."
                    maxLength={500}
                    rows={4}
                    className="bg-background border-border focus-visible:ring-primary focus-visible:border-primary rounded-xl resize-none"
                  />
                </div>
              </div>

              {/* Password notice banner */}
              <div className="flex gap-3.5 items-start p-4 rounded-xl border border-border/80 bg-muted/20 text-xs">
                <ShieldAlert className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Google OAuth Authentication</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Your account credentials, password keys, and login parameters are securely managed via Google. Password updates can be performed in your Google Account Settings.
                  </p>
                </div>
              </div>

              {/* Form Footer */}
              <div className="flex justify-end pt-2 border-t border-border/60">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/95 h-10 px-5 rounded-xl text-xs hover:scale-[1.02] transition-transform duration-200"
                >
                  {updateProfileMutation.isPending ? 'Saving Settings...' : 'Save Profile Details'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Account statistics & completion sidebar (Right 1 column) */}
        <div className="space-y-6">
          
          {/* Profile completeness card */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-foreground">
              Profile Strength
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-bold text-foreground">{getProfileCompleteness()}%</span>
              </div>
              <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300 rounded-full" 
                  style={{ width: `${getProfileCompleteness()}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Completing your phone, biography, HackerRank, and avatar details ensures organizers can contact and verify your challenge registration details.
            </p>
          </div>

          {/* User statistics summary */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-foreground">
              Account Metadata
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl border border-border/60 bg-muted flex items-center justify-center text-muted-foreground">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase leading-none">Joined Platform</p>
                  <p className="text-xs font-bold text-foreground mt-1.5">{joinDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-9 w-9 rounded-xl border flex items-center justify-center",
                  user.hackerrankUsername 
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500" 
                    : "border-border/60 bg-muted text-muted-foreground"
                )}>
                  <Award className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase leading-none">HackerRank sync</p>
                  <p className="text-xs font-bold text-foreground mt-1.5">
                    {user.hackerrankUsername ? 'Linked' : 'Not Connected'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl border border-border/60 bg-muted flex items-center justify-center text-muted-foreground">
                  <UserCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase leading-none">Profile Status</p>
                  <p className="text-xs font-bold text-foreground mt-1.5">
                    {user.isProfileComplete ? 'Complete' : 'Incomplete'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Panel User Directory Area */}
      {user.role === 'ADMIN' && (
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <h3 className="text-base font-bold text-foreground tracking-tight">Admin User Directory</h3>
              <p className="text-xs text-muted-foreground mt-1">
                View, search, and manage platform roles for all accounts.
              </p>
            </div>

            {/* Admin Directory controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 w-60 text-xs rounded-xl border-border bg-background"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-background border border-border rounded-xl text-xs font-medium px-3 py-1.5 h-9 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary text-foreground cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="SENIOR">Senior</option>
                <option value="MEMBER">Member</option>
              </select>
            </div>
          </div>

          {/* User Directory Table view */}
          {isUsersLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : usersError ? (
            <div className="p-8 text-center text-xs text-destructive bg-destructive/5 font-mono">
              Failed to fetch directory accounts.
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-12">No users matched your query.</p>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground uppercase font-mono text-[10px] tracking-wider">
                    <th className="pb-3 pl-2 font-semibold">User</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold">Joined Date</th>
                    <th className="pb-3 font-semibold">Year</th>
                    <th className="pb-3 font-semibold text-right pr-6">Role Authority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredUsers.map((u) => {
                    const joined = u.createdAt 
                      ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'N/A';
                    
                    // Business Rules:
                    // 1. You cannot demote yourself
                    // 2. You cannot edit another ADMIN's role
                    const isSelf = u.id === user.id;
                    const isOtherAdmin = u.role === 'ADMIN' && !isSelf;
                    const isDisabled = isSelf || isOtherAdmin;

                    return (
                      <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                        <td className="py-3.5 pl-2 font-medium">
                          <div className="flex items-center gap-3">
                            {u.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={u.avatarUrl} alt={u.name} className="h-7 w-7 rounded-full border border-border object-cover" />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[10px]">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-semibold text-foreground">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-muted-foreground">{u.email}</td>
                        <td className="py-3.5 text-muted-foreground">{joined}</td>
                        <td className="py-3.5 font-semibold text-foreground">Year {u.year}</td>
                        <td className="py-3.5 text-right pr-6">
                          <select
                            value={u.role}
                            disabled={isDisabled || updateRoleMutation.isPending}
                            onChange={(e) => updateRoleMutation.mutate({ id: u.id, role: e.target.value as any })}
                            className={cn(
                              "bg-background border border-border rounded-lg text-xs font-semibold px-2 py-1 h-8 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary text-foreground cursor-pointer inline-block",
                              isDisabled && "opacity-60 cursor-not-allowed bg-muted/40"
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
