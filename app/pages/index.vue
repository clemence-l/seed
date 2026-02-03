<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";

useHead({ title: "Seed | Jeux de logique quotidiens" });

const auth = useAuth();

// Animation states
const showTitle = ref(false);
const showSubtitle = ref(false);
const showButtons = ref(false);
const plantVisible = ref(false);

// Mouse tracking for interactivity
const mouseX = ref(0);
const mouseY = ref(0);
const windowWidth = ref(1);
const windowHeight = ref(1);

// Normalized mouse position (-1 to 1)
const normalizedMouseX = computed(
  () => (mouseX.value / windowWidth.value) * 2 - 1,
);
const normalizedMouseY = computed(
  () => (mouseY.value / windowHeight.value) * 2 - 1,
);

// Plant transform based on mouse (includes centering)
const plantTransform = computed(() => {
  const rotateX = normalizedMouseY.value * 5;
  const rotateY = normalizedMouseX.value * -8;
  const translateX = normalizedMouseX.value * 15;
  return `translateX(calc(-50% + ${translateX}px)) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});

// Floating shapes data
const floatingShapes = ref([
  { id: 1, type: "circle", size: 80, x: 10, y: 20, delay: 0, duration: 8 },
  { id: 2, type: "circle", size: 40, x: 85, y: 15, delay: 1, duration: 10 },
  { id: 3, type: "circle", size: 60, x: 75, y: 60, delay: 2, duration: 9 },
  { id: 4, type: "circle", size: 30, x: 20, y: 70, delay: 0.5, duration: 11 },
  { id: 5, type: "square", size: 50, x: 90, y: 40, delay: 1.5, duration: 12 },
  { id: 6, type: "square", size: 35, x: 5, y: 50, delay: 2.5, duration: 10 },
  { id: 7, type: "circle", size: 25, x: 60, y: 10, delay: 3, duration: 8 },
  { id: 8, type: "circle", size: 45, x: 30, y: 85, delay: 0.8, duration: 9 },
]);

// Seeds that fall and grow
const seeds = ref([
  { id: 1, x: 25, delay: 0, scale: 0.8 },
  { id: 2, x: 45, delay: 2, scale: 0.6 },
  { id: 3, x: 70, delay: 4, scale: 0.7 },
  { id: 4, x: 15, delay: 6, scale: 0.5 },
  { id: 5, x: 80, delay: 8, scale: 0.9 },
]);

function handleMouseMove(e: MouseEvent) {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
}

function handleResize() {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
}

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
  handleResize();
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("resize", handleResize);

  setTimeout(() => (plantVisible.value = true), 200);
  setTimeout(() => (showTitle.value = true), 600);
  setTimeout(() => (showSubtitle.value = true), 1000);
  setTimeout(() => (showButtons.value = true), 1400);
});

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("resize", handleResize);
});
</script>

<template>
  <div class="min-h-dvh bg-light-500 rounded-b-3xl">
    <!-- Hero Section -->
    <section
      class="relative min-h-dvh flex flex-col items-center justify-center px-6 pb-32 overflow-hidden bg-linear-to-b from-light-500 via-lavender-500/40 to-light-500"
    >
      <!-- Floating shapes background -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          v-for="shape in floatingShapes"
          :key="shape.id"
          class="absolute opacity-[0.07] animate-float"
          :class="
            shape.type === 'circle' ? 'rounded-full' : 'rounded-xl rotate-12'
          "
          :style="{
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            backgroundColor: shape.id % 2 === 0 ? '#5835EF' : '#A868F8',
            animationDelay: `${shape.delay}s`,
            animationDuration: `${shape.duration}s`,
            transform: `translate(${normalizedMouseX * (shape.size / 5)}px, ${normalizedMouseY * (shape.size / 5)}px)`,
            transition: 'transform 0.3s ease-out',
          }"
        />
      </div>

      <!-- Falling seeds animation -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          v-for="seed in seeds"
          :key="seed.id"
          class="absolute animate-seed-fall"
          :style="{
            left: `${seed.x}%`,
            animationDelay: `${seed.delay}s`,
            transform: `scale(${seed.scale})`,
          }"
        >
          <svg
            width="20"
            height="24"
            viewBox="0 0 20 24"
            fill="none"
            class="opacity-30"
          >
            <ellipse cx="10" cy="12" rx="8" ry="10" fill="url(#seedGrad)" />
            <defs>
              <linearGradient
                id="seedGrad"
                x1="10"
                y1="2"
                x2="10"
                y2="22"
                gradientUnits="userSpaceOnUse"
              >
                <stop stop-color="#5835EF" />
                <stop offset="1" stop-color="#A868F8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <!-- Decorative grid pattern -->
      <div
        class="absolute inset-0 opacity-[0.03] pointer-events-none"
        :style="{
          backgroundImage:
            'radial-gradient(circle, #5835EF 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          transform: `translate(${normalizedMouseX * 10}px, ${normalizedMouseY * 10}px)`,
          transition: 'transform 0.5s ease-out',
        }"
      />

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

      <!-- Interactive Plant SVG at bottom -->
      <div
        class="absolute -bottom-2 left-1/2 w-48 sm:w-64 md:w-80 transition-all duration-1000 ease-out cursor-pointer group"
        :class="
          plantVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-10'
        "
        :style="{ transform: plantTransform }"
      >
        <!-- Glow effect on hover -->
        <div
          class="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full scale-75 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />

        <!-- Plant SVG inline for better control -->
        <svg
          viewBox="0 0 393 284"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="w-full h-auto drop-shadow-2xl transition-all duration-300 group-hover:drop-shadow-[0_0_30px_rgba(88,53,239,0.4)] group-hover:scale-105"
        >
          <path
            d="M112.702 4.44193C110.893 2.43032 108.512 1.01245 105.876 0.375929C103.239 -0.260591 100.47 -0.0857591 97.9353 0.877294C95.4006 1.84035 93.2196 3.54623 91.6809 5.76922C90.1421 7.9922 89.3183 10.6275 89.3182 13.3265V179.716C81.4972 162.268 71.8131 145.707 60.4327 130.318C52.3844 119.411 43.199 109.38 33.0299 100.395C29.3662 97.213 25.5189 94.2464 21.5078 91.5103L20.7218 90.9951L20.4539 90.8351L20.3645 90.7818L20.3288 90.764C18.2948 89.5582 15.9586 88.9085 13.5909 88.8808C11.2232 88.8532 8.89022 89.4486 6.82832 90.6066C4.76643 91.7647 3.0489 93.4443 1.84977 95.4753C0.650627 97.5063 0.0124853 99.8165 0 102.172V324.285C0 341.958 0 567.93 0 567.93C0 567.93 49.2335 567.93 67 567.93L326.011 568C344 567.93 393 567.93 393 567.93C393 567.93 393 341.958 393 324.285V102.172C393 99.8133 392.37 97.497 391.176 95.4596C389.982 93.4222 388.265 91.7365 386.202 90.5747C384.138 89.413 381.802 88.8167 379.431 88.8468C377.06 88.877 374.74 89.5324 372.707 90.7463L372.671 90.764L372.635 90.7818L372.546 90.8351L372.278 91.0128C371.105 91.7386 369.961 92.5091 368.848 93.3228C366.651 94.922 363.614 97.232 359.97 100.395C352.682 106.738 342.946 116.44 332.567 130.3C321.186 145.695 311.502 162.262 303.682 179.716V13.3265C303.682 10.6275 302.858 7.9922 301.319 5.76922C299.78 3.54623 297.599 1.84035 295.065 0.877294C292.53 -0.0857591 289.761 -0.260591 287.124 0.375929C284.488 1.01245 282.107 2.43032 280.298 4.44193L280.263 4.47747L280.209 4.54855L279.995 4.77955L279.28 5.61469L276.654 8.70651C274.421 11.3719 271.259 15.3166 267.436 20.3808C256.983 34.2983 247.327 48.7913 238.515 63.7906C220.949 93.5252 206.852 125.158 196.5 158.073C186.148 125.158 172.051 93.5252 154.485 63.7906C145.673 48.7913 136.017 34.2983 125.563 20.3808C121.542 15.0515 117.354 9.84856 113.005 4.77955L112.791 4.54855L112.737 4.47747L112.702 4.44193Z"
            fill="url(#paint0_linear_144_222)"
            class="transition-all duration-300"
          />
          <defs>
            <linearGradient
              id="paint0_linear_144_222"
              x1="196.5"
              y1="0"
              x2="196.5"
              y2="658.25"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="#5835EF" />
              <stop offset="1" stop-color="#A868F8" />
            </linearGradient>
          </defs>
        </svg>

        <!-- Sparkles on hover -->
        <div
          class="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"
        />
        <div
          class="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping animation-delay-200"
        />
        <div
          class="absolute top-1/2 left-1/3 w-1 h-1 bg-lavender-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping animation-delay-400"
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
                Remplis la grille en respectant le nombre de rond par
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
