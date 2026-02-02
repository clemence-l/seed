<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useProgress } from "~/composables/useProgress";

definePageMeta({
  layout: "minimal2",
});

const loading = ref(true);
const stage = ref(0);
const streak = ref(0);
const encouragement = ref("");

const progress = useProgress();

onMounted(async () => {
  try {
    const state = await progress.getPlantState();
    streak.value = state.streak ?? 0;
    stage.value = Math.min(5, state.stage ?? 0);
    encouragement.value =
      stage.value >= 5
        ? "Ta plante est épanouie — bravo !"
        : "Prends soin de ta plante en jouant chaque jour.";
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="progress-page min-h-dvh relative overflow-hidden">
    <!-- Décor discret : léger halo au sol (plus naturel que des étoiles) -->

    <!-- Header flottant (back + streak) -->
    <header class="fixed top-0 left-0 right-0 p-4 z-50">
      <div class="header-left">
        <NuxtLink
          to="/"
          class="back-btn w-12 h-12 rounded-lg flex items-center justify-center text-white/60 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/15 hover:text-white"
          aria-label="Retour"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
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
      </div>

      <div
        class="top-streak absolute left-1/2 top-3 -translate-x-1/2 flex flex-col items-center justify-center z-60 pointer-events-none"
        aria-hidden="false"
      >
        <div class="text-2xl font-extrabold text-white drop-shadow-lg">
          {{ streak }}
        </div>
        <div class="text-xs text-white/70 -mt-1">jours</div>
      </div>

      <div class="header-right" />
    </header>

    <!-- Loader -->
    <div
      v-if="loading"
      class="loader absolute inset-0 flex items-center justify-center"
    >
      <div
        class="w-12 h-12 border-[3px] border-white/10 border-t-green-500 rounded-full animate-spin"
      />
    </div>

    <!-- Plante plein écran -->
    <div
      v-else
      class="plant-fullscreen sky-subtle absolute inset-0 flex items-end justify-center pb-0"
    >
      <svg
        viewBox="0 0 400 800"
        class="plant-svg"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <!-- Gradients doux et poétiques -->
          <linearGradient id="soilGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#8b45bc" stop-opacity="0.2" />
            <stop offset="100%" stop-color="#5e1a7d" stop-opacity="0.4" />
          </linearGradient>

          <linearGradient id="stemGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#2f6b3e" />
            <stop offset="45%" stop-color="#4fb06a" />
            <stop offset="100%" stop-color="#7de389" />
          </linearGradient>

          <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#6ec977" />
            <stop offset="50%" stop-color="#8ed591" />
            <stop offset="100%" stop-color="#a8e6ae" />
          </linearGradient>

          <radialGradient id="petalGradient">
            <stop offset="0%" stop-color="#f5d0f5" />
            <stop offset="50%" stop-color="#e8b3e8" />
            <stop offset="100%" stop-color="#d896d8" />
          </radialGradient>

          <radialGradient id="centerGradient">
            <stop offset="0%" stop-color="#fff9e6" />
            <stop offset="100%" stop-color="#ffd966" />
          </radialGradient>
        </defs>

        <!-- Sol simple et élégant -->
        <g class="soil">
          <ellipse
            cx="200"
            cy="760"
            rx="140"
            ry="20"
            fill="url(#soilGradient)"
          />
          <line
            x1="80"
            y1="760"
            x2="320"
            y2="760"
            stroke="#8b45bc"
            stroke-width="2"
            opacity="0.3"
          />
        </g>

        <!-- Graine simple -->
        <g v-if="stage === 0" class="seed-group">
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
          <!-- Tige centrale simple et élégante (ombre + trait principal pour contraste) -->
          <path
            d="M200 740 Q200 500 200 200"
            fill="none"
            stroke="#081610"
            stroke-width="12"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.12"
            class="stem-shadow"
          />
          <path
            d="M200 740 Q200 500 200 200"
            fill="none"
            stroke="url(#stemGradient)"
            stroke-width="10"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="stem"
          />

          <!-- Feuilles plates et stylisées -->
          <!-- Feuille 1 - bas droite -->
          <g v-if="stage >= 1" class="leaf leaf-1">
            <path
              d="M200 620 Q250 610 280 620 Q270 650 200 620"
              fill="url(#leafGradient)"
              opacity="0.9"
            />
            <path
              d="M200 620 L260 625"
              stroke="#5fa769"
              stroke-width="1.5"
              opacity="0.4"
            />
          </g>

          <!-- Feuille 2 - bas gauche -->
          <g v-if="stage >= 2" class="leaf leaf-2">
            <path
              d="M200 540 Q150 530 120 540 Q130 570 200 540"
              fill="url(#leafGradient)"
              opacity="0.9"
            />
            <path
              d="M200 540 L140 545"
              stroke="#5fa769"
              stroke-width="1.5"
              opacity="0.4"
            />
          </g>

          <!-- Feuille 3 - milieu droite -->
          <g v-if="stage >= 3" class="leaf leaf-3">
            <path
              d="M200 450 Q260 435 295 450 Q280 485 200 450"
              fill="url(#leafGradient)"
              opacity="0.9"
            />
            <path
              d="M200 450 L270 455"
              stroke="#5fa769"
              stroke-width="1.5"
              opacity="0.4"
            />
          </g>

          <!-- Feuille 4 - milieu gauche -->
          <g v-if="stage >= 4" class="leaf leaf-4">
            <path
              d="M200 360 Q140 345 105 360 Q120 395 200 360"
              fill="url(#leafGradient)"
              opacity="0.9"
            />
            <path
              d="M200 360 L130 365"
              stroke="#5fa769"
              stroke-width="1.5"
              opacity="0.4"
            />
          </g>

          <!-- Feuille 5 - haut droite (petite) -->
          <g v-if="stage >= 5" class="leaf leaf-5">
            <path
              d="M200 270 Q235 265 255 270 Q245 290 200 270"
              fill="url(#leafGradient)"
              opacity="0.9"
            />
          </g>

          <!-- Feuille 6 - haut gauche (petite) -->
          <g v-if="stage >= 5" class="leaf leaf-6">
            <path
              d="M200 220 Q165 215 145 220 Q155 240 200 220"
              fill="url(#leafGradient)"
              opacity="0.9"
            />
          </g>

          <!-- Bourgeon simple -->
          <g v-if="stage === 4" class="bud">
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

          <!-- Fleur plate et poétique -->
          <g v-if="stage >= 5" class="flower">
            <!-- Pétales (5) -->
            <ellipse
              cx="200"
              cy="70"
              rx="35"
              ry="50"
              fill="url(#petalGradient)"
              class="petal petal-1"
            />
            <ellipse
              cx="160"
              cy="110"
              rx="35"
              ry="50"
              fill="url(#petalGradient)"
              class="petal petal-2"
              transform="rotate(-72 160 110)"
            />
            <ellipse
              cx="175"
              cy="165"
              rx="35"
              ry="50"
              fill="url(#petalGradient)"
              class="petal petal-3"
              transform="rotate(-144 175 165)"
            />
            <ellipse
              cx="225"
              cy="165"
              rx="35"
              ry="50"
              fill="url(#petalGradient)"
              class="petal petal-4"
              transform="rotate(144 225 165)"
            />
            <ellipse
              cx="240"
              cy="110"
              rx="35"
              ry="50"
              fill="url(#petalGradient)"
              class="petal petal-5"
              transform="rotate(72 240 110)"
            />

            <!-- Centre de la fleur -->
            <circle cx="200" cy="120" r="22" fill="url(#centerGradient)" />
            <!-- Petits points dans le centre -->
            <circle cx="195" cy="115" r="2" fill="#f4b942" opacity="0.6" />
            <circle cx="205" cy="115" r="2" fill="#f4b942" opacity="0.6" />
            <circle cx="200" cy="125" r="2" fill="#f4b942" opacity="0.6" />
          </g>
        </g>
      </svg>
    </div>

    <!-- Overlay infos en bas (sans titre stage, streak en haut) -->
    <div
      v-if="!loading"
      class="info-overlay fixed bottom-0 left-0 right-0 px-4 pt-6 pb-8 text-center z-20"
    >
      <p class="text-base text-white/70 mb-5">{{ encouragement }}</p>
    </div>

    <!-- Bouton discret fixe sur le côté -->
    <NuxtLink
      v-if="!loading"
      to="/games/danmen"
      class="fixed right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/5 text-white/80 rounded-lg shadow-lg transition-all opacity-85 hover:opacity-100 hover:scale-105 z-60"
      aria-label="Jouer"
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
      >
        <path d="M5 3v18l15-9L5 3z" />
      </svg>
    </NuxtLink>
  </div>
</template>

<style scoped>
/* Background gradient - aube/crépuscule poétique */
.progress-page {
  background: linear-gradient(
    180deg,
    #1a1435 0%,
    #2d1b47 20%,
    #4a2b5c 40%,
    #3d2952 60%,
    #2a1a40 80%,
    #1a1435 100%
  );
}

/* Décor discret - plus naturel qu'un champ d'étoiles */
.sky-subtle::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center top,
    rgba(255, 255, 255, 0.02),
    transparent 30%
  );
  pointer-events: none;
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
    rgba(139, 69, 188, 0.15) 0%,
    transparent 60%
  );
  pointer-events: none;
}

.plant-svg {
  width: 100%;
  height: 85vh;
  max-width: 450px;
  filter: drop-shadow(0 10px 40px rgba(139, 69, 188, 0.3));
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
    rgba(26, 20, 53, 0.95) 0%,
    rgba(26, 20, 53, 0.7) 50%,
    transparent 100%
  );
  backdrop-filter: blur(10px);
}
</style>
