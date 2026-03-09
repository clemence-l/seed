<script setup lang="ts">
useHead({ title: "Ainigma | Jeux de logique quotidiens" });

definePageMeta({ layout: "mobile" });

const today = computed(() => {
  const d = new Date();
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
});

const games = [
  {
    name: "Danmen",
    to: "/games/danmen",
    color: "bg-purple-500/90",
    description: "Place les ronds en respectant les contraintes",
    image: "/img/danmen.svg",
  },
];
</script>

<template>
  <div class="bg-white min-h-dvh pb-20">
    <!-- Header -->
    <AppHeader />

    <!-- Games -->
    <div class="px-5 space-y-4 pt-16">
      <p class="text-base text-center font-medium text-gray-700">
        Belle journée pour jouer !
      </p>
      <NuxtLink
        v-for="game in games"
        :key="game.name"
        :to="game.to"
        :class="{
          ...(game.color && { [game.color]: true }),
        }"
        class="p-5 text-white rounded-xl overflow-hidden transition-transform hover:scale-105 relative block h-40"
      >
        <!-- Title: top left -->
        <div class="absolute top-5 left-5 right-5 pr-16 flex flex-col">
          <h2 class="font-bold text-xl mb-1 wrap-break-words">{{ game.name }}</h2>
          <p
            class="text-sm text-white/80 wrap-break-words whitespace-normal line-clamp-2"
          >
            {{ game.description }}
          </p>
        </div>

        <!-- Date: bottom left -->
        <span
          class="absolute bottom-5 left-5 text-xs font-light uppercase text-white/60"
          >{{ today }}</span
        >

        <!-- Image: top right -->
        <NuxtImg
          v-if="game.image"
          :src="game.image"
          :alt="game.name"
          class="absolute top-5 right-5 h-12 w-12 object-contain"
        />

        <!-- Arrow: bottom right -->
        <span
          class="absolute bottom-5 right-5 text-white/60 text-lg leading-none"
          >→</span
        >
      </NuxtLink>
    </div>

    <!-- Phrase de fin -->
    <p class="text-center text-xs text-gray-400 mt-8 px-5">
      D'autres énigmes arrivent bientôt, reste connecté !
    </p>
  </div>
</template>
