<script setup lang="ts">
const route = useRoute();
const { isLoggedIn, initAuth } = useAuth();

// Initialiser l'auth au montage (client-side)
onMounted(() => {
  initAuth();
});
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 bg-white-500/95 backdrop-blur-sm border-t border-lavender-500 md:hidden z-50"
  >
    <div class="max-w-2xl mx-auto px-4 h-16 flex items-center justify-around">
      <NuxtLink
        to="/"
        class="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors"
        :class="
          route.path === '/'
            ? 'text-purple-500'
            : 'text-black-500/60 hover:text-black-500'
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect width="7" height="7" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
        <span class="text-xs font-medium">Jeux</span>
      </NuxtLink>

      <NuxtLink
        to="/progress"
        class="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors"
        :class="
          route.path === '/progress'
            ? 'text-purple-500'
            : 'text-black-500/60 hover:text-black-500'
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 2a10 10 0 1 0 10 10" />
          <path d="M12 12V6" />
          <path d="M12 2v4" />
        </svg>
        <span class="text-xs font-medium">Progression</span>
      </NuxtLink>

      <NuxtLink
        :to="isLoggedIn ? '/profile' : '/auth/login'"
        class="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors"
        :class="
          ['/profile', '/auth/login'].includes(route.path)
            ? 'text-purple-500'
            : 'text-black-500/60 hover:text-black-500'
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span class="text-xs font-medium">{{
          isLoggedIn ? "Profil" : "Connexion"
        }}</span>
      </NuxtLink>
    </div>
  </nav>

  <!-- Spacer pour la nav bottom sur mobile -->
  <div class="h-16 md:hidden" aria-hidden="true" />
</template>
