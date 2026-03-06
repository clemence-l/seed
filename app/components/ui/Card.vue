<script setup lang="ts">
/**
 * Composant Card réutilisable
 * Usage: <UiCard title="Mon titre" subtitle="Description">Contenu</UiCard>
 */

defineProps<{
  title?: string;
  subtitle?: string;
  padding?: "none" | "sm" | "md" | "lg";
}>();

const paddingClasses: Record<string, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};
</script>

<template>
  <div
    class="rounded-xl border border-dark-500/10 bg-white shadow-sm"
    :class="paddingClasses[padding || 'md']"
  >
    <div v-if="title || $slots.header" class="mb-4">
      <slot name="header">
        <h3 v-if="title" class="text-lg font-semibold text-dark-500">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="text-sm text-dark-500/60 mt-1">
          {{ subtitle }}
        </p>
      </slot>
    </div>
    <slot />
    <div v-if="$slots.footer" class="mt-4 pt-4 border-t border-dark-500/10">
      <slot name="footer" />
    </div>
  </div>
</template>
