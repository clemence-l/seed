<script setup lang="ts">
import type {
  CellState,
  DanmenLevel,
} from "../../../../lib/games/danmen/types";
import UiButton from "../../../components/UiButton.vue";

definePageMeta({
  layout: "minimal",
});

// Déclarations globales propres pour éviter les // @ts-ignore
declare global {
  interface Window {
    __bravo_onError?: EventListener;
    __bravo_onRejection?: EventListener;
  }
}

const route = useRoute();
const router = useRouter();
const auth = useAuth();

const gameName = computed(() => route.params.game as string);
const gameDisplayName = computed(() => {
  const name = gameName.value;
  return name.charAt(0).toUpperCase() + name.slice(1);
});

useHead(() => ({
  title: `Seed | ${gameDisplayName.value} - Bravo !`,
}));

const levelId = computed(() => (route.query.levelId as string) || "");
const dayParam = computed(() => (route.query.day as string) || "");

type BravoData = {
  grid: CellState[][];
  timeSpentSeconds: number;
  moves: number;
  day: string;
  difficulty: number;
  rowCounts?: number[];
  colCounts?: number[];
};

const bravoData = ref<BravoData | null>(null);
const loading = ref(true);

// Animation de la solution
const animatedGrid = ref<CellState[][]>([]);
const animationIndex = ref(0);
let animationInterval: number | null = null;

function startSolutionAnimation() {
  if (!bravoData.value?.grid || bravoData.value.grid.length === 0) return;

  const size = bravoData.value.grid.length;
  // Initialiser grille vide
  animatedGrid.value = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "unknown" as CellState),
  );
  animationIndex.value = 0;

  // Créer la séquence d'animation (toutes les cases à remplir)
  const sequence: { r: number; c: number; state: CellState }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const state = bravoData.value.grid[r]?.[c];
      if (state && state !== "unknown") {
        sequence.push({ r, c, state });
      }
    }
  }

  if (sequence.length === 0) return;

  // Animation en boucle
  animationInterval = window.setInterval(() => {
    if (animationIndex.value < sequence.length) {
      const cell = sequence[animationIndex.value];
      if (cell && animatedGrid.value[cell.r]) {
        animatedGrid.value[cell.r]![cell.c] = cell.state;
      }
      animationIndex.value++;
    } else {
      // Pause de 2 secondes avant de recommencer
      setTimeout(() => {
        if (bravoData.value?.grid) {
          const size = bravoData.value.grid.length;
          animatedGrid.value = Array.from({ length: size }, () =>
            Array.from({ length: size }, () => "unknown" as CellState),
          );
          animationIndex.value = 0;
        }
      }, 2000);
    }
  }, 150);
}

function stopSolutionAnimation() {
  if (animationInterval) {
    window.clearInterval(animationInterval);
    animationInterval = null;
  }
}

onMounted(async () => {
  if (!import.meta.client) return;

  // Installer des écouteurs d'erreurs runtime pour aider au debug client
  const __bravo_onError: EventListener = (ev) => {
    const e = ev as ErrorEvent;
    console.error("[BRAVO] runtime error:", e.error ?? e.message);
  };
  const __bravo_onRejection: EventListener = (ev) => {
    const e = ev as PromiseRejectionEvent;
    console.error("[BRAVO] unhandled rejection:", e.reason);
  };
  window.__bravo_onError = __bravo_onError;
  window.__bravo_onRejection = __bravo_onRejection;
  window.addEventListener("error", __bravo_onError);
  window.addEventListener("unhandledrejection", __bravo_onRejection);

  // S'assurer que auth est initialisé
  await auth.initAuth();

  console.log("[BRAVO] levelId:", levelId.value, "dayParam:", dayParam.value);
  console.log(
    "[BRAVO] isLoggedIn:",
    auth.isLoggedIn.value,
    "userId:",
    auth.user.value?.id,
  );

  // 1. Essayer de récupérer depuis sessionStorage (cas normal après victoire)
  const raw = sessionStorage.getItem(`seed:bravo:${levelId.value}`);
  console.log("[BRAVO] sessionStorage raw:", raw ? "found" : "not found");
  if (raw) {
    try {
      bravoData.value = JSON.parse(raw) as BravoData;
      loading.value = false;
      startSolutionAnimation();
      return;
    } catch (e) {
      console.error("[BRAVO] sessionStorage parse error:", e);
    }
  }

  // 2. Si pas dans sessionStorage, récupérer depuis la base de données
  const { $supabase } = useNuxtApp();

  // Vérifier que dayParam est présent (on utilise game_id + day pour trouver le niveau)
  if (!dayParam.value) {
    console.error("[BRAVO] No day in query params");
    loading.value = false;
    return;
  }

  try {
    // Récupérer les données du niveau par game_id + day (pas par l'id interne)
    console.log(
      "[BRAVO] Fetching level data for game:",
      gameName.value,
      "day:",
      dayParam.value,
    );
    const { data: levelData, error: levelError } = await $supabase
      .from("levels")
      .select("data, day")
      .eq("game_id", gameName.value)
      .eq("day", dayParam.value)
      .maybeSingle();

    console.log("[BRAVO] Level data:", levelData, "error:", levelError);

    // Ensuite récupérer le play si l'utilisateur est connecté
    let play = null;
    if (auth.isLoggedIn.value && auth.user.value?.id) {
      console.log("[BRAVO] Fetching play for user:", auth.user.value.id);
      const { data: playData, error: playError } = await $supabase
        .from("plays")
        .select("time_spent_seconds, moves, completed_at")
        .eq("level_id", levelId.value)
        .eq("user_id", auth.user.value.id)
        .eq("success", true)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      play = playData;
      console.log("[BRAVO] Play data:", playData, "error:", playError);
    }

    if (levelData) {
      const levelContent = levelData.data as DanmenLevel;
      bravoData.value = {
        grid: levelContent.solution ?? [],
        timeSpentSeconds: play?.time_spent_seconds ?? 0,
        moves: play?.moves ?? 0,
        day: levelData.day || dayParam.value,
        difficulty: levelContent.difficulty ?? 1,
        rowCounts: levelContent.rowCounts ?? [],
        colCounts: levelContent.colCounts ?? [],
      };
      console.log("[BRAVO] bravoData set:", bravoData.value);
      startSolutionAnimation();
    } else {
      console.log("[BRAVO] No level data found");
    }
  } catch (error) {
    console.error("[BRAVO] Erreur lors du chargement:", error);
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  stopSolutionAnimation();
  try {
    const h1 = window.__bravo_onError as EventListener | undefined;
    const h2 = window.__bravo_onRejection as EventListener | undefined;
    if (h1) window.removeEventListener("error", h1);
    if (h2) window.removeEventListener("unhandledrejection", h2);
    delete window.__bravo_onError;
    delete window.__bravo_onRejection;
  } catch {
    // noop
  }
});

const formattedTime = computed(() => {
  const sec = bravoData.value?.timeSpentSeconds ?? 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
});

const dayDisplay = computed(() => bravoData.value?.day ?? dayParam.value);
const gridSize = computed(() => bravoData.value?.grid?.length ?? 0);

function goProgress() {
  router.push("/progress");
}
function goProfile() {
  router.push("/profile");
}
</script>

<template>
  <div class="flex justify-center items-stretch min-h-dvh bg-light-500">
    <!-- État de chargement -->
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center w-full"
    >
      <UiSpinner size="xl" />
    </div>

    <!-- Pas de données -->
    <div
      v-else-if="!bravoData"
      class="flex flex-col items-center justify-center w-full text-center px-4"
    >
      <h1 class="text-2xl font-bold text-dark-500 mb-4">
        Aucune donnée disponible
      </h1>
      <UiButton variant="primary" size="md" @click="goProgress"
        >Retour à la progression</UiButton
      >
    </div>

    <!-- Contenu normal -->
    <div
      v-else
      class="flex flex-col justify-center w-full max-w-md min-h-dvh px-4 py-8 bg-light-500"
    >
      <!-- Header -->
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-dark-500 mb-2">Bravo !</h1>
        <p class="text-dark-500/70">
          Tu as terminé le puzzle {{ gameDisplayName }} du jour
        </p>
        <p class="text-dark-500/50 text-sm mt-1">{{ dayDisplay }}</p>
      </div>

      <!-- Stats -->
      <div class="flex justify-center gap-8 mb-8">
        <div class="text-center">
          <div class="text-3xl font-bold text-indigo-500">
            {{ formattedTime }}
          </div>
          <div class="text-sm text-dark-500/60">Temps</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-indigo-500">
            {{ bravoData?.moves ?? 0 }}
          </div>
          <div class="text-sm text-dark-500/60">Coups</div>
        </div>
      </div>

      <!-- Solution animée en encadré -->
      <div v-if="gridSize > 0" class="mb-8">
        <div class="bg-dark-500/5 border border-dark-500/10 rounded-2xl p-4">
          <p class="text-center text-sm text-dark-500/60 mb-3">Solution</p>
          <div
            class="bg-dark-500 rounded-xl p-0.5 mx-auto"
            :style="{ width: gridSize >= 5 ? '200px' : '160px' }"
          >
            <div
              class="grid"
              :style="{
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                gap: '2px',
              }"
            >
              <template v-for="r in gridSize" :key="'row-' + r">
                <div
                  v-for="c in gridSize"
                  :key="'cell-' + r + '-' + c"
                  class="aspect-square flex items-center justify-center transition-all duration-200"
                  :class="[
                    animatedGrid[r - 1]?.[c - 1] === 'filled'
                      ? 'bg-indigo-500'
                      : animatedGrid[r - 1]?.[c - 1] === 'empty'
                        ? 'bg-lavender-500'
                        : 'bg-lavender-500/50',
                    r === 1 && c === 1 ? 'rounded-tl-lg' : '',
                    r === 1 && c === gridSize ? 'rounded-tr-lg' : '',
                    r === gridSize && c === 1 ? 'rounded-bl-lg' : '',
                    r === gridSize && c === gridSize ? 'rounded-br-lg' : '',
                  ]"
                >
                  <span
                    v-if="animatedGrid[r - 1]?.[c - 1] === 'filled'"
                    class="w-2/5 h-2/5 rounded-full bg-light-500 animate-in zoom-in duration-200"
                  />
                  <svg
                    v-else-if="animatedGrid[r - 1]?.[c - 1] === 'empty'"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="w-3/5 h-3/5 text-dark-500 animate-in zoom-in duration-200"
                  >
                    <line x1="5" y1="5" x2="19" y2="19" />
                    <line x1="19" y1="5" x2="5" y2="19" />
                  </svg>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Boutons -->
      <div class="flex flex-col gap-3 items-center">
        <UiButton
          variant="primary"
          size="lg"
          class="w-full max-w-xs"
          @click="goProgress"
        >
          Voir ma progression
        </UiButton>
        <UiButton
          variant="secondary"
          size="lg"
          class="w-full max-w-xs"
          @click="goProfile"
        >
          Mon profil
        </UiButton>
      </div>
    </div>
  </div>
</template>
