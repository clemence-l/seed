<script setup lang="ts">
/**
 * Composant Spinner de chargement
 * Usage: <UiSpinner size="md" />
 * Couleur dark par défaut pour cohérence UI
 */

withDefaults(
  defineProps<{
    size?: "sm" | "md" | "lg" | "xl";
    color?: "dark" | "light" | "primary";
  }>(),
  {
    size: "md",
    color: "dark",
  },
);

const sizeClasses: Record<string, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-[3px]",
  xl: "w-12 h-12 border-[3px]",
};

const colorClasses: Record<string, string> = {
  dark: "border-dark-500/15 border-t-dark-500",
  light: "border-light-500/20 border-t-light-500",
  primary: "border-green-200 border-t-green-500",
};
</script>

<template>
  <div
    class="rounded-full animate-spin"
    :class="[sizeClasses[size], colorClasses[color]]"
    role="status"
    aria-label="Chargement"
  />
</template>
