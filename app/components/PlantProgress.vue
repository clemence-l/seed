<script setup lang="ts">
interface Props {
  stage: number;
  streak?: number;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  streak: 0,
  compact: false,
});

// Hauteur de la tige basée sur le stage (chaque stage ajoute 16px, max 10 stages affichés)
const stemHeight = computed(() => Math.min(props.stage, 10) * 16 + 24);

// Nombre de feuilles (une toutes les 2 stages, max 5)
const leafCount = computed(() => Math.min(Math.floor(props.stage / 2), 5));
</script>

<template>
  <div
    class="min-h-45 flex flex-col justify-end items-center"
    :class="compact ? 'scale-75' : ''"
  >
    <!-- Plante -->
    <div class="relative flex flex-col items-center">
      <!-- Feuilles -->
      <div
        class="absolute bottom-full flex flex-col items-center"
        :style="{ height: stemHeight + 'px' }"
      >
        <!-- Tige -->
        <div
          class="w-1.5 bg-green-500 rounded-full"
          :style="{ height: stemHeight + 'px' }"
        />
        <!-- Feuilles alternées -->
        <template v-for="i in leafCount" :key="i">
          <div
            class="absolute w-4 h-2 bg-green-400 rounded-full"
            :class="i % 2 === 0 ? '-left-3' : '-right-3'"
            :style="{ bottom: i * 20 + 10 + 'px' }"
          />
        </template>
        <!-- Bourgeon/fleur au sommet si stage >= 5 -->
        <div
          v-if="stage >= 5"
          class="absolute -top-3 w-4 h-4 rounded-full"
          :class="stage >= 10 ? 'bg-purple-500' : 'bg-lavender-500'"
        />
      </div>

      <!-- Pot -->
      <div class="relative z-10">
        <div class="w-12 h-4 bg-dark-500/20 rounded-t-sm" />
        <div class="w-14 h-8 bg-dark-500/30 rounded-b-lg -mt-px" />
      </div>
    </div>

    <!-- Label -->
    <div class="mt-2 text-center">
      <span class="text-sm font-medium text-dark-500"> Jour {{ stage }} </span>
      <span v-if="streak > 0" class="block text-xs text-dark-500/60">
        🔥 {{ streak }} jours consécutifs
      </span>
    </div>
  </div>
</template>
