'use client';

import { useEffect, useRef } from 'react';
import { Localize } from '@deriv-com/translations';
import { prefetchAuthReferral } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShieldCheck, Sparkles, LogIn, UserPlus } from 'lucide-react';

interface LoginPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => Promise<void>;
  onSignUp: () => Promise<void>;
  onLoginAsDemo?: () => void;
}

export function LoginPromptDialog({
  open,
  onOpenChange,
  onLogin,
  onSignUp,
  onLoginAsDemo,
}: LoginPromptDialogProps) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (open) {
      startedRef.current = false;
      prefetchAuthReferral();
    }
  }, [open]);

  const handleAction = async (action: () => Promise<void> | void) => {
    onOpenChange(false);
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      await action();
    } catch {
      // safe fallback
    } finally {
      startedRef.current = false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-sm rounded-2xl p-5 border border-border shadow-2xl bg-card">
        <DialogHeader className="text-left space-y-1.5 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                <Localize i18n_default_text="Deriv Account Access" />
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                <Localize i18n_default_text="Log in or test immediately with a demo balance." />
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2">
          {/* Practice Demo Account (Instant Test) */}
          {onLoginAsDemo && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Instant Practice Mode
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Test the automated bot right now with $10,000 USD virtual practice balance.
              </p>
              <Button
                type="button"
                className="w-full h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs active:scale-[0.98] transition-transform cursor-pointer"
                onClick={() => handleAction(onLoginAsDemo)}
              >
                Start Practice Mode ($10,000 USD)
              </Button>
            </div>
          )}

          {/* Official Deriv OAuth */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Deriv Official Login
            </span>
            <Button
              type="button"
              className="w-full h-10 gap-2 font-semibold text-xs active:scale-[0.98] transition-transform cursor-pointer"
              onClick={() => handleAction(onLogin)}
            >
              <LogIn className="h-4 w-4" />
              <Localize i18n_default_text="Log In with Deriv" />
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-10 gap-2 font-semibold text-xs active:scale-[0.98] transition-transform cursor-pointer"
              onClick={() => handleAction(onSignUp)}
            >
              <UserPlus className="h-4 w-4" />
              <Localize i18n_default_text="Create Free Account" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
