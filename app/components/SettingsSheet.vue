<script setup lang="ts">
const auth = useAuth();
const router = useRouter();

const isOpen = ref(false);
const darkMode = ref(false);
const notificationsEnabled = ref(true);

function open() {
  isOpen.value = true;
}

function close() {
  isOpen.value = false;
}

defineExpose({ open, close });

async function handleLogout() {
  close();
  await auth.signOut();
  await router.push("/");
}

function navigateTo(path: string) {
  close();
  router.push(path);
}
</script>

<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/50"
      style="z-index: 50"
      @click="close"
    />
  </Transition>

  <!-- Sheet -->
  <Transition name="slide-up">
    <div
      v-if="isOpen"
      class="fixed left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-xl"
      style="height: 96vh; z-index: 51"
    >
      <!-- Handle bar + Terminé -->
      <div class="relative flex items-center justify-end px-3 py-4">
        <h2
          class="absolute inset-x-0 pointer-events-none text-sm uppercase text-center text-gray-900"
        >
          Paramètres
        </h2>
        <button class="text-xs font-light text-dark-500/40" @click="close">
          Terminé
        </button>
      </div>

      <!-- Scrollable content -->
      <div
        class="overflow-y-auto px-5 pb-10"
        style="max-height: calc(100% - 60px)"
      >
        <!-- Compte Section -->
        <div class="py-4 border-b border-gray-200">
          <p class="text-xs font-semibold text-gray-400 uppercase mb-3">
            Compte
          </p>
          <!-- Email -->
          <div class="py-2 flex items-center justify-between">
            <span class="text-sm text-gray-900">{{ auth.user.value?.email }}</span>
          </div>
          <!-- Privacy Settings Button -->
          <button
            class="w-full py-2 text-left text-sm text-dark-500 hover:text-dark-500/70 transition-colors"
            @click="navigateTo('/legal/privacy')"
          >
            Privacy Settings →
          </button>
          <!-- Manage Account Button -->
          <button
            class="w-full py-2 text-left text-sm text-dark-500 hover:text-dark-500/70 transition-colors"
            @click="navigateTo('/profile')"
          >
            Manage Account →
          </button>
          <!-- Logout Button -->
          <button
            class="w-full py-2 text-left text-sm text-red-500 hover:text-red-600 transition-colors"
            @click="handleLogout"
          >
            Déconnexion
          </button>
        </div>

        <!-- Theme Section -->
        <div class="py-4 border-b border-gray-200">
          <p class="text-xs font-semibold text-gray-400 uppercase mb-3">
            Affichage
          </p>
          <div class="flex items-center justify-between py-2">
            <span class="text-sm text-gray-900">Mode sombre</span>
            <button
              class="relative w-10 h-6 rounded-full transition-colors"
              :class="darkMode ? 'bg-purple-500' : 'bg-gray-300'"
              @click="darkMode = !darkMode"
            >
              <span
                class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform"
                :class="darkMode ? 'translate-x-4' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>

        <!-- Notifications Section -->
        <div class="py-4 border-b border-gray-200">
          <p class="text-xs font-semibold text-gray-400 uppercase mb-3">
            Notifications
          </p>
          <div class="flex items-center justify-between py-2">
            <span class="text-sm text-gray-900">Notifications</span>
            <button
              class="relative w-10 h-6 rounded-full transition-colors"
              :class="notificationsEnabled ? 'bg-purple-500' : 'bg-gray-300'"
              @click="notificationsEnabled = !notificationsEnabled"
            >
              <span
                class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform"
                :class="notificationsEnabled ? 'translate-x-4' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>

        <!-- Contact Section -->
        <div class="py-4 border-b border-gray-200">
          <p class="text-xs font-semibold text-gray-400 uppercase mb-3">
            Support
          </p>
          <button
            class="w-full py-2 text-left text-sm text-dark-500 hover:text-dark-500/70 transition-colors"
          >
            Nous contacter →
          </button>
        </div>

        <!-- About Section -->
        <div class="py-4 border-b border-gray-200">
          <p class="text-xs font-semibold text-gray-400 uppercase mb-3">
            À propos
          </p>
          <div class="py-2">
            <p class="text-xs text-gray-600 mb-1">
              <span class="font-semibold">Version:</span> 1.0.0
            </p>
            <p class="text-xs text-gray-600 mb-1">
              <span class="font-semibold">Développé par:</span> Clémence Lauga
            </p>
          </div>
          <button
            class="w-full py-2 text-left text-sm text-dark-500 hover:text-dark-500/70 transition-colors"
            @click="navigateTo('/legal/cgu')"
          >
            Conditions d'utilisation →
          </button>
          <button
            class="w-full py-2 text-left text-sm text-dark-500 hover:text-dark-500/70 transition-colors"
            @click="navigateTo('/legal/mentions')"
          >
            Mentions légales →
          </button>
        </div>

        <!-- Copyright -->
        <div class="py-4 text-center">
          <p class="text-xs text-gray-400">© 2026 Ainigma. All rights reserved.</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
