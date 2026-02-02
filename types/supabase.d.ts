import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database";

type TypedSupabaseClient = SupabaseClient<Database>;

declare module "#app" {
  interface NuxtApp {
    $supabase: TypedSupabaseClient;
  }
}

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $supabase: TypedSupabaseClient;
  }
}

export type { TypedSupabaseClient };
