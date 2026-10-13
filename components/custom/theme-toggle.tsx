'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAppTranslations } from '@/components/custom/i18n-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { localize } = useAppTranslations();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 cursor-pointer active:scale-95 transition-transform"
      aria-label={localize('Toggle theme')}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
