<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useProgress } from "~/composables/useProgress";

definePageMeta({
  layout: "minimal2",
});

const loading = ref(true);
const stage = ref(0);
const streak = ref(0);
const encouragement = ref("");

// Multiple plants
const plants = ref<
  Array<{ stage: number; startDate: string; endDate: string }>
>([]);
const currentPlantIndex = ref(0);

// Popup stats
const showStatsPopup = ref(false);
const selectedLeaf = ref<number | null>(null);
const leafStats = ref<{
  date: string;
  moves: number | null;
  timeSpentSeconds: number | null;
} | null>(null);

// Ref pour scroll
const plantContainer = ref<HTMLElement | null>(null);

const progress = useProgress();

// Plant actuelle
const currentPlant = computed(() => plants.value[currentPlantIndex.value]);

// Stats des plays par plante (indexé par plantIndex, puis par feuille 1-5)
const plantsPlayData = ref<
  Map<
    number,
    Array<{
      date: string;
      moves: number | null;
      timeSpentSeconds: number | null;
    }>
  >
>(new Map());

// Formatter le temps en minutes:secondes
function formatTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Formatter la date en français
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function onLeafClick(leafNum: number) {
  const plantIdx = currentPlantIndex.value;
  const plant = plants.value[plantIdx];
  if (!plant) return;

  // Charger les données si pas encore en cache
  if (!plantsPlayData.value.has(plantIdx)) {
    const plays = await progress.getPlaysForDateRange(
      plant.startDate,
      plant.endDate,
    );
    plantsPlayData.value.set(plantIdx, plays);
  }

  const plays = plantsPlayData.value.get(plantIdx) ?? [];
  // La feuille N correspond au Nème jour (index N-1)
  const playData = plays[leafNum - 1];

  selectedLeaf.value = leafNum;
  if (playData) {
    leafStats.value = {
      date: formatDate(playData.date),
      moves: playData.moves,
      timeSpentSeconds: playData.timeSpentSeconds,
    };
  } else {
    leafStats.value = null;
  }
  showStatsPopup.value = true;
}

function closePopup() {
  showStatsPopup.value = false;
  selectedLeaf.value = null;
}

// Navigation entre plantes
function previousPlant() {
  if (currentPlantIndex.value > 0) {
    currentPlantIndex.value--;
    stage.value = currentPlant.value.stage;
    updateEncouragement();
  }
}

function nextPlant() {
  if (currentPlantIndex.value < plants.value.length - 1) {
    currentPlantIndex.value++;
    stage.value = currentPlant.value.stage;
    updateEncouragement();
  }
}

// Sélectionner une plante par clic
function selectPlant(index: number) {
  if (index !== currentPlantIndex.value) {
    currentPlantIndex.value = index;
    stage.value = plants.value[index].stage;
    updateEncouragement();
  }
}

// Offset du carousel pour centrer la plante active
const PLANT_WIDTH = 200; // largeur d'une plante inactive
const ACTIVE_PLANT_WIDTH = 400; // largeur de la plante active

const carouselOffset = computed(() => {
  const total = plants.value.length;
  if (total <= 1) return 0;

  // Calculer la largeur totale du carousel
  // = (total - 1) plantes inactives + 1 plante active
  const totalWidth = (total - 1) * PLANT_WIDTH + ACTIVE_PLANT_WIDTH;

  // Position du centre de la plante active dans le carousel
  // Les plantes avant l'active sont inactives (PLANT_WIDTH chacune)
  const positionOfActiveCenter =
    currentPlantIndex.value * PLANT_WIDTH + ACTIVE_PLANT_WIDTH / 2;

  // On veut que ce centre soit au milieu du carousel (totalWidth / 2)
  // Donc on décale de: (totalWidth / 2) - positionOfActiveCenter
  const offset = totalWidth / 2 - positionOfActiveCenter;

  return offset;
});

// ViewBox dynamique pour une plante donnée
function getViewBoxForStage(stg: number) {
  const viewBoxStartY: Record<number, number> = {
    0: 650,
    1: 550,
    2: 470,
    3: 380,
    4: 280,
    5: 0,
  };
  const startY = viewBoxStartY[stg] ?? 550;
  const height = 800 - startY;
  return `0 ${startY} 400 ${height}`;
}

// Chemin de tige pour une plante donnée
function getStemPathForStage(stg: number) {
  const stemEndY: Record<number, number> = {
    1: 600,
    2: 520,
    3: 430,
    4: 340,
    5: 180,
  };
  const endY = stemEndY[stg] ?? 600;
  return `M200 740 L200 ${endY}`;
}

function updateEncouragement() {
  const stg = stage.value;
  const isLastPlant = currentPlantIndex.value === plants.value.length - 1;
  if (stg >= 5) {
    encouragement.value = isLastPlant
      ? "Ta plante est épanouie — bravo !"
      : "Magnifique plante !";
  } else {
    encouragement.value = isLastPlant
      ? "Prends soin de ta plante en jouant chaque jour."
      : "Beau parcours !";
  }
}

// Scroll vers la dernière feuille visible
function scrollToLastLeaf() {
  if (!plantContainer.value) return;

  // Position Y approximative de chaque feuille dans le SVG (viewBox 800)
  const leafPositions: Record<number, number> = {
    1: 620, // feuille 1
    2: 540, // feuille 2
    3: 450, // feuille 3
    4: 360, // feuille 4
    5: 220, // feuille 5/6 (fleur)
  };

  const targetLeaf = Math.min(stage.value, 5);
  if (targetLeaf === 0) return;

  // Calculer le scroll pour centrer sur la dernière feuille
  const svgHeight = plantContainer.value.scrollHeight;
  const viewportHeight = window.innerHeight;
  const leafY = leafPositions[targetLeaf] ?? 400;

  // Ratio pour convertir coordonnées SVG en pixels
  const ratio = svgHeight / 800;
  const scrollTarget = leafY * ratio - viewportHeight / 2;

  plantContainer.value.scrollTo({
    top: Math.max(0, scrollTarget),
    behavior: "smooth",
  });
}

onMounted(async () => {
  try {
    const state = await progress.getPlantState();
    console.log("[progress.vue] state reçu:", state);
    plants.value = state.plants;
    console.log("[progress.vue] plants.value assigné:", plants.value);
    streak.value = state.totalStreak ?? 0;
    currentPlantIndex.value = state.currentPlantIndex ?? 0;

    if (plants.value.length > 0) {
      stage.value = Math.min(5, plants.value[currentPlantIndex.value].stage);
      updateEncouragement();
    } else {
      stage.value = 0;
      encouragement.value = "Commence à jouer pour faire pousser ta plante !";
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;

    // Scroll vers la dernière feuille après rendu
    await nextTick();
    setTimeout(() => scrollToLastLeaf(), 300);
  }
});
</script>

<template>
  <div
    ref="plantContainer"
    class="progress-page min-h-screen h-screen relative overflow-hidden flex flex-col"
  >
    <!-- Feuilles qui tombent en arrière-plan -->
    <FallingLeaves />

    <!-- Header flottant (back + streak + bouton jouer) -->
    <header
      class="fixed top-0 left-0 right-0 p-2 sm:p-4 z-50 flex items-center justify-between gap-2 sm:gap-4"
    >
      <NuxtLink
        to="/"
        class="back-btn w-9 h-9 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white bg-light-500/30 backdrop-blur-sm transition-all hover:bg-light-500/50"
        aria-label="Retour"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          class="sm:w-6 sm:h-6"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
      </NuxtLink>

      <div
        class="flex flex-col items-center justify-center"
        aria-hidden="false"
      >
        <div
          class="text-lg sm:text-2xl font-extrabold text-light-500 drop-shadow-sm"
        >
          {{ streak }}
        </div>
        <div class="text-xs text-light-500/60 -mt-0.5 sm:-mt-1">jours</div>
      </div>

      <NuxtLink
        v-if="!loading"
        to="/games/danmen"
        class="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center bg-light-500/30 text-white rounded-lg transition-all hover:bg-light-500/50"
        aria-label="Jouer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          class="sm:w-5 sm:h-5"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 3v18l15-9L5 3z" />
        </svg>
      </NuxtLink>
      <div v-else class="w-9 h-9 sm:w-12 sm:h-12" />
    </header>

    <!-- Loader -->
    <div
      v-if="loading"
      class="loader absolute inset-0 flex items-center justify-center"
    >
      <UiSpinner size="xl" />
    </div>

    <!-- Carousel de plantes -->
    <div
      v-else
      class="plant-carousel flex-1 flex items-end justify-center pb-8 relative overflow-hidden"
    >
      <!-- Conteneur des plantes avec transition -->
      <div
        class="plants-container flex items-end justify-center transition-transform duration-500 ease-out"
        :style="{ transform: `translateX(${carouselOffset}px)` }"
      >
        <div
          v-for="(plant, index) in plants"
          :key="index"
          class="plant-item flex-shrink-0 flex items-end justify-center cursor-pointer transition-all duration-500"
          :class="{
            'active-plant': index === currentPlantIndex,
            'inactive-plant': index !== currentPlantIndex,
            'left-plant': index < currentPlantIndex,
            'right-plant': index > currentPlantIndex,
          }"
          @click="selectPlant(index)"
        >
          <svg
            :viewBox="getViewBoxForStage(plant.stage)"
            class="plant-svg-item"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMax meet"
          >
            <defs>
              <linearGradient
                :id="'stemGradient-' + index"
                x1="0%"
                y1="100%"
                x2="0%"
                y2="0%"
              >
                <stop offset="0%" stop-color="#6ec977" />
                <stop offset="50%" stop-color="#8ed591" />
                <stop offset="100%" stop-color="#a8e6ae" />
              </linearGradient>

              <linearGradient
                :id="'leafGradient-' + index"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stop-color="#6ec977" />
                <stop offset="50%" stop-color="#8ed591" />
                <stop offset="100%" stop-color="#a8e6ae" />
              </linearGradient>

              <radialGradient :id="'petalGradient-' + index">
                <stop offset="0%" stop-color="#f5d0f5" />
                <stop offset="50%" stop-color="#e8b3e8" />
                <stop offset="100%" stop-color="#d896d8" />
              </radialGradient>

              <radialGradient :id="'centerGradient-' + index">
                <stop offset="0%" stop-color="#fff9e6" />
                <stop offset="100%" stop-color="#ffd966" />
              </radialGradient>
            </defs>

            <!-- Graine simple -->
            <g v-if="plant.stage === 0" class="seed-group">
              <ellipse
                cx="200"
                cy="720"
                rx="25"
                ry="35"
                fill="#9575cd"
                opacity="0.8"
              />
              <ellipse
                cx="195"
                cy="710"
                rx="8"
                ry="12"
                fill="#b39ddb"
                opacity="0.5"
              />
              <path
                d="M200 690 L200 705"
                stroke="#a5d6a7"
                stroke-width="2"
                stroke-linecap="round"
                opacity="0.7"
              />
            </g>

            <!-- Plante -->
            <g v-else class="plant-group">
              <!-- Tige -->
              <path
                :d="getStemPathForStage(plant.stage)"
                fill="none"
                stroke="#6ec977"
                stroke-width="22"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="stem"
              />

              <!-- Feuille 1 -->
              <g
                v-if="plant.stage >= 1"
                class="leaf leaf-1 cursor-pointer"
                @click.stop="index === currentPlantIndex && onLeafClick(1)"
              >
                <path
                  d="M200 620 Q280 600 320 620 Q300 670 200 620"
                  :fill="'url(#leafGradient-' + index + ')'"
                  opacity="0.9"
                />
                <path
                  d="M200 620 L290 635"
                  stroke="#5fa769"
                  stroke-width="1.5"
                  opacity="0.4"
                />
              </g>

              <!-- Feuille 2 -->
              <g
                v-if="plant.stage >= 2"
                class="leaf leaf-2 cursor-pointer"
                @click.stop="index === currentPlantIndex && onLeafClick(2)"
              >
                <path
                  d="M200 540 Q100 510 80 540 Q110 590 200 540"
                  :fill="'url(#leafGradient-' + index + ')'"
                  opacity="0.9"
                />
                <path
                  d="M200 540 L110 555"
                  stroke="#5fa769"
                  stroke-width="1.5"
                  opacity="0.4"
                />
              </g>

              <!-- Feuille 3 -->
              <g
                v-if="plant.stage >= 3"
                class="leaf leaf-3 cursor-pointer"
                @click.stop="index === currentPlantIndex && onLeafClick(3)"
              >
                <path
                  d="M200 450 Q300 420 340 450 Q310 510 200 450"
                  :fill="'url(#leafGradient-' + index + ')'"
                  opacity="0.9"
                />
                <path
                  d="M200 450 L310 470"
                  stroke="#5fa769"
                  stroke-width="1.5"
                  opacity="0.4"
                />
              </g>

              <!-- Feuille 4 -->
              <g
                v-if="plant.stage >= 4"
                class="leaf leaf-4 cursor-pointer"
                @click.stop="index === currentPlantIndex && onLeafClick(4)"
              >
                <path
                  d="M200 360 Q80 320 60 360 Q100 420 200 360"
                  :fill="'url(#leafGradient-' + index + ')'"
                  opacity="0.9"
                />
                <path
                  d="M200 360 L90 380"
                  stroke="#5fa769"
                  stroke-width="1.5"
                  opacity="0.4"
                />
              </g>

              <!-- Feuille 5 -->
              <g
                v-if="plant.stage >= 5"
                class="leaf leaf-5 cursor-pointer"
                @click.stop="index === currentPlantIndex && onLeafClick(5)"
              >
                <path
                  d="M200 270 Q260 255 295 270 Q275 315 200 270"
                  :fill="'url(#leafGradient-' + index + ')'"
                  opacity="0.9"
                />
              </g>

              <!-- Feuille 6 -->
              <g v-if="plant.stage >= 5" class="leaf leaf-6">
                <path
                  d="M200 220 Q130 200 105 220 Q135 265 200 220"
                  :fill="'url(#leafGradient-' + index + ')'"
                  opacity="0.9"
                />
              </g>

              <!-- Bourgeon -->
              <g v-if="plant.stage === 4" class="bud">
                <ellipse
                  cx="200"
                  cy="120"
                  rx="18"
                  ry="30"
                  fill="#d896d8"
                  opacity="0.7"
                />
                <ellipse
                  cx="200"
                  cy="110"
                  rx="12"
                  ry="20"
                  fill="#e8b3e8"
                  opacity="0.5"
                />
              </g>

              <!-- Fleur -->
              <g v-if="plant.stage >= 5" class="flower">
                <ellipse
                  cx="200"
                  cy="70"
                  rx="35"
                  ry="50"
                  :fill="'url(#petalGradient-' + index + ')'"
                  class="petal"
                />
                <ellipse
                  cx="160"
                  cy="110"
                  rx="35"
                  ry="50"
                  :fill="'url(#petalGradient-' + index + ')'"
                  class="petal"
                  transform="rotate(-72 160 110)"
                />
                <ellipse
                  cx="175"
                  cy="165"
                  rx="35"
                  ry="50"
                  :fill="'url(#petalGradient-' + index + ')'"
                  class="petal"
                  transform="rotate(-144 175 165)"
                />
                <ellipse
                  cx="225"
                  cy="165"
                  rx="35"
                  ry="50"
                  :fill="'url(#petalGradient-' + index + ')'"
                  class="petal"
                  transform="rotate(144 225 165)"
                />
                <ellipse
                  cx="240"
                  cy="110"
                  rx="35"
                  ry="50"
                  :fill="'url(#petalGradient-' + index + ')'"
                  class="petal"
                  transform="rotate(72 240 110)"
                />
                <circle
                  cx="200"
                  cy="120"
                  r="22"
                  :fill="'url(#centerGradient-' + index + ')'"
                />
                <circle cx="195" cy="115" r="2" fill="#f4b942" opacity="0.6" />
                <circle cx="205" cy="115" r="2" fill="#f4b942" opacity="0.6" />
                <circle cx="200" cy="125" r="2" fill="#f4b942" opacity="0.6" />
              </g>
            </g>
          </svg>
        </div>
      </div>

      <!-- Flèche gauche -->
      <button
        v-if="plants.length > 1 && currentPlantIndex > 0"
        @click="previousPlant"
        class="nav-arrow nav-arrow-left"
        aria-label="Plante précédente"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <!-- Flèche droite -->
      <button
        v-if="plants.length > 1 && currentPlantIndex < plants.length - 1"
        @click="nextPlant"
        class="nav-arrow nav-arrow-right"
        aria-label="Plante suivante"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      <!-- Indicateurs de points -->
      <div v-if="plants.length > 1" class="dots-indicator">
        <button
          v-for="(plant, index) in plants"
          :key="'dot-' + index"
          @click="selectPlant(index)"
          class="dot"
          :class="{ 'dot-active': index === currentPlantIndex }"
          :aria-label="'Plante ' + (index + 1)"
        />
      </div>
    </div>

    <!-- Overlay infos en bas (sans titre stage, streak en haut) -->
    <div
      v-if="!loading"
      class="info-overlay fixed bottom-0 left-0 right-0 px-4 pt-6 pb-8 text-center z-20"
    >
      <p class="text-base text-light-500/70 mb-5">{{ encouragement }}</p>
    </div>

    <!-- Popup stats feuille -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showStatsPopup"
          class="fixed inset-0 z-[100] flex items-center justify-center p-4"
          @click.self="closePopup"
        >
          <!-- Backdrop -->
          <div
            class="absolute inset-0 bg-dark-500/30 backdrop-blur-sm"
            @click="closePopup"
          />

          <!-- Card -->
          <div
            class="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-popup"
          >
            <button
              class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-dark-500/10 transition-colors"
              @click="closePopup"
            >
              <svg
                class="w-5 h-5 text-dark-500/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div class="text-center">
              <div
                class="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center"
              >
                <svg
                  class="w-8 h-8 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>

              <h3 class="text-xl font-semibold text-dark-500 mb-1">
                Jour {{ selectedLeaf }}
              </h3>
              <p class="text-sm text-dark-500/60 mb-6">
                {{ leafStats?.date ?? "" }}
              </p>

              <div class="grid grid-cols-2 gap-4">
                <div class="bg-purple-500/15 rounded-xl p-4">
                  <div class="text-2xl font-bold text-purple-500">
                    {{ leafStats?.moves ?? "--" }}
                  </div>
                  <div class="text-xs text-dark-500/60 mt-1">Coups</div>
                </div>
                <div class="bg-indigo-500/15 rounded-xl p-4">
                  <div class="text-2xl font-bold text-indigo-500">
                    {{ formatTime(leafStats?.timeSpentSeconds ?? null) }}
                  </div>
                  <div class="text-xs text-dark-500/60 mt-1">Temps</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Background gradient - Thème hivernal sombre avec couleurs du projet */
.progress-page {
  background: linear-gradient(
    180deg,
    #131313 0%,
    #1f1f1f 30%,
    #1a1a1a 60%,
    #131313 100%
  );
}

/* Décor hivernal - lueur glaçée subtile sur fond sombre */
.sky-subtle::before {
  content: "";
  position: absolute;
  inset: 0;
  background: transparent;
  pointer-events: none;
  animation: shimmer 8s ease-in-out infinite;
}

@keyframes shimmer {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

/* Plante plein écran */
.plant-fullscreen {
  position: relative;
}

.plant-fullscreen::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center bottom,
    rgba(129, 199, 132, 0.2) 0%,
    transparent 60%
  );
  pointer-events: none;
}

.plant-svg {
  width: 90%;
  height: auto;
  max-width: 500px;
  min-height: 50vh;
  max-height: calc(100vh - 100px);
  filter: drop-shadow(0 10px 40px rgba(129, 199, 132, 0.2));
  position: relative;
  z-index: 1;
}

/* Animations plante - croissance douce */
.soil {
  animation: soil-appear 0.8s ease-out forwards;
  opacity: 0;
}

@keyframes soil-appear {
  to {
    opacity: 1;
  }
}

.stem {
  /* Afficher la tige immédiatement, sans masquage par dash animation */
  stroke-dasharray: none;
  stroke-dashoffset: 0;
  opacity: 1;
}

/* Feuilles apparaissent avec rotation douce */
.leaf {
  opacity: 0;
  transform-origin: 200px center;
  animation: leaf-unfold 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.leaf-1 {
  animation-delay: 0.5s;
}
.leaf-2 {
  animation-delay: 0.8s;
}
.leaf-3 {
  animation-delay: 1.1s;
}
.leaf-4 {
  animation-delay: 1.4s;
}
.leaf-5 {
  animation-delay: 1.7s;
}
.leaf-6 {
  animation-delay: 2s;
}

@keyframes leaf-unfold {
  0% {
    opacity: 0;
    transform: scaleX(0) rotate(90deg);
  }
  60% {
    transform: scaleX(1.1) rotate(-5deg);
  }
  100% {
    opacity: 1;
    transform: scaleX(1) rotate(0deg);
  }
}

/* Légère ondulation des feuilles */
.leaf path {
  animation: leaf-sway 6s ease-in-out infinite;
  transform-origin: center;
}

.leaf-1 path {
  animation-delay: 0s;
}
.leaf-2 path {
  animation-delay: 1s;
}
.leaf-3 path {
  animation-delay: 2s;
}
.leaf-4 path {
  animation-delay: 3s;
}
.leaf-5 path {
  animation-delay: 4s;
}
.leaf-6 path {
  animation-delay: 5s;
}

@keyframes leaf-sway {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-3px) rotate(1deg);
  }
  75% {
    transform: translateY(3px) rotate(-1deg);
  }
}

/* Hover sur les feuilles cliquables */
.leaf.cursor-pointer {
  transition:
    transform 0.2s ease,
    filter 0.2s ease;
}

.leaf.cursor-pointer:hover {
  transform: scale(1.08);
  filter: brightness(1.1) drop-shadow(0 4px 8px rgba(110, 201, 119, 0.4));
}

/* Fleur épanouie */
.flower {
  opacity: 0;
  animation: flower-bloom 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) 2.2s forwards;
}

@keyframes flower-bloom {
  0% {
    opacity: 0;
    transform: scale(0) rotate(-90deg);
  }
  60% {
    transform: scale(1.15) rotate(5deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

/* Pétales dansent doucement */
.petal {
  animation: petal-dance 4s ease-in-out infinite;
  transform-origin: 200px 140px;
}

.petal-1 {
  animation-delay: 0s;
}
.petal-2 {
  animation-delay: 0.5s;
}
.petal-3 {
  animation-delay: 1s;
}
.petal-4 {
  animation-delay: 1.5s;
}
.petal-5 {
  animation-delay: 2s;
}

@keyframes petal-dance {
  0%,
  100% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(2deg) scale(1.03);
  }
  75% {
    transform: rotate(-2deg) scale(0.97);
  }
}

/* Graine qui pulse */
.seed-group {
  animation: seed-pulse 2.5s ease-in-out infinite;
  transform-origin: center;
}

@keyframes seed-pulse {
  0%,
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.05);
    filter: brightness(1.15);
  }
}

/* Bourgeon qui respire */
.bud {
  animation: bud-breathe 2.5s ease-in-out infinite;
  transform-origin: 200px 120px;
}

@keyframes bud-breathe {
  0%,
  100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(1.08);
  }
}

/* Info overlay */
.info-overlay {
  background: linear-gradient(
    to top,
    rgba(19, 19, 19, 0.95) 0%,
    rgba(31, 31, 31, 0.7) 50%,
    transparent 100%
  );
  backdrop-filter: blur(10px);
}

/* Popup animations */
.animate-popup {
  animation: popup-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes popup-in {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ===== CAROUSEL DE PLANTES ===== */
.plant-carousel {
  position: relative;
}

.plant-carousel::before {
  content: "";
  position: absolute;
  inset: 0;
  background: transparent;
  pointer-events: none;
}

.plants-container {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0;
  min-height: 50vh;
}

.plant-item {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* Plante active - très grande et au centre */
.active-plant {
  z-index: 10;
  width: 100%;
  max-width: 600px;
}

.active-plant .plant-svg-item {
  width: 100%;
  max-width: 400px;
  height: auto;
  min-height: 50vh;
  max-height: calc(100vh - 120px);
  filter: drop-shadow(0 10px 40px rgba(129, 212, 250, 0.25));
}

@media (min-width: 640px) {
  .active-plant .plant-svg-item {
    max-width: 600px;
    min-height: 65vh;
  }
}

/* Plantes inactives - moyennes sur les côtés */
.inactive-plant {
  z-index: 5;
  width: 100px;
  opacity: 0.6;
  align-self: flex-end;
  transform: translateY(-30px);
}

.inactive-plant .plant-svg-item {
  width: 90px;
  max-width: 90px;
  height: auto;
  min-height: 35vh;
  max-height: calc(60vh - 30px);
  filter: grayscale(30%) drop-shadow(0 5px 20px rgba(129, 212, 250, 0.1));
}

.inactive-plant:hover {
  opacity: 0.8;
  transform: scale(1.1) translateY(-30px);
}

@media (min-width: 640px) {
  .inactive-plant {
    width: 220px;
    transform: translateY(-60px);
  }

  .inactive-plant .plant-svg-item {
    width: 200px;
    max-width: 200px;
    min-height: 50vh;
    max-height: calc(70vh - 60px);
  }

  .inactive-plant:hover {
    transform: scale(1.1) translateY(-60px);
  }
}

/* Plantes à gauche */
.left-plant {
  margin-right: -20px;
}

/* Plantes à droite */
.right-plant {
  margin-left: -20px;
}

@media (min-width: 640px) {
  .left-plant {
    margin-right: -40px;
  }

  .right-plant {
    margin-left: -40px;
  }
}

/* Flèches de navigation */
.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 30;
  padding: 8px;
  border-radius: 50%;
  background: rgba(79, 195, 247, 0.3);
  color: #4fc3f7;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  font-size: 18px;
}

.nav-arrow:hover {
  background: rgba(79, 195, 247, 0.5);
  color: #29b6f6;
}

@media (min-width: 640px) {
  .nav-arrow {
    padding: 12px;
    font-size: 24px;
  }
}

.nav-arrow-left {
  left: 8px;
}

.nav-arrow-right {
  right: 8px;
}

@media (min-width: 640px) {
  .nav-arrow-left {
    left: 12px;
  }

  .nav-arrow-right {
    right: 12px;
  }
}

/* Indicateurs (dots) */
.dots-indicator {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 25;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(254, 254, 254, 0.3);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dot:hover {
  background: rgba(254, 254, 254, 0.5);
}

.dot-active {
  background: #4fc3f7;
  transform: scale(1.2);
}

.dot-active:hover {
  background: #29b6f6;
}
</style>
