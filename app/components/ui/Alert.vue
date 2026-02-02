<script setup lang="ts">
/**
 * Composant Alert pour afficher des messages de succès/erreur/info
 * Usage: <UiAlert type="success">Message de succès</UiAlert>
 */

defineProps<{
  type?: "success" | "error" | "info" | "warning";
  dismissible?: boolean;
}>();

const emit = defineEmits<{
  (e: "dismiss"): void;
}>();

const typeClasses: Record<string, string> = {
  success: "bg-green-50 border-green-200 text-green-700",
  error: "bg-red-50 border-red-200 text-red-700",
  info: "bg-blue-50 border-blue-200 text-blue-700",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
};

const visible = ref(true);

function dismiss() {
  visible.value = false;
  emit("dismiss");
}
</script>

<template>
  <div
    v-if="visible"
    class="rounded-lg border px-4 py-3 text-sm"
    :class="typeClasses[type || 'info']"
    role="alert"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1">
        <slot />
      </div>
      <button
        v-if="dismissible"
        type="button"
        class="opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
        @click="dismiss"
      >
        <svg
          class="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            d="M6 18L18 6M6 6l12 12"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  </div>
</template>
