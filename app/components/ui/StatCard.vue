<script setup lang="ts">
/**
 * Composant StatCard pour afficher une statistique
 * Usage: <UiStatCard icon="flame" label="Série" :value="streak" />
 */
import UiIcon from "./Icon.vue";

defineProps<{
  icon?: "flame" | "trophy" | "star";
  label: string;
  value: string | number;
  iconColor?: string;
}>();
</script>

<template>
  <div class="flex items-center gap-3 p-4 rounded-xl bg-dark-500/5">
    <div
      v-if="icon"
      class="w-10 h-10 rounded-full flex items-center justify-center"
      :class="iconColor || 'bg-dark-500/10 text-dark-500'"
    >
      <UiIcon :name="icon" class="w-5 h-5" />
    </div>
    <div>
      <p class="text-2xl font-bold text-dark-500">
        {{ value }}
      </p>
      <p class="text-xs text-dark-500/50">{{ label }}</p>
    </div>
  </div>
</template>
