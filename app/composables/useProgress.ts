import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import type { Database } from "../../types/database";

type SupabaseClient = ReturnType<typeof useNuxtApp>["$supabase"];

// Définition locale du schéma minimal de la table `plays` (tel que décrit)
export type PlayRow = {
  id: string;
  user_id: string;
  level_id: string;
  started_at: string;
  completed_at: string | null;
  status: string; // 'started' | 'completed'
  success: boolean | null;
  moves: number | null;
  time_spent_seconds: number | null;
  created_at: string;
};

export type PlayInsert = {
  user_id: string;
  level_id: string;
  status?: string;
  success?: boolean | null;
  moves?: number | null;
  time_spent_seconds?: number | null;
};

export type PlayUpdate = Partial<PlayInsert> & {
  completed_at?: string | null;
};

export function useProgress() {
  const nuxtApp = useNuxtApp();
  const auth = useAuth();

  function supabase(): SupabaseClient {
    return nuxtApp.$supabase as SupabaseClient;
  }

  function requireAuth(): void {
    if (!auth.isLoggedIn.value) {
      navigateTo("/auth/login");
    }
  }

  async function isLevelAlreadyWon(levelId: string): Promise<boolean> {
    const user = auth.user.value;
    if (!user) return false;

    try {
      const { data, error } = await supabase()
        .from("plays")
        .select("id")
        .eq("user_id", user.id)
        .eq("level_id", levelId)
        .eq("success", true)
        .limit(1);

      if (error) {
        console.error("[useProgress] isLevelAlreadyWon error:", error);
        // Si c'est une erreur UUID, retourner false au lieu de throw
        if (error.message.includes("uuid")) {
          console.warn(
            "[useProgress] level_id is not a valid UUID, returning false",
          );
          return false;
        }
        throw new Error(error.message);
      }
      return (data?.length ?? 0) > 0;
    } catch (err) {
      console.error("[useProgress] isLevelAlreadyWon caught error:", err);
      return false;
    }
  }

  // Crée ou récupère un play 'started'. Retourne l'id du play.
  async function startPlay(levelId: string): Promise<string> {
    const user = auth.user.value;
    console.log("[useProgress] startPlay called", { levelId, user: user?.id });
    if (!user) {
      console.error("[useProgress] startPlay: NOT_AUTHENTICATED");
      throw new Error("NOT_AUTHENTICATED");
    }

    // Chercher un started existant
    const existingRes = (await supabase()
      .from("plays")
      .select("id, status, created_at")
      .eq("user_id", user.id)
      .eq("level_id", levelId)
      .eq("status", "started")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()) as PostgrestSingleResponse<{
      id: string;
      status: string;
      created_at: string;
    }>;

    console.log("[useProgress] existing play check:", existingRes);
    if (existingRes.error) {
      console.error(
        "[useProgress] error checking existing play:",
        existingRes.error,
      );
      // Si c'est une erreur UUID, on ne peut pas utiliser plays avec cet ID
      if (existingRes.error.message.includes("uuid")) {
        console.warn(
          "[useProgress] level_id is not a valid UUID, cannot use plays table",
        );
        throw new Error("INVALID_LEVEL_ID");
      }
      throw new Error(existingRes.error.message);
    }
    if (existingRes.data && existingRes.data.id) {
      console.log("[useProgress] reusing existing play:", existingRes.data.id);
      return existingRes.data.id;
    }

    const payload: PlayInsert = {
      user_id: user.id,
      level_id: levelId,
      status: "started",
      success: null,
    };
    console.log("[useProgress] inserting new play:", payload);

    const res = (await supabase()
      .from("plays")
      .insert(
        payload as unknown as Database["public"]["Tables"]["plays"]["Insert"],
      )
      .select("id")
      .single()) as PostgrestSingleResponse<PlayRow>;
    console.log("[useProgress] insert result:", res);
    if (res.error) {
      console.error("[useProgress] insert error:", res.error);
      if (res.error.message.includes("uuid")) {
        console.warn(
          "[useProgress] level_id is not a valid UUID, cannot insert into plays table",
        );
        throw new Error("INVALID_LEVEL_ID");
      }
      throw new Error(res.error.message);
    }
    console.log("[useProgress] new play created:", res.data.id);
    return res.data.id;
  }

  // Complete play by id or fallback to latest started for user+level
  async function completePlay(
    playId: string | null,
    levelId: string,
    payload: { timeSpentSeconds: number; moves: number; success: boolean },
  ): Promise<void> {
    const user = auth.user.value;
    console.log("[useProgress] completePlay called", {
      playId,
      levelId,
      payload,
      user: user?.id,
    });
    if (!user) {
      console.error("[useProgress] completePlay: NOT_AUTHENTICATED");
      throw new Error("NOT_AUTHENTICATED");
    }

    let idToUpdate = playId;
    if (!idToUpdate) {
      console.log(
        "[useProgress] completePlay: no playId, searching for started play",
      );
      const startedRes = (await supabase()
        .from("plays")
        .select("id")
        .eq("user_id", user.id)
        .eq("level_id", levelId)
        .eq("status", "started")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()) as PostgrestSingleResponse<{ id: string }>;
      console.log("[useProgress] completePlay: startedRes", startedRes);
      if (startedRes.error) {
        console.error(
          "[useProgress] completePlay: error searching started play",
          startedRes.error,
        );
        throw new Error(startedRes.error.message);
      }
      idToUpdate = startedRes.data?.id ?? null;
    }

    const patch: PlayUpdate = {
      status: "completed",
      success: payload.success,
      completed_at: new Date().toISOString(),
      time_spent_seconds: payload.timeSpentSeconds,
      moves: payload.moves,
    };
    console.log(
      "[useProgress] completePlay: idToUpdate=",
      idToUpdate,
      "patch=",
      patch,
    );

    if (idToUpdate) {
      const { error } = await supabase()
        .from("plays")
        .update(
          patch as unknown as Database["public"]["Tables"]["plays"]["Update"],
        )
        .eq("id", idToUpdate)
        .eq("user_id", user.id);
      if (error) {
        console.error("[useProgress] completePlay: update error", error);
        throw new Error(error.message);
      }
      console.log("[useProgress] completePlay: update success");
      return;
    }

    // Fallback: insert a completed row (rare)
    console.log("[useProgress] completePlay: fallback insert");
    const insertPayload: PlayInsert = {
      user_id: user.id,
      level_id: levelId,
      status: "completed",
      success: payload.success,
      moves: payload.moves,
      time_spent_seconds: payload.timeSpentSeconds,
    };
    const { error: iErr } = await supabase()
      .from("plays")
      .insert(
        insertPayload as unknown as Database["public"]["Tables"]["plays"]["Insert"],
      );
    if (iErr) throw new Error(iErr.message);
  }

  // Récupère les derniers plays réussis et calcule le streak en jours consécutifs
  async function getStreak(): Promise<{ streak: number; lastDay?: string }> {
    const user = auth.user.value;
    if (!user) return { streak: 0 };

    const playsRes = (await supabase()
      .from("plays")
      .select("completed_at")
      .eq("user_id", user.id)
      .eq("success", true)
      .order("completed_at", { ascending: false })
      .limit(50)) as {
      data: Array<{ completed_at: string | null }> | null;
      error: { message: string } | null;
    };

    if (playsRes.error) throw new Error(playsRes.error.message);

    const days: string[] = (playsRes.data ?? [])
      .map((d) =>
        d.completed_at
          ? new Date(d.completed_at).toISOString().slice(0, 10)
          : null,
      )
      .filter((d): d is string => Boolean(d));

    if (days.length === 0) return { streak: 0 };

    let streak = 0;
    let prev = days[0] as string;
    streak = 1;
    for (let i = 1; i < days.length; i++) {
      const curr = days[i] as string;
      const prevDate = new Date(prev);
      const currDate = new Date(curr);
      const diffDays = Math.round(
        (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 1) {
        streak++;
        prev = curr;
      } else if (diffDays === 0) {
        // same day, skip
        continue;
      } else break;
    }

    return { streak, lastDay: days[0] };
  }

  async function getPlantState() {
    const { streak, lastDay } = await getStreak();
    return {
      streak,
      stage: Math.max(1, streak),
      lastCompletedDay: lastDay,
    };
  }

  return {
    requireAuth,
    isLevelAlreadyWon,
    startPlay,
    completePlay,
    getStreak,
    getPlantState,
  };
}

// Compatibilité: exporter aussi `usePlays` si d'autres fichiers l'utilisent
export const usePlays = useProgress;
