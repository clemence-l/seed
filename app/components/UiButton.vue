<script setup lang="ts">
const props = defineProps<{
  variant?: "primary" | "outline";
  size?: "sm" | "md";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  fullWidth?: boolean;
}>();

const variant = computed(() => props.variant ?? "primary");
const size = computed(() => props.size ?? "md");
const type = computed(() => props.type ?? "button");

const variantClasses = computed(() => {
  switch (variant.value) {
    case "outline":
      return "bg-transparent text-dark-500 border border-dark-500/20 rounded-sm";
    default:
      return "bg-dark-500 text-white rounded-full text-sm font-light";
  }
});

const sizeClasses = computed(() => {
  switch (size.value) {
    case "sm":
      return "px-2 py-2";
    default:
      return "px-3 py-3";
  }
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      variantClasses,
      sizeClasses,
      'text-sm font-light',
      fullWidth ? 'w-full' : '',
      disabled
        ? 'opacity-50 cursor-not-allowed'
        : 'cursor-pointer hover:scale-[0.98]',
      'flex items-center justify-center gap-2',
    ]"
  >
    <slot />
  </button>
</template>
