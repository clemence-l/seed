<script setup lang="ts">
const route = useRoute();
const router = useRouter();

const gameName = computed(() => (route.params.game as string) ?? null);
const isGamePage = computed(() => !!route.path?.startsWith?.("/games"));
const title = computed(() => {
  if (isGamePage.value && gameName.value) {
    const name = String(gameName.value);
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return "Seed";
});

function goBack() {
  router.push("/");
}

function openRules() {
  // Dispatch a global event the page can listen to
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("seed:open-tutorial"));
  }
}
</script>

<template>
  <div class="min-h-dvh bg-light-500 flex items-start justify-center">
    <div
      class="w-full max-w-120 mx-auto min-h-dvh shadow-[0_0_40px_rgba(0,0,0,0.05)]"
    >
      <!-- Header placé ici -->
      <header
        class="flex items-center px-3 py-3 border-b border-dark-500/10 bg-light-500"
      >
        <button
          type="button"
          class="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-dark-500/10 transition-colors"
          @click="goBack"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-dark-500"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
        </button>

        <div class="flex-1 flex items-center justify-center">
          <span class="font-lily text-2xl text-dark-500">{{ title }}</span>
        </div>

        <div class="w-10 h-10 flex items-center justify-center">
          <button
            v-if="isGamePage"
            type="button"
            title="Règles"
            class="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-dark-500/10 transition-colors"
            @click="openRules"
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
              class="text-dark-500/80"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Content wrapper with background light -->
      <main class="bg-light-500 min-h-[calc(100dvh-72px)]">
        <slot />
      </main>
    </div>
  </div>
</template>
