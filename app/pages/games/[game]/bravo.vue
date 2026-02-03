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
const showSolution = ref(false);
const loading = ref(true);

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
  // Expose handlers on window for cleanup in onBeforeUnmount
  window.__bravo_onError = __bravo_onError;
  window.__bravo_onRejection = __bravo_onRejection;
  window.addEventListener("error", __bravo_onError);
  window.addEventListener("unhandledrejection", __bravo_onRejection);

  // 1. Essayer de récupérer depuis sessionStorage (cas normal après victoire)
  const raw = sessionStorage.getItem(`seed:bravo:${levelId.value}`);
  if (raw) {
    try {
      bravoData.value = JSON.parse(raw) as BravoData;
      loading.value = false;
      return;
    } catch (e) {
      console.error("[BRAVO] sessionStorage parse error:", e);
      // Si erreur de parsing, continuer vers la base de données
    }
  }

  // 2. Si pas dans sessionStorage, récupérer depuis la base de données
  const { $supabase } = useNuxtApp();
  try {
    // Récupérer le play terminé pour ce niveau
    const { data: play } = await $supabase
      .from("plays")
      .select("time_spent_seconds, moves, completed_at")
      .eq("level_id", levelId.value)
      .eq("success", true)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Récupérer les données du niveau
    const { data: levelData } = await $supabase
      .from("levels")
      .select("data, day")
      .eq("id", levelId.value)
      .maybeSingle();

    if (play && levelData) {
      // Reconstruire bravoData à partir des données de la BDD
      const levelContent = levelData.data as DanmenLevel;
      bravoData.value = {
        grid: [], // La grille finale n'est pas sauvegardée, on peut la laisser vide ou la reconstruire
        timeSpentSeconds: play.time_spent_seconds ?? 0,
        moves: play.moves ?? 0,
        day: levelData.day,
        difficulty: levelContent.difficulty ?? 1,
        rowCounts: levelContent.rowCounts ?? [],
        colCounts: levelContent.colCounts ?? [],
      };
    } else {
      console.log(
        "[BRAVO] Missing data - play:",
        !!play,
        "levelData:",
        !!levelData,
      );
    }
  } catch (error) {
    console.error(
      "[BRAVO] Erreur lors du chargement des données bravo:",
      error,
    );
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  // Retirer les écouteurs d'erreurs ajoutés au montage (si présents)
  try {
    const h1 = window.__bravo_onError as EventListener | undefined;
    const h2 = window.__bravo_onRejection as EventListener | undefined;
    if (h1) window.removeEventListener("error", h1);
    if (h2) window.removeEventListener("unhandledrejection", h2);
    // cleanup
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

const difficulty = computed(() => bravoData.value?.difficulty ?? 1);
const dayDisplay = computed(() => bravoData.value?.day ?? dayParam.value);
const gridSize = computed(() => bravoData.value?.grid.length ?? 0);

function goHome() {
  router.push("/");
}
function goProfile() {
  router.push("/profile");
}
function toggleSolution() {
  showSolution.value = !showSolution.value;
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
      <div class="text-5xl mb-4">🤔</div>
      <h1 class="font-lily text-2xl text-dark-500 mb-4">
        Aucune donnée disponible
      </h1>
      <UiButton variant="primary" size="md" @click="goHome"
        >Retour à l'accueil</UiButton
      >
    </div>

    <!-- Contenu normal -->
    <div
      v-else
      class="flex flex-col justify-center w-full max-w-120 min-h-dvh px-4 py-8 bg-light-500"
    >
      <div class="text-center mb-6">
        <div class="text-5xl mb-4">🎉</div>
        <h1 class="font-lily text-3xl text-dark-500 mb-2">Bravo !</h1>
        <p class="text-dark-500/70">
          Tu as terminé le puzzle {{ gameDisplayName }} du jour
        </p>
      </div>

      <!-- Stats -->
      <div class="flex justify-center gap-6 mb-8">
        <div class="text-center">
          <div class="text-2xl font-bold text-dark-500">
            {{ formattedTime }}
          </div>
          <div class="text-sm text-dark-500/60">Temps</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-dark-500">
            {{ bravoData?.moves ?? 0 }}
          </div>
          <div class="text-sm text-dark-500/60">Coups</div>
        </div>
        <div class="text-center">
          <div class="flex gap-0.5 text-2xl">
            <span
              v-for="i in 3"
              :key="i"
              :class="i <= difficulty ? 'text-dark-500' : 'text-dark-500/30'"
              >★</span
            >
          </div>
          <div class="text-sm text-dark-500/60">Difficulté</div>
        </div>
      </div>

      <!-- Grille figée -->
      <div v-if="bravoData && gridSize > 0" class="mx-auto mb-8 max-w-xs">
        <div class="relative">
          <!-- Col counts en haut -->
          <div
            v-if="showSolution && bravoData.colCounts"
            class="flex justify-center mb-2 gap-px"
          >
            <div
              v-for="(count, i) in bravoData.colCounts"
              :key="'col-' + i"
              class="flex-1 text-center text-sm font-semibold text-dark-500"
              :style="{ aspectRatio: '1' }"
            >
              {{ count }}
            </div>
          </div>

          <div class="flex gap-2">
            <!-- Row counts à gauche -->
            <div
              v-if="showSolution && bravoData.rowCounts"
              class="flex flex-col justify-center gap-px"
            >
              <div
                v-for="(count, i) in bravoData.rowCounts"
                :key="'row-' + i"
                class="flex items-center justify-center text-sm font-semibold text-dark-500"
                :style="{ aspectRatio: '1', flex: '1' }"
              >
                {{ count }}
              </div>
            </div>

            <!-- Grille -->
            <div
              class="bg-dark-500 rounded-xl p-0 overflow-hidden grid flex-1"
              :style="{
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                gridTemplateRows: `repeat(${gridSize}, 1fr)`,
              }"
            >
              <div
                v-for="(row, r) in bravoData.grid"
                :key="'row-' + r"
                class="contents"
              >
                <div
                  v-for="(cell, c) in row"
                  :key="'cell-' + r + '-' + c"
                  class="aspect-square flex items-center justify-center border border-dark-500"
                  :class="
                    cell === 'filled' ? 'bg-indigo-500' : 'bg-lavender-500'
                  "
                >
                  <span
                    v-if="cell === 'filled'"
                    class="w-2/5 h-2/5 rounded-full bg-light-500"
                  />
                  <svg
                    v-else-if="cell === 'empty'"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="w-3/5 h-3/5 text-dark-500"
                  >
                    <line x1="5" y1="5" x2="19" y2="19" />
                    <line x1="19" y1="5" x2="5" y2="19" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Date du daily -->
      <div class="text-center text-dark-500/60 text-sm mb-8">
        Daily du {{ dayDisplay }}
      </div>

      <!-- Boutons -->
      <div class="flex flex-col gap-3 items-center">
        <UiButton variant="secondary" size="lg" @click="toggleSolution">
          {{ showSolution ? "Masquer" : "Voir" }} la solution
        </UiButton>
        <UiButton variant="primary" size="lg" @click="goProfile">
          Voir ma plante / profil
        </UiButton>
        <UiButton variant="secondary" size="lg" @click="goHome">
          Retour à l'accueil
        </UiButton>
      </div>
    </div>
  </div>
</template>
