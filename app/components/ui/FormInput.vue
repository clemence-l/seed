<script setup lang="ts">
interface Props {
  modelValue: string;
  label?: string;
  type?: "email" | "text" | "password";
  placeholder?: string;
  disabled?: boolean;
}

defineProps<Props>();
defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <div>
    <label v-if="label" class="text-sm">{{ label }}</label>
    <input
      :value="modelValue"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full p-2 border border-dark-500/20 rounded-sm text-sm text-dark-500 focus:border focus:border-dark-500 focus:outline-none"
      @input="
        $emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
    />
  </div>
</template>
