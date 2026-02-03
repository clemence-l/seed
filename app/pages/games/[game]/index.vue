<script setup lang="ts">
import type { DanmenLevel, CellState } from "../../../lib/games/danmen/types";
import type { DanmenBoardExposed } from "../../components/DanmenBoard.vue";

// Utiliser le layout minimal (sans header/footer/nav)
definePageMeta({
  layout: "minimal",
});

const route = useRoute();

// Récupérer le nom du jeu depuis l'URL
const gameName = computed(() => route.params.game as string);

// Capitaliser le nom du jeu pour l'affichage
const gameDisplayName = computed(() => {
  const name = gameName.value;
  return name.charAt(0).toUpperCase() + name.slice(1);
});

useHead(() => ({
  title: `Seed | ${gameDisplayName.value}`,
}));

// --- Tutoriel ---
const TUTORIAL_SEEN_KEY = "seed:danmen:tutorialSeen";

function isTutorialSeen(): boolean {
  if (!import.meta.client) return true;
  return localStorage.getItem(TUTORIAL_SEEN_KEY) === "1";
}

function markTutorialSeen(): void {
  if (!import.meta.client) return;
  localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
}

const isTutorialOpen = ref(false);

function openTutorial() {
  isTutorialOpen.value = true;
}

function closeTutorial() {
  isTutorialOpen.value = false;
}

function handleTutorialSkip() {
  markTutorialSeen();
  isTutorialOpen.value = false;
}

function handleTutorialComplete() {
  markTutorialSeen();
  isTutorialOpen.value = false;
}

// --- Bannière de connexion ---
const LOGIN_PROMPT_DISMISSED_KEY = "seed:loginPromptDismissed";

const loginPromptDismissed = ref(false);

function checkLoginPromptDismissed(): void {
  if (!import.meta.client) return;
  loginPromptDismissed.value =
    localStorage.getItem(LOGIN_PROMPT_DISMISSED_KEY) === "1";
}

function dismissLoginPrompt(): void {
  if (!import.meta.client) return;
  localStorage.setItem(LOGIN_PROMPT_DISMISSED_KEY, "1");
  loginPromptDismissed.value = true;
}

onMounted(() => {
  checkLoginPromptDismissed();
});

// Supabase client (plugin Nuxt)
const { $supabase: supabase } = useNuxtApp();

function todayUtcYYYYMMDD(): string {
  return new Date().toISOString().slice(0, 10);
}

const day = computed(() => todayUtcYYYYMMDD());

const level = ref<DanmenLevel | null>(null);
const pending = ref<boolean>(true);
const error = ref<Error | null>(null);

async function loadDaily(): Promise<void> {
  pending.value = true;
  error.value = null;
  level.value = null;

  // Pour l’instant on gère seulement Danmen
  if (gameName.value !== "danmen") {
    error.value = new Error("Jeu non supporté pour le moment");
    pending.value = false;
    return;
  }

  const { data, error: supaError } = await supabase
    .from("levels")
    .select("data")
    .eq("game_id", gameName.value)
    .eq("day", day.value)
    .eq("active", true)
    .maybeSingle<{ data: DanmenLevel }>();

  if (supaError) {
    // Supabase error (handled silently in UI)
  }

  if (supaError || !data) {
    // Fallback : niveau de la veille
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const { data: yesterdayData, error: yesterdayError } = await supabase
      .from("levels")
      .select("data")
      .eq("game_id", gameName.value)
      .eq("day", yesterdayStr)
      .eq("active", true)
      .maybeSingle<{ data: DanmenLevel }>();

    if (yesterdayError) {
      // Yesterday fallback error (handled silently)
    }

    if (yesterdayData) {
      level.value = yesterdayData.data;
    } else {
      error.value = new Error(
        "Aucun niveau disponible pour aujourd'hui ou hier",
      );
    }
  } else {
    level.value = data.data;
  }

  pending.value = false;
}

type TimerStore = {
  elapsedSec: number;
  lastStartMs: number | null;
  completed: boolean;
};

function timerKey(levelId: string): string {
  return `seed:timer:${levelId}`;
}

function loadTimer(levelId: string): TimerStore {
  if (!import.meta.client)
    return { elapsedSec: 0, lastStartMs: null, completed: false };
  const raw = localStorage.getItem(timerKey(levelId));
  if (!raw) return { elapsedSec: 0, lastStartMs: null, completed: false };
  try {
    const parsed = JSON.parse(raw) as TimerStore;
    return {
      elapsedSec: Number.isFinite(parsed.elapsedSec) ? parsed.elapsedSec : 0,
      lastStartMs:
        typeof parsed.lastStartMs === "number" ? parsed.lastStartMs : null,
      completed: !!parsed.completed,
    };
  } catch {
    return { elapsedSec: 0, lastStartMs: null, completed: false };
  }
}

function saveTimer(levelId: string, store: TimerStore): void {
  if (!import.meta.client) return;
  localStorage.setItem(timerKey(levelId), JSON.stringify(store));
}

const elapsedSeconds = ref<number>(0);
const isCompleted = ref<boolean>(false);
const currentLevelId = computed(() => level.value?.id ?? null);

// store en mémoire (reflété dans localStorage)
const store = ref<TimerStore>({
  elapsedSec: 0,
  lastStartMs: null,
  completed: false,
});

const _formattedTime = computed(() => {
  const m = Math.floor(elapsedSeconds.value / 60);
  const s = elapsedSeconds.value % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
});

let timerId: number | null = null;

function startTimer(): void {
  const id = currentLevelId.value;
  if (!import.meta.client || !id) return;
  if (isCompleted.value) return;

  // si déjà running, ne rien faire
  if (store.value.lastStartMs !== null) return;

  store.value.lastStartMs = Date.now();
  saveTimer(id, store.value);

  if (timerId !== null) return;
  timerId = window.setInterval(() => {
    const extra = store.value.lastStartMs
      ? Math.floor((Date.now() - store.value.lastStartMs) / 1000)
      : 0;

    elapsedSeconds.value = store.value.elapsedSec + Math.max(0, extra);
  }, 250); // 250ms pour une sensation fluide, affichage reste mm:ss
}

function stopTimer(): void {
  const id = currentLevelId.value;
  if (!import.meta.client || !id) return;

  if (store.value.lastStartMs !== null) {
    const deltaSec = Math.floor((Date.now() - store.value.lastStartMs) / 1000);
    store.value.elapsedSec += Math.max(0, deltaSec);
    store.value.lastStartMs = null;
    saveTimer(id, store.value);
    elapsedSeconds.value = store.value.elapsedSec;
  }

  if (timerId === null) return;
  window.clearInterval(timerId);
  timerId = null;
}

function syncTimerWithVisibility(): void {
  if (!import.meta.client) return;
  if (isCompleted.value) {
    stopTimer();
    return;
  }
  if (document.visibilityState === "visible") startTimer();
  else stopTimer();
}
watch(
  () => currentLevelId.value,
  (id) => {
    if (!id) return;
    const loaded = loadTimer(id);
    store.value = loaded;
    isCompleted.value = loaded.completed;

    // Si le timer était "en cours" avant un refresh, on continue sans perdre
    const extra =
      loaded.lastStartMs !== null
        ? Math.floor((Date.now() - loaded.lastStartMs) / 1000)
        : 0;

    elapsedSeconds.value = loaded.elapsedSec + Math.max(0, extra);
  },
  { immediate: true },
);

watch(
  () => level.value,
  (v) => {
    if (!v) return;
    // Nouveau level => reset chrono
    elapsedSeconds.value = 0;
    isCompleted.value = false;
    syncTimerWithVisibility();
  },
  { immediate: true },
);

onMounted(() => {
  document.addEventListener("visibilitychange", syncTimerWithVisibility);
  window.addEventListener("blur", syncTimerWithVisibility);
  window.addEventListener("focus", syncTimerWithVisibility);
  syncTimerWithVisibility();

  // Ouvrir automatiquement le tutoriel pour Danmen si jamais vu
  if (gameName.value === "danmen" && !isTutorialSeen()) {
    isTutorialOpen.value = true;
  }
  // Écouter l'événement global pour afficher le tutoriel (layout)
  window.addEventListener("seed:open-tutorial", openTutorial as EventListener);
});

onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", syncTimerWithVisibility);
  window.removeEventListener("blur", syncTimerWithVisibility);
  window.removeEventListener("focus", syncTimerWithVisibility);
  stopTimer();
  window.removeEventListener(
    "seed:open-tutorial",
    openTutorial as EventListener,
  );
});

const playId = ref<string | null>(null);
const router = useRouter();

async function handleComplete(): Promise<void> {
  const id = currentLevelId.value;
  if (!id) return;
  isCompleted.value = true;

  // stop + persist "completed"
  stopTimer();
  store.value.completed = true;
  saveTimer(id, store.value);

  // Récupérer stats du board
  const movesCount = boardRef.value?.getMoves?.() ?? 0;
  const gridSnapshot: CellState[][] = boardRef.value?.getGrid?.() ?? [];

  // Enregistrer le play en base UNIQUEMENT si connecté
  if (auth.isLoggedIn.value && playId.value) {
    try {
      await plays.completePlay(playId.value, id, {
        timeSpentSeconds: elapsedSeconds.value,
        moves: movesCount,
        success: true,
      });
    } catch {
      // Erreur lors de la sauvegarde du play (silent)
    }
  }

  // Sauvegarder les stats pour la page bravo en sessionStorage
  if (import.meta.client) {
    const bravoData = {
      grid: gridSnapshot,
      timeSpentSeconds: elapsedSeconds.value,
      moves: movesCount,
      day: day.value,
      difficulty: level.value?.difficulty ?? 1,
      rowCounts: level.value?.rowCounts ?? [],
      colCounts: level.value?.colCounts ?? [],
    };
    sessionStorage.setItem(`seed:bravo:${id}`, JSON.stringify(bravoData));
  }

  // Naviguer vers la page bravo
  const targetPath = `/games/${gameName.value}/bravo`;
  await router.push({
    path: targetPath,
    query: { levelId: id, day: day.value },
  });
}

watch(
  gameName,
  () => {
    loadDaily();
  },
  { immediate: true },
);

const auth = useAuth();
const plays = usePlays();

watch(
  () => level.value?.id,
  async (levelId) => {
    if (!levelId) return;

    // Ne pas exécuter la logique si le niveau est déjà complété
    if (isCompleted.value) return;

    // Si connecté, vérifier si le niveau est déjà gagné
    if (auth.isLoggedIn.value) {
      const alreadyWon = await plays.isLevelAlreadyWon(levelId);
      if (alreadyWon) {
        await navigateTo({
          path: `/games/${gameName.value}/bravo`,
          query: { levelId, day: day.value },
        });
        return;
      }

      // Créer (ou récupérer) l'entrée play "started"
      playId.value = await plays.startPlay(levelId);
    }
    // Si non connecté, on peut quand même jouer sans sauvegarder
  },
  { immediate: true },
);

const boardRef = ref<DanmenBoardExposed | null>(null);
</script>

<template>
  <div>
    <div
      class="flex-1 flex flex-col items-center justify-center overflow-y-auto py-4"
      :class="{ 'pointer-events-none': isTutorialOpen }"
    >
      <div v-if="pending" class="text-dark-500/60 py-8">
        Chargement du puzzle...
      </div>
      <div v-else-if="error" class="text-red-500 py-8 text-center">
        <p class="mb-2">Jeu non trouvé</p>
        <NuxtLink to="/" class="text-dark-500 underline hover:text-dark-500/70"
          >Retour à l'accueil</NuxtLink
        >
      </div>
      <div v-else-if="level" class="w-full flex flex-col items-center px-4">
        <!-- Bannière de connexion -->
        <AuthLoginPrompt
          v-if="!auth.isLoggedIn.value && !loginPromptDismissed"
          class="w-full max-w-120"
          @dismiss="dismissLoginPrompt"
        />

        <!-- Sous-header: difficulté + chrono -->
        <div
          class="w-full max-w-120 flex items-center justify-between mb-4 px-2"
        >
          <div class="flex items-center gap-3 text-sm text-dark-500">
            <span class="font-medium">Difficulté</span>
            <div class="flex items-center gap-1">
              <template v-for="n in level.difficulty ?? 1" :key="n">
                <span class="w-2 h-2 rounded-full bg-dark-500/80" />
              </template>
            </div>
          </div>

          <div class="text-sm text-dark-500 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-dark-500"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span>{{ _formattedTime }}</span>
          </div>
        </div>

        <DanmenBoard ref="boardRef" :level="level" @complete="handleComplete" />
      </div>
    </div>

    <!-- Overlay du tutoriel Danmen -->
    <DanmenTutorialOverlay
      v-if="isTutorialOpen && gameName === 'danmen'"
      @close="closeTutorial"
      @skip="handleTutorialSkip"
      @complete="handleTutorialComplete"
    />
  </div>
</template>
