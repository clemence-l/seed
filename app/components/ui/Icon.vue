<script setup lang="ts">

// import { computed } from "vue";
/**
 * Composant d'icônes SVG réutilisable
 * Usage:
 * - SVG inline: <UiIcon name="edit" class="w-4 h-4" />
 * - Image file: <UiIcon src="/icons/custom.png" alt="..." class="w-6 h-6" />
 */

type IconName =
  | "edit"
  | "check"
  | "close"
  | "arrow-right"
  | "star"
  | "flame"
  | "trophy"
  | "eye"
  | "eye-off"
  | "chevron-right"
  | "info"
  | "alert";

const props = defineProps<{
  name?: IconName;
  /** When provided, render a NuxtImg instead of an inline SVG */
  src?: string;
  alt?: string;
}>();


const icons: Record<IconName, string> = {
  edit: `<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round" stroke-linejoin="round"/>`,
  check: `<path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>`,
  close: `<path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>`,
  "arrow-right": `<path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>`,
  star: `<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>`,
  flame: `<path d="M12 22c-4.97 0-9-4.03-9-9 0-2.39.94-4.68 2.64-6.36l.64-.64c.78-.78 2.05-.78 2.83 0 .39.39.61.88.61 1.41V9c0 1.1.9 2 2 2s2-.9 2-2V3.59c0-.53.21-1.04.59-1.41.78-.78 2.05-.78 2.83 0l.64.64C19.06 5.32 21 7.61 21 10c0 4.97-4.03 9-9 9z" fill="currentColor"/>`,
  trophy: `<path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21 1.18.54 2.03 2.03 2.03 3.79M18 2H6v7a6 6 0 0012 0V2z" stroke-linecap="round" stroke-linejoin="round"/>`,
  eye: `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  "eye-off": `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke-linecap="round" stroke-linejoin="round"/>`,
  "chevron-right": `<path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>`,
  info: `<circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 16v-4M12 8h.01" stroke-linecap="round" stroke-linejoin="round"/>`,
  alert: `<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke-linecap="round" stroke-linejoin="round"/>`,
};
</script>

<template>
  <NuxtImg
    v-if="props.src"
    :src="props.src"
    :alt="props.alt ?? props.name ?? ''"
    :sizes="undefined"
  />

  <svg
    v-else
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    aria-hidden="true"
  >
    <!-- eslint-disable-next-line vue/no-v-html -->
    <g v-html="icons[props.name]" />
  </svg>
</template>
