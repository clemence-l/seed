<script setup lang="ts">
import { ref, onMounted } from "vue";

useHead({ title: "Seed | Jeux de logique quotidiens" });

const auth = useAuth();

// Animation states
const showTitle = ref(false);
const showSubtitle = ref(false);
const showButtons = ref(false);
const plantVisible = ref(false);

function handleProgressClick() {
  if (auth.isLoggedIn.value) {
    navigateTo("/progress");
  } else {
    navigateTo("/auth/login");
  }
}

function scrollToGames() {
  document.getElementById("games")?.scrollIntoView({ behavior: "smooth" });
}

onMounted(() => {
  setTimeout(() => (plantVisible.value = true), 200);
  setTimeout(() => (showTitle.value = true), 600);
  setTimeout(() => (showSubtitle.value = true), 1000);
  setTimeout(() => (showButtons.value = true), 1400);
});
</script>

<template>
  <div class="min-h-dvh bg-light-500 rounded-b-3xl">
    <!-- Hero Section -->
    <section
      class="relative min-h-dvh flex flex-col items-center justify-center px-6 pb-32 overflow-hidden bg-linear-to-b from-light-500 via-lavender-500/40 to-light-500"
    >
      <!-- Main content -->
      <div class="relative z-10 text-center max-w-xl">
        <h1
          class="font-lily text-7xl sm:text-8xl md:text-9xl bg-dark-500 bg-clip-text text-transparent leading-none mb-4 transition-all duration-700 ease-out"
          :class="
            showTitle
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-10 scale-90'
          "
        >
          Seed
        </h1>
        <p
          class="text-lg sm:text-xl md:text-2xl text-dark-500/70 mb-10 transition-all duration-500 ease-out"
          :class="
            showSubtitle
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-5'
          "
        >
          Entraîne ton cerveau, un puzzle à la fois
        </p>

        <div
          class="flex flex-col sm:flex-row gap-4 justify-center transition-all duration-500 ease-out"
          :class="
            showButtons
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-5'
          "
        >
          <UiButton variant="primary" @click="scrollToGames"
            >Découvrir nos jeux</UiButton
          >
          <UiButton variant="secondary" @click="handleProgressClick"
            >Ma progression</UiButton
          >
        </div>
      </div>

      <!-- Plant SVG at bottom -->
      <div
        class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-48 sm:w-64 md:w-80 transition-all duration-1000 ease-out"
        :class="
          plantVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-10'
        "
      >
        <img
          src="/img/plant.svg"
          alt=""
          class="w-full h-auto drop-shadow-2xl animate-[sway_6s_ease-in-out_infinite]"
        />
      </div>

      <!-- Scroll hint -->
      <div
        class="absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-500 delay-500"
        :class="showButtons ? 'opacity-100' : 'opacity-0'"
      >
        <div
          class="w-0.5 h-10 bg-linear-to-b from-dark-500/30 to-transparent animate-pulse"
        />
      </div>
    </section>

    <!-- Section Jeux -->
    <section
      id="games"
      class="w-full px-6 md:px-16 py-20 bg-light-500 rounded-b-3xl"
    >
      <div class="max-w-5xl mx-auto">
        <h2
          class="text-3xl md:text-4xl font-lily text-dark-500 text-center mb-3"
        >
          Nos puzzles
        </h2>
        <p class="text-dark-500/60 text-center mb-12 max-w-lg mx-auto">
          Chaque jeu propose des règles uniques et des niveaux de difficulté
          croissante. Commence par le premier et débloque la suite.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Danmen Card -->
          <NuxtLink
            to="/games/danmen"
            class="group relative rounded-2xl p-8 bg-white border border-dark-500/5 hover:border-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 transition-all duration-300"
          >
            <div
              class="absolute inset-0 rounded-2xl bg-linear-to-br from-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
            <div class="relative flex flex-col items-center gap-4 text-center">
              <div class="w-20 h-20">
                <NuxtImg
                  src="/img/danmen.svg"
                  alt="Danmen"
                  class="w-full h-full object-contain"
                />
              </div>
              <h3 class="font-lily text-2xl text-dark-500">Danmen</h3>
              <p class="text-sm text-dark-500/60">
                Remplis la grille en respectant le nombre de cases noires par
                ligne et colonne.
              </p>
              <span
                class="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-500"
              >
                Jouer
                <svg
                  class="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </div>
          </NuxtLink>

          <!-- Coming Soon 1 -->
          <div
            class="rounded-2xl p-8 bg-dark-500/2 border border-dashed border-dark-500/15 flex flex-col items-center justify-center gap-4 text-center"
          >
            <div
              class="w-16 h-16 rounded-xl bg-dark-500/5 flex items-center justify-center text-dark-500/30"
            >
              <svg
                class="w-8 h-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <h3 class="font-lily text-xl text-dark-500/40">Bientôt</h3>
            <p class="text-sm text-dark-500/40">
              De nouveaux puzzles arrivent très prochainement...
            </p>
          </div>

          <!-- Coming Soon 2 -->
          <div
            class="rounded-2xl p-8 bg-dark-500/2 border border-dashed border-dark-500/15 flex flex-col items-center justify-center gap-4 text-center"
          >
            <div
              class="w-16 h-16 rounded-xl bg-dark-500/5 flex items-center justify-center text-dark-500/30"
            >
              <svg
                class="w-8 h-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <circle cx="12" cy="12" r="3" />
                <path
                  d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"
                />
              </svg>
            </div>
            <h3 class="font-lily text-xl text-dark-500/40">Bientôt</h3>
            <p class="text-sm text-dark-500/40">
              Encore plus de défis pour ton cerveau...
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
