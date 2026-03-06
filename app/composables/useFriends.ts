import type { Database } from "../../types/database";

type SupabaseClient = ReturnType<typeof useNuxtApp>["$supabase"];

export interface FriendProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  streak: number;
  totalWins: number;
}

export function useFriends() {
  const nuxtApp = useNuxtApp();
  const auth = useAuth();

  function supabase(): SupabaseClient {
    return nuxtApp.$supabase as SupabaseClient;
  }

  // Stockage local des amis (en attendant une table dédiée)
  const STORAGE_KEY = "ainigma_friends";

  function getSavedFriendIds(): string[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveFriendIds(ids: string[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }

  /** Chercher un utilisateur par username */
  async function searchUsers(
    query: string,
  ): Promise<
    Array<{ id: string; username: string; avatar_url: string | null }>
  > {
    if (!query || query.length < 2) return [];

    const { data, error } = await supabase()
      .from("profiles")
      .select("id, username, avatar_url")
      .ilike("username", `%${query}%`)
      .neq("id", auth.user.value?.id ?? "")
      .limit(10);

    if (error) return [];
    return (data ?? []).filter(
      (u): u is { id: string; username: string; avatar_url: string | null } =>
        u.username !== null,
    );
  }

  /** Ajouter un ami */
  function addFriend(userId: string) {
    const ids = getSavedFriendIds();
    if (!ids.includes(userId)) {
      ids.push(userId);
      saveFriendIds(ids);
    }
  }

  /** Retirer un ami */
  function removeFriend(userId: string) {
    const ids = getSavedFriendIds().filter((id) => id !== userId);
    saveFriendIds(ids);
  }

  /** Vérifier si un user est ami */
  function isFriend(userId: string): boolean {
    return getSavedFriendIds().includes(userId);
  }

  /** Récupérer les profils + stats des amis */
  async function getFriendsWithStats(): Promise<FriendProfile[]> {
    const ids = getSavedFriendIds();
    if (ids.length === 0) return [];

    // 1. Récupérer les profils et TOUS les plays en parallèle (une seule requête)
    const [profilesRes, playsRes] = await Promise.all([
      supabase()
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", ids),
      supabase()
        .from("plays")
        .select("user_id, completed_at")
        .in("user_id", ids)
        .eq("success", true)
        .order("completed_at", { ascending: false }),
    ]);

    const profiles = profilesRes.data ?? [];
    const allPlays = playsRes.data ?? [];

    if (profiles.length === 0) return [];

    // 2. Grouper les plays par user_id
    const playsByUserId = new Map<string, typeof allPlays>();
    for (const play of allPlays) {
      if (!playsByUserId.has(play.user_id)) {
        playsByUserId.set(play.user_id, []);
      }
      playsByUserId.get(play.user_id)!.push(play);
    }

    // 3. Traiter tous les amis en parallèle (pas de await dans la boucle!)
    const friends: FriendProfile[] = profiles
      .map((profile) => {
        if (!profile.username) return null;

        const plays = playsByUserId.get(profile.id) ?? [];
        const totalWins = plays.length;

        // Calculer streak
        let streak = 0;
        if (plays.length > 0) {
          const days = [
            ...new Set(
              plays
                .map((p) =>
                  p.completed_at
                    ? new Date(p.completed_at).toISOString().slice(0, 10)
                    : null,
                )
                .filter(Boolean) as string[],
            ),
          ];
          if (days.length > 0) {
            streak = 1;
            let prev = days[0]!;
            for (let i = 1; i < days.length; i++) {
              const curr = days[i]!;
              const diff = Math.round(
                (new Date(prev).getTime() - new Date(curr).getTime()) /
                  (1000 * 60 * 60 * 24),
              );
              if (diff === 1) {
                streak++;
                prev = curr;
              } else if (diff !== 0) break;
            }
          }
        }

        return {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          streak,
          totalWins,
        };
      })
      .filter((f): f is FriendProfile => f !== null);

    // Trier par streak décroissant
    friends.sort((a, b) => b.streak - a.streak);
    return friends;
  }

  return {
    searchUsers,
    addFriend,
    removeFriend,
    isFriend,
    getFriendsWithStats,
    getSavedFriendIds,
  };
}
