<script setup lang="ts">
import { ref } from "vue";

definePageMeta({ layout: "mobile" });

useHead({ title: "Aínigma | Parametres" });

const auth = useAuth();
const router = useRouter();

const notifications = ref(true);
const soundEnabled = ref(true);
const darkMode = ref(false);

async function handleLogout() {
  await auth.signOut();
  await router.push("/");
}

const sections = computed(() => [
  {
    title: "Compte",
    items: [
      { label: "Profil", action: () => router.push("/profile"), icon: "O" },
      { label: "Deconnexion", action: handleLogout, icon: "->" },
    ],
  },
  {
    title: "Notifications",
    items: [
      {
        label: "Notifications",
        toggle: notifications,
        icon: "!",
      },
      {
        label: "Son",
        toggle: soundEnabled,
        icon: "~",
      },
    ],
  },
  {
    title: "Affichage",
    items: [
      {
        label: "Mode sombre",
        toggle: darkMode,
        icon: "*",
      },
    ],
  },
  {
    title: "Informations legales",
    items: [
      { label: "Conditions d'utilisation", to: "/legal/cgu", icon: "[ ]" },
      {
        label: "Politique de confidentialite",
        to: "/legal/privacy",
        icon: "[ ]",
      },
      { label: "Mentions legales", to: "/legal/mentions", icon: "[ ]" },
    ],
  },
  {
    title: "A propos",
    items: [
      { label: "Version", value: "1.0.0", icon: "#" },
      { label: "Developpe par", value: "Clement Lauga", icon: "C" },
      { label: "Aide & Support", action: () => {}, icon: "?" },
    ],
  },
]);
</script>

<template>
  <div class="bg-white min-h-dvh pb-20">
    <!-- Header -->
    <AppHeader
      mode="section"
      title="Parametres"
      description="Gere tes preferences"
    />

    <!-- Sections -->
    <div class="space-y-6">
      <section v-for="section in sections" :key="section.title" class="px-5">
        <h2
          class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3"
        >
          {{ section.title }}
        </h2>

        <div class="space-y-1">
          <div
            v-for="(item, idx) in section.items"
            :key="`${section.title}-${idx}`"
            class="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <!-- Icon + Label -->
            <div class="flex items-center gap-3">
              <span class="text-sm font-semibold text-gray-400 w-6 text-center">
                {{ item.icon }}
              </span>
              <span class="text-sm font-medium text-gray-900">
                {{ item.label }}
              </span>
            </div>

            <!-- Toggle Switch -->
            <div v-if="item.toggle" class="flex items-center">
              <button
                class="relative w-10 h-6 rounded-full bg-gray-300 transition-colors"
                :class="item.toggle.value ? 'bg-purple-500' : 'bg-gray-300'"
                @click="item.toggle.value = !item.toggle.value"
              >
                <span
                  class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform"
                  :class="item.toggle.value ? 'translate-x-4' : 'translate-x-0'"
                />
              </button>
            </div>

            <!-- Value / Link -->
            <div
              v-else-if="item.value"
              class="text-xs text-gray-400 font-medium"
            >
              {{ item.value }}
            </div>

            <!-- Action / Link -->
            <div
              v-else-if="item.action || item.to"
              class="text-gray-400 text-sm font-semibold"
            >
              →
            </div>

            <!-- Clickable wrapper -->
            <div
              v-if="item.action || item.to"
              class="absolute inset-0 cursor-pointer"
              @click="
                item.action ? item.action() : item.to && router.push(item.to)
              "
            />
          </div>
        </div>
      </section>

      <!-- Divider -->
      <div class="h-8" />
    </div>

    <!-- Footer note -->
    <div class="px-5 pb-6">
      <p class="text-xs text-gray-400 text-center">v1.0.0 | Ainigma 2026</p>
    </div>
  </div>
</template>
