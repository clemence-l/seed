import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const supabaseUrl = config.public.supabaseUrl as string;
  const supabaseAnonKey = config.public.supabaseAnonKey as string;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "[Supabase] Missing NUXT_PUBLIC_SUPABASE_URL or NUXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const supabase: SupabaseClient<Database> = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        // Côté serveur, pas de persistance de session
        persistSession: import.meta.client,
        autoRefreshToken: import.meta.client,
        detectSessionInUrl: import.meta.client,
      },
    },
  );

  return {
    provide: {
      supabase,
    },
  };
});
