<script setup lang="ts">
import type { DanmenLevel, CellState } from "../../lib/games/danmen/types";

import UiButton from "./UiButton.vue";

const props = defineProps<{ level: DanmenLevel }>();

const emit = defineEmits<{
  (e: "complete"): void;
}>();

const size = computed(() => props.level.size);

const isDragging = ref(false);
const dragState = ref<CellState | null>(null);

/** --- Mode de sélection (circle/cross) --- */
type SelectionMode = "toggle" | "circle" | "cross";
const selectedMode = ref<SelectionMode>("circle");

/** --- Historique pour annuler --- */
interface HistoryEntry {
  r: number;
  c: number;
  prevState: CellState;
}
const history = ref<HistoryEntry[]>([]);

/** Compteur de mouvements (changes) */
const moves = ref<number>(0);

function keyOf(r: number, c: number) {
  return `${r}-${c}`;
}

/** Map des givens (bloqués) */
const givensMap = computed(() => {
  const m = new Map<string, CellState>();
  for (const g of props.level.givens) m.set(keyOf(g.r, g.c), g.state);
  return m;
});
function isGiven(r: number, c: number) {
  return givensMap.value.has(keyOf(r, c));
}

/** --- Grille joueur (persistée) --- */
const storageKey = computed(() => `seed:danmen:${props.level.id}`);

/** --- État de victoire --- */
const levelComplete = ref(false);

/** --- Système d'indices avec cooldown --- */
const HINT_COOLDOWN = 30; // secondes
const hintCooldownKey = computed(
  () => `seed:danmen:hint-cooldown:${props.level.id}`,
);

function loadLastHintTime(): number {
  if (!import.meta.client) return 0;
  const raw = localStorage.getItem(hintCooldownKey.value);
  if (!raw) return 0;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

const lastHintTime = ref(loadLastHintTime());
const now = ref(Date.now());

const hintCooldownLeft = computed(() => {
  const elapsed = Math.floor((now.value - lastHintTime.value) / 1000);
  return Math.max(0, HINT_COOLDOWN - elapsed);
});
const canUseHint = computed(
  () => hintCooldownLeft.value === 0 && !levelComplete.value,
);

let interval: number | undefined;
onMounted(() => {
  interval = window.setInterval(() => {
    now.value = Date.now();
  }, 1000);
});
onBeforeUnmount(() => {
  if (interval) window.clearInterval(interval);
});

watch(
  () => props.level.id,
  () => {
    lastHintTime.value = loadLastHintTime();
    now.value = Date.now();
  },
);

watch(lastHintTime, (val) => {
  if (!import.meta.client) return;
  localStorage.setItem(hintCooldownKey.value, String(val));
});

function useHint() {
  if (!canUseHint.value) return;

  const solution = props.level.solution;
  if (!solution) return;

  // Collecter toutes les cases éligibles (non-given, unknown)
  const candidates: { r: number; c: number }[] = [];
  const n = size.value;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!isGiven(r, c) && cellState(r, c) === "unknown") {
        candidates.push({ r, c });
      }
    }
  }

  if (candidates.length === 0) return;

  // Choisir une case au hasard
  const randomIndex = Math.floor(Math.random() * candidates.length);
  const target = candidates[randomIndex];
  if (!target) return;

  // Récupérer la valeur de la solution
  const solutionRow = solution[target.r];
  if (!solutionRow) return;
  const correctState = solutionRow[target.c];
  if (!correctState) return;

  // Appliquer l'état correct
  applyState(target.r, target.c, correctState);
  lastHintTime.value = Date.now();
}

function createEmptyGrid(n: number): CellState[][] {
  return Array.from({ length: n }, () =>
    Array.from({ length: n }, () => "unknown" as CellState),
  );
}

function applyGivens(grid: CellState[][]) {
  for (const g of props.level.givens) {
    if (g.r >= 0 && g.r < grid.length && g.c >= 0 && g.c < grid.length) {
      const row = grid[g.r];
      if (row) row[g.c] = g.state;
    }
  }
  return grid;
}

function loadGrid(): CellState[][] {
  if (!import.meta.client)
    return applyGivens(createEmptyGrid(props.level.size));
  const raw = localStorage.getItem(storageKey.value);
  if (!raw) return applyGivens(createEmptyGrid(props.level.size));
  try {
    const parsed = JSON.parse(raw) as CellState[][];
    if (!Array.isArray(parsed) || parsed.length !== props.level.size) {
      return applyGivens(createEmptyGrid(props.level.size));
    }
    return applyGivens(
      parsed.map((row) =>
        Array.isArray(row) ? row.slice(0, props.level.size) : [],
      ) as CellState[][],
    );
  } catch {
    return applyGivens(createEmptyGrid(props.level.size));
  }
}

const grid = ref<CellState[][]>(loadGrid());

watch(
  () => props.level.id,
  () => {
    grid.value = loadGrid();
  },
);

watch(
  grid,
  (g) => {
    if (!import.meta.client) return;
    localStorage.setItem(storageKey.value, JSON.stringify(g));
  },
  { deep: true },
);

/** --- Helpers affichage --- */
function cellState(r: number, c: number): CellState {
  return grid.value[r]?.[c] ?? "unknown";
}

function groupDots(n: number) {
  return Array.from({ length: n }, (_, i) => i);
}

/** Détermine les classes de coins arrondis pour chaque case */
function cornerClass(r: number, c: number, size: number) {
  if (r === 0 && c === 0) return "";
  if (r === size - 1 && c === size - 1) return "";
  return "";
}

/** --- Interaction --- */
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

/** Auto-remplir de croix les cases vides quand une ligne/colonne a le bon nombre de cases noires ET de groupes */
const shakingRows = ref<Set<number>>(new Set());
const shakingCols = ref<Set<number>>(new Set());

function autoFillCrossesAfterMove(r: number, c: number) {
  const n = size.value;
  const cellsToFill: Array<{ r: number; c: number }> = [];

  // Vérifier la ligne r
  const rowRule = props.level.rules.rows[r];
  if (rowRule) {
    const row = grid.value[r] ?? [];
    const stats = countLineStats(row);

    // Si le nombre de cases noires correspond au nombre requis
    if (stats.count === rowRule.count) {
      // Vérifier aussi le nombre de groupes
      if (stats.groups === rowRule.groups) {
        // Tout est correct ! Remplir les cases vides avec des croix
        for (let col = 0; col < n; col++) {
          if (!isGiven(r, col) && row[col] === "unknown") {
            cellsToFill.push({ r, c: col });
          }
        }
      } else {
        // Le nombre est bon mais les groupes sont incorrects - faire trembler
        triggerShakeRow(r);
      }
    }
  }

  // Vérifier la colonne c
  const colRule = props.level.rules.cols[c];
  if (colRule) {
    const col: CellState[] = [];
    for (let row = 0; row < n; row++) {
      col.push(grid.value[row]?.[c] ?? "unknown");
    }
    const stats = countLineStats(col);

    // Si le nombre de cases noires correspond au nombre requis
    if (stats.count === colRule.count) {
      // Vérifier aussi le nombre de groupes
      if (stats.groups === colRule.groups) {
        // Tout est correct ! Remplir les cases vides avec des croix
        for (let row = 0; row < n; row++) {
          if (!isGiven(row, c) && col[row] === "unknown") {
            // Éviter les doublons si la case est déjà dans cellsToFill
            if (!cellsToFill.some((cell) => cell.r === row && cell.c === c)) {
              cellsToFill.push({ r: row, c });
            }
          }
        }
      } else {
        // Le nombre est bon mais les groupes sont incorrects - faire trembler
        triggerShakeCol(c);
      }
    }
  }

  // Appliquer les croix avec un délai pour créer une animation fluide
  if (cellsToFill.length > 0) {
    cellsToFill.forEach((cell, index) => {
      setTimeout(() => {
        const row = grid.value[cell.r];
        if (row && row[cell.c] === "unknown" && !isGiven(cell.r, cell.c)) {
          row[cell.c] = "empty";
        }
      }, index * 50); // 50ms de délai entre chaque case
    });
  }
}

function triggerShakeRow(r: number) {
  shakingRows.value.add(r);
  setTimeout(() => {
    shakingRows.value.delete(r);
  }, 500);
}

function triggerShakeCol(c: number) {
  shakingCols.value.add(c);
  setTimeout(() => {
    shakingCols.value.delete(c);
  }, 500);
}

function isShaking(r: number, c: number): boolean {
  return shakingRows.value.has(r) || shakingCols.value.has(c);
}

function applyState(
  r: number,
  c: number,
  state: CellState,
  addToHistory = true,
) {
  if (isGiven(r, c)) return;
  const row = grid.value[r];
  if (!row) return;
  const prevState: CellState = row[c] ?? "unknown";
  if (prevState === state) return;
  if (addToHistory) {
    history.value.push({ r, c, prevState });
  }
  if (addToHistory) {
    // incrémente le compteur de moves si l'état change réellement
    moves.value += 1;
  }
  row[c] = state;

  // Auto-compléter avec des croix si la ligne/colonne est remplie
  autoFillCrossesAfterMove(r, c);

  checkLevelComplete();
}

function undo() {
  const last = history.value.pop();
  if (!last) return;
  applyState(last.r, last.c, last.prevState, false);
}

const canUndo = computed(() => history.value.length > 0);

function handlePointerDown(event: PointerEvent, r: number, c: number) {
  if (isGiven(r, c)) return;
  event.preventDefault();
  const next = nextState(cellState(r, c));
  applyState(r, c, next);
  dragState.value = next;
  isDragging.value = true;
}

function handlePointerEnter(r: number, c: number) {
  if (!isDragging.value || dragState.value === null) return;
  applyState(r, c, dragState.value);
}

function handlePointerMove(r: number, c: number) {
  if (!isDragging.value || dragState.value === null) return;
  applyState(r, c, dragState.value);
}

function stopDragging() {
  isDragging.value = false;
  dragState.value = null;
}

onMounted(() => {
  window.addEventListener("pointerup", stopDragging);
  window.addEventListener("pointercancel", stopDragging);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerup", stopDragging);
  window.removeEventListener("pointercancel", stopDragging);
});

function reset() {
  if (!import.meta.client) return;
  localStorage.removeItem(storageKey.value);
  localStorage.removeItem(hintCooldownKey.value);
  grid.value = applyGivens(createEmptyGrid(props.level.size));
  levelComplete.value = false;
  history.value = [];
  lastHintTime.value = 0;
}

/** Compte les cases remplies et les groupes pour une ligne/colonne */
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

function checkLevelComplete() {
  if (levelComplete.value) return;
  const n = size.value;
  // Vérifier toutes les lignes
  for (let r = 0; r < n; r++) {
    const row = grid.value[r] ?? [];
    const rule = props.level.rules.rows[r];
    if (!rule) return;
    const stats = countLineStats(row);
    if (stats.count !== rule.count || stats.groups !== rule.groups) return;
  }
  // Vérifier toutes les colonnes
  for (let c = 0; c < n; c++) {
    const col: CellState[] = [];
    for (let r = 0; r < n; r++) {
      col.push(grid.value[r]?.[c] ?? "unknown");
    }
    const rule = props.level.rules.cols[c];
    if (!rule) return;
    const stats = countLineStats(col);
    if (stats.count !== rule.count || stats.groups !== rule.groups) return;
  }
  levelComplete.value = true;
  emit("complete");
}

export type DanmenBoardExposed = {
  reset: () => void;
  getMoves: () => number;
  getGrid: () => CellState[][];
  setSelectedMode: (mode: SelectionMode) => void;
  getSelectedMode: () => SelectionMode;
};

defineExpose<DanmenBoardExposed>({
  reset,
  getMoves: () => moves.value,
  getGrid: () => grid.value.map((r) => r.slice()),
  setSelectedMode: (mode: SelectionMode) => {
    selectedMode.value = mode;
  },
  getSelectedMode: () => selectedMode.value,
});
</script>

<template>
  <div class="flex flex-col gap-4 w-full max-w-md mx-auto">
    <!-- Board wrapper : fond dark continu -->
    <div
      class="bg-dark-500 border border-dark-500 rounded-xl p-0 overflow-hidden"
    >
      <!-- Grid layout : rules gauche | (rules haut + grille) -->
      <div
        class="grid"
        :style="{
          gridTemplateColumns: '1fr ' + `repeat(${size}, 1fr)`,
          gridTemplateRows: '1fr ' + `repeat(${size}, 1fr)`,
        }"
      >
        <!-- Case vide coin haut gauche -->
        <div class="bg-dark-500 aspect-square" />

        <!-- Rules colonnes (haut) -->
        <div
          v-for="(c, j) in level.rules.cols"
          :key="'col-' + j"
          class="flex flex-col items-center justify-center bg-dark-500 aspect-square relative overflow-hidden"
        >
          <span class="font-bold text-sm text-light-500">{{ c.count }}</span>
          <div class="flex gap-1 mt-1">
            <span
              v-for="d in groupDots(c.groups)"
              :key="d"
              class="w-1.5 h-1.5 bg-light-500"
            />
          </div>
        </div>

        <!-- Rules lignes (gauche) + Grille -->
        <template v-for="r in size" :key="'row-' + r">
          <!-- Rule de la ligne -->
          <div
            class="flex flex-col items-center justify-center bg-dark-500 aspect-square relative overflow-hidden"
          >
            <span class="font-bold text-sm text-light-500">{{
              level.rules.rows[r - 1]?.count
            }}</span>
            <div class="flex gap-1 mt-1">
              <span
                v-for="d in groupDots(level.rules.rows[r - 1]?.groups ?? 0)"
                :key="d"
                class="w-1.5 h-1.5 bg-light-500"
              />
            </div>
          </div>
          <!-- Cases de la grille pour cette ligne -->
          <button
            v-for="c in size"
            :key="keyOf(r - 1, c - 1)"
            class="aspect-square flex items-center justify-center font-bold transition-all duration-300 border border-dark-500 relative overflow-hidden"
            :class="[
              cornerClass(r - 1, c - 1, size),
              cellState(r - 1, c - 1) === 'filled'
                ? 'bg-indigo-500'
                : 'bg-lavender-500',
              isGiven(r - 1, c - 1) ? 'border-dark-500/40' : '',
              isShaking(r - 1, c - 1) ? 'animate-shake bg-red-500/20' : '',
            ]"
            style="touch-action: none"
            :disabled="isGiven(r - 1, c - 1)"
            @pointerdown.prevent="handlePointerDown($event, r - 1, c - 1)"
            @pointerenter="handlePointerEnter(r - 1, c - 1)"
            @pointermove.prevent="handlePointerMove(r - 1, c - 1)"
            @pointerup="stopDragging"
          >
            <!-- Case pleine : rond light -->
            <span
              v-if="cellState(r - 1, c - 1) === 'filled'"
              class="absolute inset-0 flex items-center justify-center"
            >
              <span class="w-2/5 h-2/5 bg-light-500" />
            </span>
            <!-- Case croix : svg -->
            <span
              v-else-if="cellState(r - 1, c - 1) === 'empty'"
              class="w-full h-full flex items-center justify-center animate-in fade-in zoom-in-75 duration-300"
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
            <!-- Overlay et cadenas pour les données -->
            <span
              v-if="isGiven(r - 1, c - 1)"
              class="absolute inset-0 flex items-end justify-end p-1"
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
    <!-- Boutons: Effacer, Annuler -->
    <div class="flex justify-center gap-4">
      <UiButton variant="secondary" size="md" @click="reset">Effacer</UiButton>

      <UiButton variant="secondary" size="md" :disabled="!canUndo" @click="undo"
        >Annuler</UiButton
      >

      <!-- Bouton Indice (commenté pour l'instant)
      <UiButton
        variant="secondary"
        size="md"
        :disabled="!canUseHint"
        @click="useHint"
      >
        <template v-if="hintCooldownLeft === 0">Indice</template>
        <template v-else>Indice ({{ hintCooldownLeft }}s)</template>
      </UiButton>
      -->
    </div>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-4px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(4px);
  }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
</style>
