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
  <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
    <div
      v-if="icon"
      class="w-10 h-10 rounded-xl flex items-center justify-center"
      :class="iconColor || 'bg-gray-100 text-gray-700'"
    >
      <UiIcon :name="icon" class="w-5 h-5" />
    </div>
    <div>
      <p class="text-2xl font-bold text-gray-900">
        {{ value }}
      </p>
      <p class="text-xs text-gray-400">{{ label }}</p>
    </div>
  </div>
</template>
