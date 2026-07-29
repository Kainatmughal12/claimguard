import { createClient } from "@supabase/supabase-js";

// Server-only: bypasses RLS via the service-role key. Never import this
// from a 'use client' component.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
