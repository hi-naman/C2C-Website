'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Layers,
  MessageSquare,
  Award,
  Calendar,
  Menu,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/shared/theme-toggle';

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick?: () => void;
}

function NavItem({ href, label, icon: Icon, active, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border',
        active
          ? 'bg-secondary/70 text-foreground border-border shadow-xs'
          : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground border-transparent'
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0 transition-colors', active ? 'text-brand-accent' : 'text-muted-foreground')} />
      <span>{label}</span>
    </Link>
  );
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contests', label: 'Events', icon: Layers },
  { href: '/forum', label: 'Forum', icon: MessageSquare },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/leaderboard', label: 'Leaderboard', icon: Award },
];

interface SidebarContentProps {
  user: any;
  logout: () => void;
  isActive: (href: string) => boolean;
  onItemClick?: () => void;
}

function SidebarContent({ user, logout, isActive, onItemClick }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col justify-between p-6">
      <div className="space-y-6">
        {/* Branding */}
        <div className="flex items-center gap-2.5 px-2">
          <div className="h-10 w-10 rounded-xl bg-[#202d3d] dark:bg-zinc-100 border border-border/10 flex items-center justify-center font-mono text-[16px] font-black tracking-tighter leading-none shadow-sm select-none shrink-0 transition-colors">
            <span className="text-[#E0772E]">C</span>
            <span className="text-white dark:text-zinc-950 transition-colors">2</span>
            <span className="text-[#E0772E]">C</span>
          </div>
          <span className="font-semibold tracking-tight text-foreground">Code to Career</span>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
              onClick={onItemClick}
            />
          ))}
        </nav>
      </div>

      {/* User profile footer */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between gap-3 px-2 py-2">
          <Link
            href="/profile"
            onClick={onItemClick}
            className="flex items-center gap-3 overflow-hidden group hover:bg-muted/50 p-1.5 rounded-xl transition-all cursor-pointer flex-1 min-w-0"
          >
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-8 w-8 rounded-full border border-border group-hover:border-primary transition-colors shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-secondary text-foreground border border-border flex items-center justify-center font-semibold text-sm shrink-0 group-hover:border-primary transition-colors">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-foreground truncate leading-none group-hover:text-primary transition-colors">{user?.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mt-1">{user?.role}</span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user && !user.isProfileComplete) {
        router.push('/complete-profile');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Helper to determine active route
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    if (href === '/hackathons') {
      return (
        pathname.startsWith('/hackathons') ||
        pathname.startsWith('/contests') ||
        pathname.startsWith('/sessions') ||
        pathname.startsWith('/camps')
      );
    }
    return pathname.startsWith(href);
  };

  const getPageTitle = () => {
    const activeItem = navItems.find((item) => isActive(item.href));
    return activeItem ? activeItem.label : 'C2C Platform';
  };

  if (isLoading || !isAuthenticated || (user && !user.isProfileComplete)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground font-mono text-sm">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span>Verifying credentials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex animate-fade-in overflow-hidden">
      {/* Desktop Sidebar (Left Panel) */}
      <aside className="hidden md:block w-[260px] border-r border-border bg-card shrink-0 h-full overflow-hidden">
        <SidebarContent user={user} logout={logout} isActive={isActive} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header / Mobile Navigation */}
        <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/60 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Sheet Trigger */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-muted-foreground hover:bg-muted border border-border"
                  />
                }
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[260px] bg-card border-r border-border">
                <SidebarContent user={user} logout={logout} isActive={isActive} onItemClick={() => setIsMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <span className="font-semibold text-foreground">{getPageTitle()}</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-xs font-mono border border-border bg-muted/30 text-muted-foreground px-2 py-1 rounded">
              Year {user?.year}
            </span>
          </div>
        </header>

        {/* Main Dashboard Child Screens Panel */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
