<script setup lang="ts">
const auth = useAuth();

const authReady = computed(() => auth.ready.value);
const isLoggedIn = computed(() => auth.isLoggedIn.value);
const displayName = computed(() => auth.displayName.value);

const linkTo = computed(() => {
  if (!authReady.value) return "/auth/login";
  return isLoggedIn.value ? "/profile" : "/auth/login";
});

const label = computed(() => {
  if (!authReady.value) return "Connexion";
  return isLoggedIn.value ? (displayName.value ?? "Profil") : "Connexion";
});
</script>

<template>
  <header
    class="fixed w-screen top-0 z-50 bg-light-500 border-b border-dark-500/10 py-4 px-8"
  >
    <div class="flex items-center justify-between">
      <NuxtLink to="/" class="hover:scale-90 transition-transform ease-in">
        <NuxtImg src="/img/logo-seed.svg" class="h-6" />
      </NuxtLink>
      <ClientOnly>
        <NuxtLink :to="linkTo" class="flex gap-2 items-center group">
          <NuxtImg
            src="/img/profile.svg"
            class="h-8 group-hover:scale-90 transition-transform ease-in"
          />
          <span class="font-semibold">{{ label }}</span>
        </NuxtLink>
        <template #fallback>
          <NuxtLink to="/auth/login" class="flex gap-2 items-center group">
            <NuxtImg
              src="/img/profile.svg"
              class="h-8 group-hover:scale-90 transition-transform ease-in"
            />
            <span class="font-semibold">Connexion</span>
          </NuxtLink>
        </template>
      </ClientOnly>
    </div>
  </header>
</template>
