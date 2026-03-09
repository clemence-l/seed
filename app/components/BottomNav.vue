<script setup lang="ts">
const route = useRoute();
const auth = useAuth();
const { initAuth, profile } = auth;

onMounted(() => {
  initAuth();
});

const navItems = computed(() => [
  {
    to: "/",
    label: "Jeux",
    iconSrc: "/img/accueil.svg",
    active: route.path === "/",
  },
  {
    to: "/progress",
    label: "Amis",
    iconSrc: "/img/amis.svg",
    active: route.path === "/progress",
  },
  {
    to: "/profile",
    label: "Moi",
    iconSrc: "/img/profile.svg",
    active: route.path === "/profile",
    isProfileTab: true,
  },
]);
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 bg-white border-t border-dark-500/10 md:hidden z-50"
  >
    <div class="w-full py-2 flex items-center justify-around">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-colors"
        :class="item.active ? 'text-dark-500' : 'text-dark-500/40'"
      >
        <!-- Avatar or Icon -->
        <div v-if="item.isProfileTab" class="w-5 h-5">
          <NuxtImg
            v-if="profile?.avatar_url"
            :src="profile.avatar_url"
            :alt="item.label"
            class="w-5 h-5 rounded-full object-cover"
          />
          <NuxtImg
            v-else
            :src="item.iconSrc"
            :alt="item.label"
            class="w-5 h-5"
            :class="{
              'opacity-100': item.active,
              'opacity-40': !item.active,
            }"
          />
        </div>
        <NuxtImg
          v-else
          :src="item.iconSrc"
          :alt="item.label"
          class="w-5 h-5"
          :class="{
            'opacity-100': item.active,
            'opacity-40': !item.active,
          }"
        />
        <span class="text-[11px] font-medium leading-tight whitespace-nowrap">{{
          item.label
        }}</span>
      </NuxtLink>
    </div>
  </nav>
  <div class="h-16 md:hidden" aria-hidden="true" />
</template>
