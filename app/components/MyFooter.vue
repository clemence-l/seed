<template>
  <footer class="border-t border-gray-100 pt-8 pb-16 px-8 bg-white">
    <div
      class="flex flex-col items-center justify-center text-center max-w-5xl mx-auto"
    >
      <!-- Logo -->
      <div class="mb-6">
        <NuxtImg src="/img/logo.svg" alt="Aínigma" class="h-8" />
      </div>

      <!-- Liens légaux -->
      <nav class="flex flex-wrap justify-center gap-4 mb-6 text-sm">
        <NuxtLink
          to="/legal/mentions"
          class="text-gray-400 hover:text-gray-700 transition-colors"
        >
          Mentions légales
        </NuxtLink>
        <NuxtLink
          to="/legal/privacy"
          class="text-gray-400 hover:text-gray-700 transition-colors"
        >
          Politique de confidentialité
        </NuxtLink>
        <NuxtLink
          to="/legal/cgu"
          class="text-gray-400 hover:text-gray-700 transition-colors"
        >
          CGU
        </NuxtLink>
      </nav>

      <!-- Copyright -->
      <p class="text-xs text-gray-300">© 2026 aínigma. Tous droits réservés.</p>
    </div>
  </footer>
</template>
