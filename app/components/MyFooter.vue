<template>
  <footer
    class="fixed bottom-0 inset-x-0 -z-10 bg-linear-to-t from-dark-500 to-dark-200 pt-32 pb-16 px-8"
  >
    <div
      class="flex flex-col items-center justify-center text-center max-w-5xl mx-auto"
    >
      <!-- Logo -->
      <div class="mb-6">
        <NuxtImg src="/img/logo-icon.svg" alt="Seed" class="h-8" />
      </div>

      <!-- Liens légaux -->
      <nav class="flex flex-wrap justify-center gap-4 mb-6 text-sm">
        <NuxtLink
          to="/legal/mentions"
          class="text-light-500/60 hover:text-light-500 transition-colors"
        >
          Mentions légales
        </NuxtLink>
        <NuxtLink
          to="/legal/privacy"
          class="text-light-500/60 hover:text-light-500 transition-colors"
        >
          Politique de confidentialité
        </NuxtLink>
        <NuxtLink
          to="/legal/cgu"
          class="text-light-500/60 hover:text-light-500 transition-colors"
        >
          CGU
        </NuxtLink>
      </nav>

      <!-- Copyright -->
      <p class="text-xs text-light-500/40">
        © 2026 Seed. Tous droits réservés.
      </p>
    </div>
  </footer>
</template>
