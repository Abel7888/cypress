"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export interface TrialStatus {
  isLoading: boolean;
  isTrial: boolean;
  isExpired: boolean;
  daysLeft: number;
  trialExpiresAt: string | null;
  seatLimit: number;
}

const DEFAULT_STATUS: TrialStatus = {
  isLoading: true,
  isTrial: false,
  isExpired: false,
  daysLeft: 0,
  trialExpiresAt: null,
  seatLimit: 1,
};

export default function useTrialStatus(): TrialStatus {
  const [status, setStatus] = useState<TrialStatus>(DEFAULT_STATUS);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;

        if (error || !data?.user) {
          setStatus({ ...DEFAULT_STATUS, isLoading: false });
          return;
        }

        const meta = (data.user.user_metadata || {}) as {
          is_trial?: boolean;
          trial_expires_at?: string;
          trial_seat_limit?: number;
        };

        const isTrial = meta.is_trial === true;
        const trialExpiresAt = meta.trial_expires_at || null;
        const seatLimit =
          typeof meta.trial_seat_limit === "number" ? meta.trial_seat_limit : 1;

        let daysLeft = 0;
        let isExpired = false;

        if (isTrial && trialExpiresAt) {
          const expiryMs = new Date(trialExpiresAt).getTime();
          if (!Number.isNaN(expiryMs)) {
            daysLeft = Math.max(
              0,
              Math.ceil((expiryMs - Date.now()) / 86400000)
            );
            isExpired = expiryMs <= Date.now();
          }
        }

        setStatus({
          isLoading: false,
          isTrial,
          isExpired,
          daysLeft: isExpired || !isTrial ? 0 : daysLeft,
          trialExpiresAt,
          seatLimit,
        });
      } catch {
        if (!cancelled) setStatus({ ...DEFAULT_STATUS, isLoading: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
