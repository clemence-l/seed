import type { Session, User } from "@supabase/supabase-js";
import type { Profile } from "../../types/database";
import type { TypedSupabaseClient } from "../../types/supabase";
let authListenerAttached = false;

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  ready: boolean;
}

const state = reactive<AuthState>({
  user: null,
  session: null,
  profile: null,
  loading: false,
  error: null,
  ready: false,
});

function getErrorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

function normalizeName(name?: string): string | null {
  if (typeof name !== "string") return null;
  const v = name.trim();
  return v.length > 0 ? v : null;
}

/** Récupère un display name depuis user_metadata (fallback full_name/email) */
function readDisplayName(user: User | null): string | null {
  if (!user) return null;

  const meta = user.user_metadata;
  const display = normalizeName(
    typeof meta?.display_name === "string" ? meta.display_name : undefined,
  );
  if (display) return display;

  const full = normalizeName(
    typeof meta?.full_name === "string" ? meta.full_name : undefined,
  );
  if (full) return full;

  // fallback si rien
  return normalizeName(user.email ?? undefined);
}

export function useAuth() {
  const nuxtApp = useNuxtApp();

  function getSupabase(): TypedSupabaseClient {
    const client = nuxtApp.$supabase as TypedSupabaseClient | undefined;
    if (!client)
      throw new Error(
        "[Auth] Supabase client not injected. Check plugin order.",
      );
    return client;
  }

  /** Charge le profil (optionnel). Ne throw pas si absent. */
  async function fetchProfile(userId: string): Promise<void> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, avatar_url, created_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[Auth] Error fetching profile:", error);
      state.profile = null;
      return;
    }

    state.profile = data as Profile;
  }

  /** Charge la session + user + profile */
  async function fetchSession(): Promise<void> {
    const supabase = getSupabase();
    state.loading = true;
    state.error = null;

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      state.session = data.session;
      state.user = data.session?.user ?? null;

      if (state.user) {
        await fetchProfile(state.user.id);
      } else {
        state.profile = null;
      }
    } catch (e: unknown) {
      state.error = getErrorMessage(e, "Erreur de session");
    } finally {
      state.loading = false;
      state.ready = true;
    }
  }

  /** Met à jour le display name dans Auth (user_metadata) */
  async function updateDisplayName(
    displayName: string,
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    const name = normalizeName(displayName);

    console.log("[useAuth] updateDisplayName called", name);

    if (!state.user) return { success: false, error: "Non connecté" };
    if (!name) return { success: false, error: "Nom invalide" };

    state.loading = true;
    state.error = null;

    try {
      console.log("[useAuth] calling supabase.auth.updateUser");
      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: name },
      });
      console.log("[useAuth] supabase response", { data, error });
      if (error) throw error;

      // supabase renvoie l'utilisateur mis à jour
      state.user = data.user ?? state.user;
      console.log("[useAuth] state.user updated, returning success");

      return { success: true };
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Erreur lors de la mise à jour");
      console.error("[useAuth] updateDisplayName error", e);
      state.error = message;
      return { success: false, error: message };
    } finally {
      state.loading = false;
    }
  }

  /** Met à jour l'email de l'utilisateur */
  async function updateEmail(
    newEmail: string,
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();

    console.log("[useAuth] updateEmail called", newEmail);

    if (!state.user) return { success: false, error: "Non connecté" };
    if (!newEmail.trim()) return { success: false, error: "Email invalide" };

    state.loading = true;
    state.error = null;

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      console.log("[useAuth] updateEmail response error", error);
      if (error) throw error;
      return { success: true };
    } catch (e: unknown) {
      const message = getErrorMessage(
        e,
        "Erreur lors de la mise à jour de l'email",
      );
      console.error("[useAuth] updateEmail caught", e);
      state.error = message;
      return { success: false, error: message };
    } finally {
      state.loading = false;
    }
  }

  /** Met à jour le mot de passe de l'utilisateur */
  async function updatePassword(
    newPassword: string,
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();

    if (!state.user) return { success: false, error: "Non connecté" };
    if (newPassword.length < 6)
      return {
        success: false,
        error: "Le mot de passe doit faire au moins 6 caractères",
      };

    state.loading = true;
    state.error = null;

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return { success: true };
    } catch (e: unknown) {
      const message = getErrorMessage(
        e,
        "Erreur lors de la mise à jour du mot de passe",
      );
      state.error = message;
      return { success: false, error: message };
    } finally {
      state.loading = false;
    }
  }

  /** Met à jour l'avatar de l'utilisateur (upload + update profile) */
  async function updateAvatar(
    file: File,
  ): Promise<{ success: boolean; error?: string; url?: string }> {
    const supabase = getSupabase();

    if (!state.user) return { success: false, error: "Non connecté" };

    state.loading = true;
    state.error = null;

    try {
      // Upload vers le bucket "avatars"
      const fileExt = file.name.split(".").pop();
      const fileName = `${state.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${state.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Mettre à jour le profil
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", state.user.id);

      if (updateError) throw updateError;

      // Mettre à jour le state local
      if (state.profile) {
        state.profile = { ...state.profile, avatar_url: avatarUrl };
      }

      return { success: true, url: avatarUrl };
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Erreur lors de l'upload de l'avatar");
      state.error = message;
      return { success: false, error: message };
    } finally {
      state.loading = false;
    }
  }

  /** Connexion */
  async function signIn(
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    state.loading = true;
    state.error = null;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      state.session = data.session;
      state.user = data.user;

      if (data.user) {
        await fetchProfile(data.user.id);
      }

      return { success: true };
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Erreur lors de la connexion");
      state.error = message;
      return { success: false, error: message };
    } finally {
      state.loading = false;
    }
  }

  /** Connexion via provider OAuth (Google, linkedin, apple, ...)
   * Uses Supabase auth.signInWithOAuth under the hood.
   * Redirect URL will default to window.location.origin + '/auth/callback' when available.
   */
  async function signInWithProvider(
    provider: string,
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    state.loading = true;
    state.error = null;

    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: redirectTo ? { redirectTo } : undefined,
      });

      if (error) throw error;

      // When redirect flow is used, Supabase will redirect the browser and
      // there is no immediate session here. Consider this a success.
      return { success: true };
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Erreur lors de la connexion OAuth");
      state.error = message;
      return { success: false, error: message };
    } finally {
      state.loading = false;
    }
  }

  /** Inscription (on stocke le pseudo dans user_metadata.display_name) */
  async function signUp(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<{
    success: boolean;
    error?: string;
    needsConfirmation?: boolean;
  }> {
    const supabase = getSupabase();
    state.loading = true;
    state.error = null;

    const name = normalizeName(displayName);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: name ? { data: { display_name: name } } : undefined,
      });
      if (error) throw error;

      // Si confirmation email -> pas de session
      if (data.user && !data.session) {
        return { success: true, needsConfirmation: true };
      }

      state.session = data.session;
      state.user = data.user;

      if (data.user) {
        await fetchProfile(data.user.id);
      }

      return { success: true };
    } catch (e: unknown) {
      const message = getErrorMessage(e, "Erreur lors de l'inscription");
      state.error = message;
      return { success: false, error: message };
    } finally {
      state.loading = false;
    }
  }

  /** Déconnexion */
  async function signOut(): Promise<void> {
    const supabase = getSupabase();
    state.loading = true;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      state.session = null;
      state.user = null;
      state.profile = null;
    } catch (e: unknown) {
      state.error = getErrorMessage(e, "Erreur de déconnexion");
    } finally {
      state.loading = false;
    }
  }

  async function initAuth(): Promise<void> {
    const supabase = getSupabase();
    console.debug("[useAuth] initAuth: fetching session...");
    await fetchSession();
    console.debug("[useAuth] initAuth: fetchSession done, ready=", state.ready);

    if (authListenerAttached) return;
    authListenerAttached = true;

    supabase.auth.onAuthStateChange(async (_event, session) => {
      state.session = session;
      state.user = session?.user ?? null;

      if (state.user) await fetchProfile(state.user.id);
      else state.profile = null;
    });
  }

  return {
    // state
    user: computed(() => state.user),
    session: computed(() => state.session),
    profile: computed(() => state.profile),
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    isLoggedIn: computed(() => !!state.session),
    ready: computed(() => state.ready),

    // derived
    displayName: computed(() => readDisplayName(state.user)),

    // actions
    signIn,
    signUp,
    signOut,
    signInWithProvider,
    initAuth,
    fetchSession,
    fetchProfile,
    updateDisplayName,
    updateEmail,
    updatePassword,
    updateAvatar,
  };
}
