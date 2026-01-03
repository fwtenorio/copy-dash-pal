// Runtime-safe Supabase client wrapper.
//
// Why this exists:
// In some preview/build contexts, `import.meta.env.VITE_SUPABASE_URL` may be undefined,
// which crashes the app at import time with "supabaseUrl is required".
//
// The URL + anon key below are *publishable* values (safe to be public) and match the
// auto-managed environment variables.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const FALLBACK_SUPABASE_URL = "https://rhlfnrtwuyskswefzrxu.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobGZucnR3dXlza3N3ZWZ6cnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDcxMjYsImV4cCI6MjA4MjY4MzEyNn0.bUVW73aWdKiKjTn7Y46kHb1DQOBev1JzDyHtgLkGmIA";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
