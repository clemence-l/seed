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
      <!-- Header -->
      <AppHeader
        mode="game"
        :title="title"
        :isGamePage="isGamePage"
        @goBack="goBack"
        @openRules="openRules"
      />

      <!-- Content wrapper with background light -->
      <main class="bg-light-500 min-h-[calc(100dvh-72px)]">
        <slot />
      </main>
    </div>
  </div>
</template>
