'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from './theme-provider';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid layout shifts by rendering a simple placeholder during SSR / hydration
    return (
      <div className="size-8 rounded-lg border border-border bg-muted/20 animate-pulse shrink-0" />
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      className="relative flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg border border-border transition-all duration-300 active:scale-95 shrink-0"
      aria-label="Toggle Theme"
    >
      <div className="relative h-4 w-4">
        <Sun className={cn(
          "absolute inset-0 h-full w-full text-brand-accent transition-all duration-300 transform",
          theme === 'light' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        )} />
        <Moon className={cn(
          "absolute inset-0 h-full w-full text-muted-foreground transition-all duration-300 transform",
          theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
        )} />
      </div>
    </Button>
  );
}
export default ThemeToggle;
