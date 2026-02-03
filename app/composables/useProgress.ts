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
    const user = auth.user.value;
    if (!user) throw new Error("NOT_AUTHENTICATED");

    // Récupérer tous les jours complétés
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

    let days: string[] = (playsRes.data ?? [])
      .map((d) =>
        d.completed_at
          ? new Date(d.completed_at).toISOString().slice(0, 10)
          : null,
      )
      .filter((d): d is string => Boolean(d));

    // Dédupliquer les jours (peut y avoir plusieurs plays le même jour)
    days = [...new Set(days)];

    console.log("[getPlantState] Jours complétés (DESC, dédupliqués):", days);

    if (days.length === 0)
      return { plants: [], totalStreak: 0, currentPlantIndex: 0 };

    // Grouper les jours en streaks continus
    const plants: Array<{ stage: number; startDate: string; endDate: string }> =
      [];
    let currentGroup: string[] = [days[0]!];
    let prev = days[0]!;

    for (let i = 1; i < days.length; i++) {
      const curr = days[i]!;
      const prevDate = new Date(prev);
      const currDate = new Date(curr);
      const diffDays = Math.round(
        (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      console.log(
        `[getPlantState] Comparaison: ${prev} vs ${curr}, diffDays=${diffDays}`,
      );

      if (diffDays === 1) {
        // Jour consécutif, ajouter au groupe
        currentGroup.push(curr);
        prev = curr;
      } else if (diffDays === 0) {
        // Même jour, passer
        continue;
      } else {
        // Trou trouvé, sauvegarder le groupe actuel et commencer un nouveau
        console.log(
          `[getPlantState] Trou détecté! Groupe actuel:`,
          currentGroup,
        );
        plants.push({
          stage: currentGroup.length,
          startDate: currentGroup[currentGroup.length - 1]!,
          endDate: currentGroup[0]!,
        });
        currentGroup = [curr];
        prev = curr;
      }
    }

    // Ajouter le dernier groupe
    if (currentGroup.length > 0) {
      console.log(`[getPlantState] Dernier groupe:`, currentGroup);
      plants.push({
        stage: currentGroup.length,
        startDate: currentGroup[currentGroup.length - 1]!,
        endDate: currentGroup[0]!,
      });
    }

    console.log(`[getPlantState] Plantes avant reverse:`, plants);

    // Inverser pour avoir le plus ancien d'abord
    plants.reverse();

    console.log(`[getPlantState] Plantes après reverse:`, plants);

    // Calculer la streak totale
    let totalStreak = 0;
    let prevDate = days[0]!;
    totalStreak = 1;
    for (let i = 1; i < days.length; i++) {
      const curr = days[i]!;
      const prevDateObj = new Date(prevDate);
      const currDateObj = new Date(curr);
      const diffDays = Math.round(
        (prevDateObj.getTime() - currDateObj.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 1) {
        totalStreak++;
        prevDate = curr;
      } else if (diffDays === 0) {
        continue;
      } else break;
    }

    return {
      plants,
      totalStreak,
      currentPlantIndex: plants.length - 1, // La dernière plante (streak actuelle)
    };
  }

  // Récupère les plays détaillés pour une plante donnée (entre startDate et endDate)
  async function getPlaysForDateRange(
    startDate: string,
    endDate: string,
  ): Promise<
    Array<{
      date: string;
      moves: number | null;
      timeSpentSeconds: number | null;
    }>
  > {
    const user = auth.user.value;
    if (!user) return [];

    // On prend du début du startDate à la fin du endDate
    const startDatetime = `${startDate}T00:00:00.000Z`;
    const endDatetime = `${endDate}T23:59:59.999Z`;

    const { data, error } = await supabase()
      .from("plays")
      .select("completed_at, moves, time_spent_seconds")
      .eq("user_id", user.id)
      .eq("success", true)
      .gte("completed_at", startDatetime)
      .lte("completed_at", endDatetime)
      .order("completed_at", { ascending: true });

    if (error) {
      console.error("[getPlaysForDateRange] error:", error);
      return [];
    }

    // Grouper par jour et prendre le meilleur play de chaque jour (moins de coups)
    const byDay = new Map<
      string,
      { date: string; moves: number | null; timeSpentSeconds: number | null }
    >();

    for (const play of data ?? []) {
      if (!play.completed_at) continue;
      const day = new Date(play.completed_at).toISOString().slice(0, 10);

      const existing = byDay.get(day);
      // Garder celui avec le moins de coups, ou le premier si pas de moves
      if (
        !existing ||
        (play.moves !== null &&
          (existing.moves === null || play.moves < existing.moves))
      ) {
        byDay.set(day, {
          date: day,
          moves: play.moves,
          timeSpentSeconds: play.time_spent_seconds,
        });
      }
    }

    return Array.from(byDay.values());
  }

  return {
    requireAuth,
    isLevelAlreadyWon,
    startPlay,
    completePlay,
    getStreak,
    getPlantState,
    getPlaysForDateRange,
  };
}

// Compatibilité: exporter aussi `usePlays` si d'autres fichiers l'utilisent
export const usePlays = useProgress;
