<script setup lang="ts">
import { useProgress } from "~/composables/useProgress";

const route = useRoute();
const auth = useAuth();
const progress = useProgress();

const gameName = computed(() => route.params.game as string);
const gameDisplayName = computed(() => {
  const name = gameName.value;
  return name.charAt(0).toUpperCase() + name.slice(1);
});

useHead(() => ({
  title: `Aínigma | Dashboard ${gameDisplayName.value}`,
}));

const loading = ref(true);
const streak = ref(0);
const totalPlayed = ref(0);
const totalWins = ref(0);
const bestTime = ref<number | null>(null);
const avgMoves = ref<number | null>(null);
const recentPlays = ref<
  Array<{
    date: string;
    moves: number | null;
    timeSpentSeconds: number | null;
    success: boolean;
  }>
>([]);

// Plante (streak visuel)
const plantStage = ref(0);

function formatTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function todayFormatted(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function loadDashboardData() {
  loading.value = true;

  try {
    const { $supabase: supabase } = useNuxtApp();
    const user = auth.user.value;
    if (!user) {
      loading.value = false;
      return;
    }

    // Charger le streak
    const streakData = await progress.getStreak();
    streak.value = streakData.streak;

    // Charger la plante
    const plantData = await progress.getPlantState();
    if (plantData.plants.length > 0) {
      const currentPlant = plantData.plants[plantData.currentPlantIndex];
      plantStage.value = currentPlant?.stage ?? 0;
    }

    // Charger les stats globales
    const { data: allPlays, error: playsErr } = await supabase
      .from("plays")
      .select("id, success, moves, time_spent_seconds, completed_at, status")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(100);

    if (!playsErr && allPlays) {
      totalPlayed.value = allPlays.filter(
        (p: any) => p.status === "completed",
      ).length;
      totalWins.value = allPlays.filter((p: any) => p.success === true).length;

      // Meilleur temps
      const times = allPlays
        .filter((p: any) => p.success && p.time_spent_seconds != null)
        .map((p: any) => p.time_spent_seconds as number);
      bestTime.value = times.length > 0 ? Math.min(...times) : null;

      // Moyenne des coups
      const moves = allPlays
        .filter((p: any) => p.success && p.moves != null)
        .map((p: any) => p.moves as number);
      avgMoves.value =
        moves.length > 0
          ? Math.round(moves.reduce((a, b) => a + b, 0) / moves.length)
          : null;

      // 10 derniers plays complétés
      recentPlays.value = allPlays
        .filter((p: any) => p.status === "completed" && p.completed_at)
        .slice(0, 10)
        .map((p: any) => ({
          date: p.completed_at,
          moves: p.moves,
          timeSpentSeconds: p.time_spent_seconds,
          success: p.success === true,
        }));
    }
  } catch (err) {
    console.error("Erreur chargement dashboard:", err);
  }

  loading.value = false;
}

onMounted(() => {
  loadDashboardData();
});
</script>

<template>
  <div class="min-h-dvh bg-white pt-24 pb-16 px-4 sm:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- En-tête du dashboard -->
      <div
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10"
      >
        <div>
          <NuxtLink
            to="/"
            class="text-gray-400 text-sm hover:text-gray-700 transition-colors mb-2 inline-block"
          >
            ← Accueil
          </NuxtLink>
          <h1 class="text-4xl font-bold text-gray-900">
            <span class="text-pink-500">{{ gameDisplayName }}</span>
          </h1>
          <p class="text-gray-400 mt-1">{{ todayFormatted() }}</p>
        </div>
        <NuxtLink
          :to="`/games/${gameName}`"
          class="bg-pink-500 text-white px-8 py-3 font-semibold hover:scale-105 transition-transform text-center shadow-md"
        >
          🎮 Jouer au niveau du jour
        </NuxtLink>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div
          class="w-8 h-8 border-2 border-pink-500 border-t-transparent animate-spin"
        />
      </div>

      <!-- Non connecté -->
      <div v-else-if="!auth.isLoggedIn.value" class="text-center py-20">
        <p class="text-gray-500 text-lg mb-6">
          Connecte-toi pour voir tes statistiques
        </p>
        <NuxtLink
          to="/auth/login"
          class="bg-gradient-to-br from-pink-500 to-purple-500 text-white px-8 py-3 font-semibold hover:scale-105 transition-transform"
        >
          Se connecter
        </NuxtLink>
      </div>

      <!-- Contenu dashboard -->
      <template v-else>
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <!-- Streak -->
          <div
            class="bg-gray-50 border border-gray-100 p-5 text-center"
          >
            <div class="text-3xl mb-1">🔥</div>
            <p class="text-3xl font-bold text-lime-600">{{ streak }}</p>
            <p class="text-xs text-gray-400 mt-1">Jours de série</p>
          </div>

          <!-- Parties jouées -->
          <div
            class="bg-gray-50 border border-gray-100 p-5 text-center"
          >
            <div class="text-3xl mb-1">🎯</div>
            <p class="text-3xl font-bold text-pink-500">{{ totalWins }}</p>
            <p class="text-xs text-gray-400 mt-1">Victoires</p>
          </div>

          <!-- Meilleur temps -->
          <div
            class="bg-gray-50 border border-gray-100 p-5 text-center"
          >
            <div class="text-3xl mb-1">⚡</div>
            <p class="text-3xl font-bold text-purple-500">
              {{ formatTime(bestTime) }}
            </p>
            <p class="text-xs text-gray-400 mt-1">Meilleur temps</p>
          </div>

          <!-- Moyenne coups -->
          <div
            class="bg-gray-50 border border-gray-100 p-5 text-center"
          >
            <div class="text-3xl mb-1">🧠</div>
            <p class="text-3xl font-bold text-gray-900">
              {{ avgMoves ?? "--" }}
            </p>
            <p class="text-xs text-gray-400 mt-1">Coups en moy.</p>
          </div>
        </div>

        <!-- Progression streak visuel -->
        <div class="bg-gray-50 border border-gray-100 p-6 mb-10">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">
            📈 Progression
          </h2>
          <div class="flex items-end gap-2">
            <template v-for="i in 7" :key="i">
              <div class="flex flex-col items-center gap-1 flex-1">
                <div
                  class="w-full transition-all duration-500"
                  :class="i <= streak ? 'bg-lime-500' : 'bg-gray-200'"
                  :style="{
                    height:
                      i <= streak ? `${Math.min(i * 12 + 20, 100)}px` : '20px',
                  }"
                />
                <span class="text-[10px] text-gray-400">J{{ i }}</span>
              </div>
            </template>
          </div>
          <p v-if="streak > 0" class="text-sm text-lime-600 mt-4">
            🌱 {{ streak }} jour{{ streak > 1 ? "s" : "" }} consécutif{{
              streak > 1 ? "s" : ""
            }}
            — continue comme ça !
          </p>
          <p v-else class="text-sm text-gray-400 mt-4">
            Joue aujourd'hui pour commencer ta série !
          </p>
        </div>

        <!-- Historique récent -->
        <div class="bg-gray-50 border border-gray-100 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">
            🕒 Historique récent
          </h2>

          <div v-if="recentPlays.length === 0" class="text-center py-8">
            <p class="text-gray-400">Aucune partie jouée pour le moment</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(play, idx) in recentPlays"
              :key="idx"
              class="flex items-center justify-between p-3 bg-white border border-gray-100"
            >
              <div class="flex items-center gap-3">
                <span class="text-xl">{{ play.success ? "✅" : "❌" }}</span>
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {{ formatDate(play.date) }}
                  </p>
                  <p class="text-xs text-gray-400">
                    {{ play.moves != null ? `${play.moves} coups` : "" }}
                    {{
                      play.moves != null && play.timeSpentSeconds != null
                        ? " · "
                        : ""
                    }}
                    {{
                      play.timeSpentSeconds != null
                        ? formatTime(play.timeSpentSeconds)
                        : ""
                    }}
                  </p>
                </div>
              </div>
              <div v-if="play.success && play.timeSpentSeconds != null">
                <span
                  class="text-xs px-3 py-1 bg-lime-500/20 text-lime-500 font-medium"
                >
                  {{ formatTime(play.timeSpentSeconds) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
