<script setup lang="ts">
import type { CellState } from "../../lib/games/danmen/types";

const emit = defineEmits<{
  (e: "close" | "skip" | "complete"): void;
}>();

// --- Étapes du tutoriel ---
interface TutorialStep {
  id: string;
  title: string;
  text: string;
  gridSize: number;
  objective: (
    grid: CellState[][],
    givensMap: Map<string, CellState>,
  ) => boolean;
  givens: { r: number; c: number; state: CellState }[];
  rules?: {
    rows: { count: number; groups: number }[];
    cols: { count: number; groups: number }[];
  };
}

// Étape 1 : Remplir une case (1 seule case libre, 8 croix bloquées)
// Étape 2 : Glisser pour remplir (3 cases libres alignées, le reste croix bloquées)
// Étape 3 : Mettre une croix (1 seule case libre, le reste rempli bloqué)
// Étape 4 : Comprendre règles (grille 3x3, lignes 2 et 3 croix bloquées, ligne 1 : 2 cases en 2 groupes)
// Étape 5 : Mini puzzle 5x5 facile avec vraie solution

const steps: TutorialStep[] = [
  {
    id: "fill",
    title: "Remplir une case",
    text: "Clique sur la case vide pour la remplir.",
    gridSize: 3,
    givens: [
      // Toutes les cases sauf (1,1) sont des croix bloquées
      { r: 0, c: 0, state: "empty" },
      { r: 0, c: 1, state: "empty" },
      { r: 0, c: 2, state: "empty" },
      { r: 1, c: 0, state: "empty" },
      // (1,1) est libre
      { r: 1, c: 2, state: "empty" },
      { r: 2, c: 0, state: "empty" },
      { r: 2, c: 1, state: "empty" },
      { r: 2, c: 2, state: "empty" },
    ],
    objective: (grid, givensMap) => {
      // Vérifier qu'une case non-given est remplie
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (!givensMap.has(`${r}-${c}`) && grid[r]?.[c] === "filled") {
            return true;
          }
        }
      }
      return false;
    },
  },
  {
    id: "drag",
    title: "Glisser pour remplir",
    text: "Maintiens et glisse pour remplir les 3 cases.",
    gridSize: 3,
    givens: [
      // Ligne 0 : croix bloquées
      { r: 0, c: 0, state: "empty" },
      { r: 0, c: 1, state: "empty" },
      { r: 0, c: 2, state: "empty" },
      // Ligne 1 : 3 cases libres (rien)
      // Ligne 2 : croix bloquées
      { r: 2, c: 0, state: "empty" },
      { r: 2, c: 1, state: "empty" },
      { r: 2, c: 2, state: "empty" },
    ],
    objective: (grid, givensMap) => {
      // Vérifier que les 3 cases de la ligne 1 sont remplies
      let count = 0;
      for (let c = 0; c < 3; c++) {
        if (!givensMap.has(`1-${c}`) && grid[1]?.[c] === "filled") {
          count++;
        }
      }
      return count === 3;
    },
  },
  {
    id: "cross",
    title: "Marquer une case vide",
    text: "Sélectionne le mode croix puis clique sur la case.",
    gridSize: 3,
    givens: [
      // Toutes les cases sauf (1,1) sont des cases remplies bloquées
      { r: 0, c: 0, state: "filled" },
      { r: 0, c: 1, state: "filled" },
      { r: 0, c: 2, state: "filled" },
      { r: 1, c: 0, state: "filled" },
      // (1,1) est libre
      { r: 1, c: 2, state: "filled" },
      { r: 2, c: 0, state: "filled" },
      { r: 2, c: 1, state: "filled" },
      { r: 2, c: 2, state: "filled" },
    ],
    objective: (grid, givensMap) => {
      // Vérifier que la case (1,1) est une croix
      if (!givensMap.has("1-1") && grid[1]?.[1] === "empty") {
        return true;
      }
      return false;
    },
  },
  {
    id: "rule",
    title: "Comprendre les règles",
    text: "Remplis la 1ère ligne : 2 cases en 2 groupes séparés (2••).",
    gridSize: 3,
    givens: [
      // Ligne 1 et 2 : toutes croix bloquées
      { r: 1, c: 0, state: "empty" },
      { r: 1, c: 1, state: "empty" },
      { r: 1, c: 2, state: "empty" },
      { r: 2, c: 0, state: "empty" },
      { r: 2, c: 1, state: "empty" },
      { r: 2, c: 2, state: "empty" },
    ],
    rules: {
      rows: [
        { count: 2, groups: 2 },
        { count: 0, groups: 0 },
        { count: 0, groups: 0 },
      ],
      cols: [
        { count: 1, groups: 1 },
        { count: 0, groups: 0 },
        { count: 1, groups: 1 },
      ],
    },
    objective: (grid) => {
      const row = grid[0];
      if (!row) return false;
      const stats = countLineStats(row);
      // 2 cases remplies en 2 groupes séparés
      return stats.count === 2 && stats.groups === 2;
    },
  },
  {
    id: "puzzle",
    title: "Mini puzzle",
    text: "Résous ce puzzle ! Chaque ligne et colonne doit correspondre.",
    gridSize: 5,
    givens: [
      // Quelques cases pré-remplies pour guider
      { r: 0, c: 0, state: "filled" },
      { r: 0, c: 4, state: "filled" },
      { r: 2, c: 2, state: "filled" },
      { r: 4, c: 0, state: "filled" },
      { r: 4, c: 4, state: "filled" },
    ],
    // Solution valide :
    // F X F X F   (3 filled, 1 group contigu au milieu? Non, en fait 3 en 2 groupes)
    // Simplifions : pattern en X avec coins remplis
    // Ligne 0: F X X X F = 2 filled, 2 groups
    // Ligne 1: X F X F X = 2 filled, 2 groups
    // Ligne 2: X X F X X = 1 filled, 1 group
    // Ligne 3: X F X F X = 2 filled, 2 groups
    // Ligne 4: F X X X F = 2 filled, 2 groups
    // Col 0: F X X X F = 2, 2g | Col 1: X F X F X = 2, 2g | Col 2: X X F X X = 1, 1g | etc.
    rules: {
      rows: [
        { count: 2, groups: 2 },
        { count: 2, groups: 2 },
        { count: 1, groups: 1 },
        { count: 2, groups: 2 },
        { count: 2, groups: 2 },
      ],
      cols: [
        { count: 2, groups: 2 },
        { count: 2, groups: 2 },
        { count: 1, groups: 1 },
        { count: 2, groups: 2 },
        { count: 2, groups: 2 },
      ],
    },
    objective: (grid) => {
      const rules = {
        rows: [
          { count: 2, groups: 2 },
          { count: 2, groups: 2 },
          { count: 1, groups: 1 },
          { count: 2, groups: 2 },
          { count: 2, groups: 2 },
        ],
        cols: [
          { count: 2, groups: 2 },
          { count: 2, groups: 2 },
          { count: 1, groups: 1 },
          { count: 2, groups: 2 },
          { count: 2, groups: 2 },
        ],
      };
      const n = 5;
      for (let r = 0; r < n; r++) {
        const row = grid[r] ?? [];
        const rule = rules.rows[r];
        if (!rule) return false;
        const stats = countLineStats(row);
        if (stats.count !== rule.count || stats.groups !== rule.groups)
          return false;
      }
      for (let c = 0; c < n; c++) {
        const col: CellState[] = [];
        for (let r = 0; r < n; r++) {
          col.push(grid[r]?.[c] ?? "unknown");
        }
        const rule = rules.cols[c];
        if (!rule) return false;
        const stats = countLineStats(col);
        if (stats.count !== rule.count || stats.groups !== rule.groups)
          return false;
      }
      return true;
    },
  },
];

function countLineStats(cells: CellState[]): { count: number; groups: number } {
  let count = 0;
  let groups = 0;
  let inGroup = false;
  for (const cell of cells) {
    if (cell === "filled") {
      count++;
      if (!inGroup) {
        groups++;
        inGroup = true;
      }
    } else {
      inGroup = false;
    }
  }
  return { count, groups };
}

// --- State ---
const currentStepIndex = ref(0);
const currentStep = computed(() => steps[currentStepIndex.value]);
const totalSteps = steps.length;
const stepCompleted = ref(false);

// --- Givens Map ---
function keyOf(r: number, c: number) {
  return `${r}-${c}`;
}

const givensMap = computed(() => {
  const m = new Map<string, CellState>();
  const step = currentStep.value;
  if (!step) return m;
  for (const g of step.givens) {
    m.set(keyOf(g.r, g.c), g.state);
  }
  return m;
});

function isGiven(r: number, c: number): boolean {
  return givensMap.value.has(keyOf(r, c));
}

// --- Grille du tutoriel ---
function createGridWithGivens(step: TutorialStep): CellState[][] {
  const n = step.gridSize;
  const g: CellState[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => "unknown" as CellState),
  );
  for (const given of step.givens) {
    if (g[given.r]) {
      g[given.r]![given.c] = given.state;
    }
  }
  return g;
}

const grid = ref<CellState[][]>(createGridWithGivens(currentStep.value!));

// Reset grid quand on change d'étape
watch(currentStepIndex, () => {
  const step = currentStep.value;
  if (!step) return;
  grid.value = createGridWithGivens(step);
  stepCompleted.value = false;
  // reset drag helpers
  dragUsed.value = false;
  showDragHint.value = false;
  // Définir le mode approprié pour chaque étape
  // Étape 3 (index 2) = apprendre la croix → mode cross
  // Autres étapes avec boutons → mode circle par défaut
  if (currentStepIndex.value === 2) {
    selectedMode.value = "cross";
  } else if (currentStepIndex.value > 2) {
    selectedMode.value = "circle";
  } else {
    selectedMode.value = "circle";
  }
});

// --- Interaction avec la grille ---
const isDragging = ref(false);
const dragState = ref<CellState | null>(null);
const dragUsed = ref(false);

// Mode de sélection (circle/cross) - visible à partir de l'étape 3
type SelectionMode = "toggle" | "circle" | "cross";
const selectedMode = ref<SelectionMode>("circle");

// Afficher les boutons de mode à partir de l'étape 3 (index 2)
const showModeButtons = computed(() => currentStepIndex.value >= 2);
const showDragHint = ref(false);

function cellState(r: number, c: number): CellState {
  return grid.value[r]?.[c] ?? "unknown";
}

function nextState(current: CellState): CellState {
  if (selectedMode.value === "circle") {
    // Mode cercle: toggle entre unknown et filled
    return current === "filled" ? "unknown" : "filled";
  } else if (selectedMode.value === "cross") {
    // Mode croix: toggle entre unknown et empty
    return current === "empty" ? "unknown" : "empty";
  }
  // Mode toggle (défaut): cycle normal
  if (current === "unknown") return "filled";
  if (current === "filled") return "empty";
  return "unknown";
}

function applyState(r: number, c: number, state: CellState) {
  if (isGiven(r, c)) return;
  if (stepCompleted.value) return;
  const row = grid.value[r];
  if (!row) return;
  if (row[c] === state) return;
  row[c] = state;
  checkObjective();
}

function handlePointerDown(event: PointerEvent, r: number, c: number) {
  if (isGiven(r, c)) return;
  if (stepCompleted.value) return;
  event.preventDefault();
  const next = nextState(cellState(r, c));
  applyState(r, c, next);
  dragState.value = next;
  isDragging.value = true;
}

function handlePointerEnter(r: number, c: number) {
  if (!isDragging.value || dragState.value === null) return;
  if (isGiven(r, c)) return;
  dragUsed.value = true;
  // hide hint once real drag is detected
  if (showDragHint.value) showDragHint.value = false;
  applyState(r, c, dragState.value);
}

function handlePointerMove(r: number, c: number) {
  if (!isDragging.value || dragState.value === null) return;
  if (isGiven(r, c)) return;
  dragUsed.value = true;
  // hide hint once real drag is detected
  if (showDragHint.value) showDragHint.value = false;
  applyState(r, c, dragState.value);
}

function stopDragging() {
  isDragging.value = false;
  dragState.value = null;
}

function resetNonGivenCells() {
  const step = currentStep.value;
  if (!step) return;
  for (let r = 0; r < step.gridSize; r++) {
    for (let c = 0; c < step.gridSize; c++) {
      if (!isGiven(r, c)) {
        grid.value[r]![c] = "unknown";
      }
    }
  }
}

// --- Validation ---
function checkObjective() {
  if (stepCompleted.value) return;
  const step = currentStep.value;
  if (!step) return;
  if (step.objective(grid.value, givensMap.value)) {
    // Special case: step requiring a drag gesture
    if (step.id === "drag") {
      if (!dragUsed.value) {
        // user filled 3 cells but didn't drag
        showDragHint.value = true;
        // reset non-given cells after 700ms
        setTimeout(() => {
          resetNonGivenCells();
        }, 700);
        return;
      }
    }
    stepCompleted.value = true;
    // Petit délai pour laisser la transition se jouer
    setTimeout(() => {
      goToNextStep();
    }, 250);
  }
}

function goToNextStep() {
  if (currentStepIndex.value < totalSteps - 1) {
    currentStepIndex.value++;
  } else {
    emit("complete");
  }
}

function goToPreviousStep() {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--;
  }
}

function handleSkip() {
  emit("skip");
}

function handleClose() {
  emit("close");
}

// --- Helpers affichage ---
function groupDots(n: number) {
  return Array.from({ length: n }, (_, i) => i);
}

onMounted(() => {
  window.addEventListener("pointerup", stopDragging);
  window.addEventListener("pointercancel", stopDragging);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerup", stopDragging);
  window.removeEventListener("pointercancel", stopDragging);
});
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-dark-500/70 backdrop-blur-sm"
      @click.self="handleClose"
    >
      <!-- Panel du tutoriel -->
      <div
        class="bg-light-500 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-4 py-3 border-b border-dark-500/10"
        >
          <div class="flex items-center gap-2">
            <span class="text-lg font-bold text-dark-500">{{
              currentStep?.title
            }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-dark-500/50"
              >{{ currentStepIndex + 1 }}/{{ totalSteps }}</span
            >
            <button
              type="button"
              class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-dark-500/10 transition-colors cursor-pointer"
              @click="handleClose"
            >
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
                class="text-dark-500/60"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Contenu -->
        <Transition name="step" mode="out-in">
          <div :key="currentStep?.id" class="p-4">
            <!-- Texte d'instruction -->
            <p class="text-dark-500/80 text-sm text-center mb-4">
              {{ currentStep?.text }}
            </p>

            <!-- Boutons de sélection de mode (à partir de l'étape 3) -->
            <div v-if="showModeButtons" class="flex justify-center gap-2 mb-4">
              <button
                class="w-10 h-10 flex items-center justify-center rounded border border-purple-500 bg-purple-500 hover:bg-purple-500/80 focus:outline-none active:bg-purple-500/90 transition-all duration-200"
                :class="{ 'ring-2 ring-dark-500': selectedMode === 'circle' }"
                @click="selectedMode = 'circle'"
                aria-label="Mode rond"
              >
                <span class="w-2/5 h-2/5 rounded-full bg-light-500" />
              </button>
              <button
                class="w-10 h-10 flex items-center justify-center rounded border border-dark-500/30 hover:bg-dark-500/10 focus:outline-none active:bg-dark-500/20 transition-all duration-200"
                :class="{ 'ring-2 ring-dark-500': selectedMode === 'cross' }"
                @click="selectedMode = 'cross'"
                aria-label="Mode croix"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="w-6 h-6 text-dark-500"
                >
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </svg>
              </button>
            </div>

            <!-- Grille de tutoriel -->
            <div
              class="bg-dark-500 rounded-xl p-0.75 mx-auto"
              :style="{
                width: currentStep?.gridSize === 5 ? '220px' : '160px',
              }"
            >
              <div
                v-if="currentStep?.rules"
                class="grid"
                :style="{
                  gridTemplateColumns:
                    '1fr ' + `repeat(${currentStep.gridSize}, 1fr)`,
                  gridTemplateRows:
                    '1fr ' + `repeat(${currentStep.gridSize}, 1fr)`,
                  gap: '2px',
                }"
              >
                <!-- Case vide coin haut gauche -->
                <div class="bg-dark-500 aspect-square" />

                <!-- Rules colonnes (haut) -->
                <div
                  v-for="(c, j) in currentStep.rules.cols"
                  :key="'col-' + j"
                  class="flex flex-col items-center justify-center bg-dark-500 aspect-square"
                >
                  <span class="font-bold text-xs text-light-500">{{
                    c.count
                  }}</span>
                  <div class="flex gap-0.5 mt-0.5">
                    <span
                      v-for="d in groupDots(c.groups)"
                      :key="d"
                      class="w-1 h-1 rounded-full bg-light-500"
                    />
                  </div>
                </div>

                <!-- Rules lignes + Cases -->
                <template v-for="r in currentStep.gridSize" :key="'row-' + r">
                  <div
                    class="flex flex-col items-center justify-center bg-dark-500 aspect-square"
                  >
                    <span class="font-bold text-xs text-light-500">{{
                      currentStep.rules.rows[r - 1]?.count
                    }}</span>
                    <div class="flex gap-0.5 mt-0.5">
                      <span
                        v-for="d in groupDots(
                          currentStep.rules.rows[r - 1]?.groups ?? 0,
                        )"
                        :key="d"
                        class="w-1 h-1 rounded-full bg-light-500"
                      />
                    </div>
                  </div>
                  <button
                    v-for="c in currentStep.gridSize"
                    :key="`${r - 1}-${c - 1}`"
                    class="aspect-square flex items-center justify-center transition-all relative"
                    :class="[
                      cellState(r - 1, c - 1) === 'filled'
                        ? 'bg-indigo-500'
                        : 'bg-lavender-500',
                      r === 1 && c === 1 ? 'rounded-tl-md' : '',
                      r === currentStep.gridSize && c === currentStep.gridSize
                        ? 'rounded-br-md'
                        : '',
                      r === 1 && c === currentStep.gridSize
                        ? 'rounded-tr-md'
                        : '',
                      r === currentStep.gridSize && c === 1
                        ? 'rounded-bl-md'
                        : '',
                    ]"
                    style="touch-action: none"
                    :disabled="isGiven(r - 1, c - 1)"
                    @pointerdown.prevent="
                      handlePointerDown($event, r - 1, c - 1)
                    "
                    @pointerenter="handlePointerEnter(r - 1, c - 1)"
                    @pointermove.prevent="handlePointerMove(r - 1, c - 1)"
                    @pointerup="stopDragging"
                  >
                    <span
                      v-if="cellState(r - 1, c - 1) === 'filled'"
                      class="absolute inset-0 flex items-center justify-center"
                    >
                      <span class="w-2/5 h-2/5 rounded-full bg-light-500" />
                    </span>
                    <span
                      v-else-if="cellState(r - 1, c - 1) === 'empty'"
                      class="w-full h-full flex items-center justify-center"
                    >
                      <svg
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
                    </span>
                    <!-- Overlay pour les givens -->
                    <span
                      v-if="isGiven(r - 1, c - 1)"
                      class="absolute inset-0 flex items-end justify-end p-0.5"
                      :class="
                        cellState(r - 1, c - 1) === 'empty'
                          ? 'bg-dark-500/10'
                          : 'bg-light-500/20'
                      "
                    >
                      <svg
                        viewBox="0 0 16 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-2/5"
                      >
                        <path
                          d="M7.57944 0C4.80031 0 2.52648 2.27383 2.52648 5.05296V7.57944H0V17.6854H15.1589V7.57944H12.6324V5.05296C12.6324 2.27383 10.3586 0 7.57944 0ZM7.57944 2.52648C8.99427 2.52648 10.1059 3.63813 10.1059 5.05296V7.57944H5.05296V5.05296C5.05296 3.63813 6.16461 2.52648 7.57944 2.52648Z"
                          fill="#050F23"
                        />
                      </svg>
                    </span>
                  </button>
                </template>
              </div>

              <!-- Grille simple sans règles -->
              <div
                v-else
                class="grid rounded-lg overflow-hidden"
                :style="{
                  gridTemplateColumns: `repeat(${currentStep?.gridSize ?? 3}, 1fr)`,
                  gap: '2px',
                }"
              >
                <template
                  v-for="r in currentStep?.gridSize ?? 3"
                  :key="'sr-' + r"
                >
                  <button
                    v-for="c in currentStep?.gridSize ?? 3"
                    :key="`simple-${r - 1}-${c - 1}`"
                    class="aspect-square flex items-center justify-center transition-all relative"
                    :class="[
                      cellState(r - 1, c - 1) === 'filled'
                        ? 'bg-indigo-500'
                        : 'bg-lavender-500',
                    ]"
                    style="touch-action: none"
                    :disabled="isGiven(r - 1, c - 1)"
                    @pointerdown.prevent="
                      handlePointerDown($event, r - 1, c - 1)
                    "
                    @pointerenter="handlePointerEnter(r - 1, c - 1)"
                    @pointermove.prevent="handlePointerMove(r - 1, c - 1)"
                    @pointerup="stopDragging"
                  >
                    <span
                      v-if="cellState(r - 1, c - 1) === 'filled'"
                      class="absolute inset-0 flex items-center justify-center"
                    >
                      <span class="w-2/5 h-2/5 rounded-full bg-light-500" />
                    </span>
                    <span
                      v-else-if="cellState(r - 1, c - 1) === 'empty'"
                      class="w-full h-full flex items-center justify-center"
                    >
                      <svg
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
                    </span>
                    <!-- Overlay pour les givens -->
                    <span
                      v-if="isGiven(r - 1, c - 1)"
                      class="absolute inset-0 flex items-end justify-end p-0.5"
                      :class="
                        cellState(r - 1, c - 1) === 'empty'
                          ? 'bg-dark-500/10'
                          : 'bg-light-500/20'
                      "
                    >
                      <svg
                        viewBox="0 0 16 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-2/5"
                      >
                        <path
                          d="M7.57944 0C4.80031 0 2.52648 2.27383 2.52648 5.05296V7.57944H0V17.6854H15.1589V7.57944H12.6324V5.05296C12.6324 2.27383 10.3586 0 7.57944 0ZM7.57944 2.52648C8.99427 2.52648 10.1059 3.63813 10.1059 5.05296V7.57944H5.05296V5.05296C5.05296 3.63813 6.16461 2.52648 7.57944 2.52648Z"
                          fill="#050F23"
                        />
                      </svg>
                    </span>
                  </button>
                </template>
              </div>
            </div>
            <!-- Hint helper under grid -->
            <p
              v-if="showDragHint"
              class="mt-2 text-xs text-red-600 text-center"
            >
              Maintiens la pression et glisse sur les cases pour remplir.
            </p>
          </div>
        </Transition>

        <!-- Footer -->
        <div
          class="flex items-center justify-between px-4 py-3 border-t border-dark-500/10"
        >
          <button
            type="button"
            class="text-sm text-dark-500/50 hover:text-dark-500 transition-colors cursor-pointer"
            @click="handleSkip"
          >
            Passer le tutoriel
          </button>
          <div class="flex items-center gap-3">
            <button
              type="button"
              :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center hover:bg-dark-500/10 transition-colors cursor-pointer',
                currentStepIndex > 0 ? '' : 'invisible',
              ]"
              title="Étape précédente"
              @click="goToPreviousStep"
            >
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
                class="text-dark-500/60"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div class="flex gap-1">
              <span
                v-for="(_, i) in steps"
                :key="i"
                class="w-2 h-2 rounded-full transition-colors"
                :class="
                  i === currentStepIndex ? 'bg-indigo-500' : 'bg-dark-500/20'
                "
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Transition fluide pour changement d'étape */
.step-enter-active,
.step-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}
.step-enter-from {
  opacity: 0;
  transform: translateY(6px) scale(0.995);
}
.step-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.step-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.step-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.995);
}
</style>
transform: translateY(0) scale(1);
