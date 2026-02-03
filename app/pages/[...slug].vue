<script setup lang="ts">
const router = useRouter();

function goHome() {
  router.push("/");
}

function goBack() {
  router.back();
}
</script>

<template>
  <div
    class="progress-page min-h-screen flex items-center justify-center px-4 rounded-b-3xl"
  >
    <div class="text-center max-w-md">
      <!-- Emoji triste -->
      <div class="text-8xl mb-8">🌱</div>

      <!-- Titre -->
      <h1 class="text-6xl font-bold text-dark-500 mb-2">404</h1>

      <!-- Sous-titre -->
      <p class="text-2xl text-dark-500/80 mb-6">Page non trouvée</p>

      <!-- Description -->
      <p class="text-base text-dark-500/60 mb-10">
        La graine que tu cherches ne pousse pas ici. Retourne à l'accueil ou
        reviens en arrière.
      </p>

      <!-- Boutons -->
      <div class="flex gap-3 justify-center">
        <UiButton variant="secondary" size="lg" @click="goBack">
          ← Retour
        </UiButton>
        <UiButton variant="primary" size="lg" @click="goHome">
          Accueil
        </UiButton>
      </div>
    </div>
  </div>
</template>
