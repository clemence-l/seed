<script setup lang="ts">
/**
 * Composant ProfileCard - Carte de profil avec avatar et stats
 */
import UiIcon from "../ui/Icon.vue";

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

const { getStageName, getBorderGradient, getBadgeClasses } = usePlantStage();
</script>

<template>
  <div
    class="rounded-2xl border border-dark-500/10 bg-white p-8 flex flex-col items-center text-center shadow-sm"
  >
    <!-- Avatar avec upload -->
    <div class="relative mb-6">
      <button
        type="button"
        class="group relative cursor-pointer"
        :disabled="isUploading"
        @click="emit('upload-avatar')"
      >
        <div
          class="w-40 h-40 rounded-full p-1 bg-linear-to-br"
          :class="getBorderGradient(streak)"
        >
          <div
            class="w-full h-full rounded-full bg-light-500 flex items-center justify-center overflow-hidden"
          >
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="Avatar"
              class="w-full h-full object-cover"
            >
            <NuxtImg
              v-else
              src="/img/profile.svg"
              alt="Avatar par défaut"
              class="w-11/12 h-11/12 object-contain"
            /></div>
        </div>
        <div
          class="absolute inset-0 rounded-full bg-dark-500/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <svg
            v-if="!isUploading"
            class="w-8 h-8 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
            <circle cx="12" cy="13" r="4" />
          </path></svg>
          <div
            v-else
            class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"
          />
        </div>
      </button>
      <!-- Badge du stade -->
      <div
        class="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
        :class="getBadgeClasses(streak)"
      >
        {{ getStageName(streak) }}
      </div>
    </div>

    <!-- Nom et rôle -->
    <h2 class="text-2xl font-bold text-dark-500 mb-1">{{ displayName }}</h2>
    <p class="text-sm text-dark-500/60 mb-6">Joueur Seed</p>

    <!-- Stats -->
    <div class="w-full grid grid-cols-2 gap-3">
      <div
        class="rounded-xl bg-dark-500/5 border border-dark-500/10 p-4 text-center"
      >
        <p class="text-2xl font-bold text-dark-500">{{ streak }}</p>
        <p class="text-xs text-dark-500/50">Jours de streak</p>
      </div>
      <div
        class="rounded-xl bg-dark-500/5 border border-dark-500/10 p-4 text-center"
      >
        <p class="text-2xl font-bold text-dark-500">{{ totalWins }}</p>
        <p class="text-xs text-dark-500/50">Niveaux réussis</p>
      </div>
    </div>

    <!-- Lien vers la plante -->
    <NuxtLink
      to="/progress"
      class="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-dark-500 text-light-500 font-semibold hover:bg-dark-500/90 transition-all"
    >
      Voir ma plante
      <UiIcon name="arrow-right" class="w-4 h-4" />
    </NuxtLink>
  </div>
</template>
