<script setup lang="ts">
const props = defineProps<{
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "ghost"
    | "outline";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: boolean;
}>();

const variant = computed(() => props.variant ?? "primary");
const size = computed(() => props.size ?? "md");
const type = computed(() => props.type ?? "button");

const variantClasses = computed(() => {
  switch (variant.value) {
    case "primary":
      return "bg-pink-500 text-white hover:bg-pink-500/90 font-semibold shadow-sm";
    case "secondary":
      return "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200";
    case "success":
      return "bg-lime-500 text-white hover:bg-lime-500/90 font-semibold shadow-sm";
    case "danger":
      return "bg-red-500 text-white hover:bg-red-500/90 font-semibold shadow-sm";
    case "ghost":
      return "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900";
    case "outline":
      return "bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50";
    default:
      return "bg-pink-500 text-white hover:bg-pink-500/90 font-semibold shadow-sm";
  }
});

const sizeClasses = computed(() => {
  if (props.icon) {
    switch (size.value) {
      case "sm":
        return "w-8 h-8";
      case "lg":
        return "w-12 h-12";
      default:
        return "w-10 h-10";
    }
  }
  switch (size.value) {
    case "sm":
      return "px-4 py-2 text-sm";
    case "lg":
      return "px-8 py-3 text-base";
    default:
      return "px-6 py-2.5 text-sm";
  }
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="rounded-lg font-semibold transition-all duration-200 outline-none inline-flex items-center justify-center gap-2"
    :class="[
      variantClasses,
      sizeClasses,
      fullWidth ? 'w-full' : '',
      disabled
        ? 'opacity-50 cursor-not-allowed'
        : 'cursor-pointer hover:scale-[0.98]',
    ]"
  >
    <slot />
  </button>
</template>
