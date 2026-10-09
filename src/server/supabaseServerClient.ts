// ============================================================
// src/server/supabaseServerClient.ts
// عميل Supabase المخصص للواجهة الخلفية (Server-Side)
// يدعم الاستعلام الآمن للقراءة فقط من جداول المتجر
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serverSupabase: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient | null {
  if (serverSupabase) return serverSupabase;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (url && key && url.trim() !== '' && key.trim() !== '') {
    try {
      serverSupabase = createClient(url.trim(), key.trim(), {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log('✅ Server-side Supabase client initialized successfully');
    } catch (err) {
      console.warn('⚠️ Server-side Supabase initialization failed:', err);
      serverSupabase = null;
    }
  } else {
    console.log('ℹ️ Server-side Supabase credentials not found in env, using graceful fallback mode');
  }

  return serverSupabase;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.trim() && key.trim());
}
