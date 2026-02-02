<script setup lang="ts">
/**
 * Composant de champ éditable inline
 * Usage: <UiEditableField v-model="username" label="Pseudo" :display-value="username" />
 */
import UiIcon from "./Icon.vue";

const props = defineProps<{
  modelValue: string;
  label: string;
  displayValue?: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  successMessage?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  save: [];
  cancel: [];
}>();

const isEditing = ref(false);
const localValue = ref(props.modelValue);

watch(
  () => props.modelValue,
  (val) => {
    localValue.value = val;
  },
);

function startEdit() {
  localValue.value = props.modelValue;
  isEditing.value = true;
}

function save() {
  emit("update:modelValue", localValue.value);
  emit("save");
  isEditing.value = false;
}

function cancel() {
  localValue.value = props.modelValue;
  emit("cancel");
  isEditing.value = false;
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  localValue.value = target.value;
}
</script>

<template>
  <div class="pb-6 border-b border-dark-500/10">
    <p class="text-xs text-dark-500/40 uppercase tracking-wider mb-1">
      {{ label }}
    </p>

    <template v-if="isEditing">
      <div class="flex items-center gap-2">
        <input
          :value="localValue"
          :type="type || 'text'"
          :placeholder="placeholder"
          class="flex-1 rounded-lg border border-dark-500/20 bg-light-500 px-3 py-2 text-dark-500 outline-none focus:border-dark-500 focus:ring-1 focus:ring-dark-500"
          @input="onInput"
          @keyup.enter="save"
          @keyup.escape="cancel"
        >
        <button
          type="button"
          class="w-8 h-8 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors cursor-pointer"
          @click="save"
        >
          <UiIcon name="check" class="w-4 h-4" />
        </button>
        <button
          type="button"
          class="w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors cursor-pointer"
          @click="cancel"
        >
          <UiIcon name="close" class="w-4 h-4" />
        </button>
      </div>
    </template>

    <template v-else>
      <div class="flex items-center justify-between">
        <p class="text-dark-500">
          <slot name="display">
            {{ type === "password" ? "••••••••" : displayValue || modelValue }}
          </slot>
        </p>
        <button
          type="button"
          class="text-dark-500/50 hover:text-dark-500 transition-colors cursor-pointer"
          @click="startEdit"
        >
          <UiIcon name="edit" class="w-4 h-4" />
        </button>
      </div>
      <p v-if="successMessage" class="mt-2 text-xs text-green-600">
        {{ successMessage }}
      </p>
    </template>
  </div>
</template>
