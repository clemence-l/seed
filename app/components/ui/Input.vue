<script setup lang="ts">
/**
 * Composant Input réutilisable
 * Usage: <UiInput v-model="email" type="email" label="Email" placeholder="ton@email.com" />
 */

defineProps<{
  modelValue: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autocomplete?: string;
  id?: string;
  name?: string;
  error?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
}
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="id"
      class="block text-sm font-medium text-dark-500 mb-1.5"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <input
      :id="id"
      :type="type || 'text'"
      :name="name"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :autocomplete="autocomplete"
      class="w-full rounded-lg border border-dark-500/20 bg-light-500 px-3 py-2.5 text-dark-500 outline-none transition-all focus:border-dark-500 focus:ring-1 focus:ring-dark-500 disabled:opacity-50 disabled:cursor-not-allowed"
      :class="{
        'border-red-500 focus:border-red-500 focus:ring-red-500': error,
      }"
      @input="onInput"
    >
    <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
  </div>
</template>
