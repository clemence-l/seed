<script setup lang="ts">
/**
 * Composant ProfileCard - Carte de profil avec avatar et stats
 */

defineProps<{
  displayName: string;
  avatarUrl?: string | null;
  streak: number;
  totalWins: number;
  isUploading?: boolean;
}>();

const emit = defineEmits<{
  "upload-avatar": [];
}>();
</script>

<template>
  <div
    class="border border-gray-100 bg-white p-8 flex flex-col items-center text-center"
  >
    <!-- Avatar avec upload -->
    <div class="relative mb-6">
      <button
        type="button"
        class="group relative cursor-pointer"
        :disabled="isUploading"
        @click="emit('upload-avatar')"
      >
        <div class="w-40 h-40 p-1 bg-pink-500">
          <div
            class="w-full h-full bg-white flex items-center justify-center overflow-hidden"
          >
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="Avatar"
              class="w-full h-full object-cover"
            />
            <NuxtImg
              v-else
              src="/img/profile.svg"
              alt="Avatar par défaut"
              class="w-11/12 h-11/12 object-contain"
            />
          </div>
        </div>
        <div
          class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <span v-if="!isUploading" class="text-white text-xs font-semibold"
            >Modifier</span
          >
          <span v-else class="text-white text-xs">...</span>
        </div>
      </button>
      <!-- Badge streak -->
      <div
        class="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold whitespace-nowrap bg-pink-500 text-white"
      >
        {{ streak }} jour{{ streak > 1 ? "s" : "" }} de serie
      </div>
    </div>

    <!-- Nom et rôle -->
    <h2 class="text-2xl font-bold text-gray-900 mb-1">{{ displayName }}</h2>
    <p class="text-sm text-gray-400 mb-6">Joueur Seed</p>

    <!-- Stats -->
    <div class="w-full grid grid-cols-2 gap-3">
      <div class="bg-gray-50 border border-gray-100 p-4 text-center">
        <p class="text-2xl font-bold text-pink-500">{{ streak }}</p>
        <p class="text-xs text-gray-400">
          Serie ({{ streak === 1 ? "jour" : "jours" }})
        </p>
      </div>
      <div class="bg-gray-50 border border-gray-100 p-4 text-center">
        <p class="text-2xl font-bold text-purple-500">{{ totalWins }}</p>
        <p class="text-xs text-gray-400">Victoires</p>
      </div>
    </div>

    <!-- Lien vers la plante -->
    <NuxtLink
      to="/progress"
      class="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-all"
    >
      Ma progression →
    </NuxtLink>
  </div>
</template>
