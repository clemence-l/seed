<script setup lang="ts">
defineProps<{
  mode?: "app" | "profile" | "game";
  displayName?: string;
  title?: string;
  isGamePage?: boolean;
}>();

const emit = defineEmits<{
  goBack: [];
  openRules: [];
}>();
</script>

<template>
  <!-- App Header (simple, centered) -->
  <div
    v-if="mode === 'app' || !mode"
    class="fixed top-0 left-0 right-0 bg-white py-3 text-center z-50 border-b border-dark-500/5"
  >
    <h1 class="font-bold text-xl text-gray-900">Ainigma</h1>
  </div>

  <!-- Profile Header (pseudo left, settings right) -->
  <div
    v-else-if="mode === 'profile'"
    class="fixed top-0 left-0 right-0 bg-white py-3 px-5 flex items-center justify-between z-50 border-b border-dark-500/5"
  >
    <h1 class="font-bold text-lg">{{ displayName }}</h1>
    <NuxtLink to="/settings">
      <NuxtImg
        src="/img/settings.svg"
        alt="Settings"
        class="w-6 h-6 object-contain"
      />
    </NuxtLink>
  </div>

  <!-- Game Header (back, title, rules) -->
  <header
    v-else-if="mode === 'game'"
    class="flex items-center px-3 py-3 border-b border-dark-500/10 bg-white"
  >
    <button
      type="button"
      class="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
      @click="emit('goBack')"
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
      <span class="font-bold text-xl text-dark-500">{{ title }}</span>
    </div>

    <div class="w-10 h-10 flex items-center justify-center">
      <button
        v-if="isGamePage"
        type="button"
        title="Règles"
        class="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        @click="emit('openRules')"
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
          class="text-dark-500"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      </button>
    </div>
  </header>
</template>
