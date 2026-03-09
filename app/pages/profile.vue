<script setup lang="ts">
import UiAlert from "../components/ui/Alert.vue";

definePageMeta({
  layout: "mobile",
  ssr: false, // Désactiver SSR car la page gère l'auth client-only
});

const auth = useAuth();
const progress = useProgress();
const messages = useMessages();

const avatarInput = ref<HTMLInputElement | null>(null);
const uploadingAvatar = ref(false);
const settingsSheet = ref<{ open: () => void; close: () => void } | null>(null);
const authSheet = ref<{ open: () => void; close: () => void } | null>(null);

function openSettings() {
  settingsSheet.value?.open();
}

function openAuthLogin() {
  authSheet.value?.open();
}

function openAuthRegister() {
  authSheet.value?.open();
}
const streak = ref(0);
const streakCount = ref(0); // nombre de victoires
const localDisplayName = ref<string | null>(null);

const displayName = computed(
  () => localDisplayName.value || auth.displayName.value || "Joueur",
);

useHead(() => ({
  title: `Seed | ${displayName.value}`,
}));

const statsLoaded = ref(false);

// Charger les stats dès que l'auth est prête (réactif, pas juste onMounted)
watch(
  () => auth.ready.value,
  async (ready) => {
    if (!ready) return;
    if (!auth.isLoggedIn.value) return;
    if (statsLoaded.value) return; // ne charger qu'une fois

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().slice(0, 10);
      const endDate = new Date().toISOString().slice(0, 10);

      const [streakData, plays] = await Promise.all([
        progress.getStreak(),
        progress.getPlaysForDateRange(startDate, endDate),
      ]);

      streak.value = streakData.streak;
      streakCount.value = plays.length;
      statsLoaded.value = true;
    } catch (e) {
      console.error("Erreur chargement stats:", e);
    }
  },
  { immediate: true },
);

function triggerAvatarUpload() {
  avatarInput.value?.click();
}

async function handleAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    messages.setError("Le fichier doit être une image");
    return;
  }
  uploadingAvatar.value = true;
  messages.clearAll();

  // Compresser l'image avant upload (512x512, JPEG 80%)
  const { compressImage } = useImageCompress();
  let fileToUpload: File;
  try {
    fileToUpload = await compressImage(file, 512, 512, 0.8);
  } catch {
    messages.setError("Impossible de compresser l'image");
    uploadingAvatar.value = false;
    return;
  }

  const result = await auth.updateAvatar(fileToUpload);
  uploadingAvatar.value = false;
  if (result.success) {
    messages.setSuccess("Photo de profil mise à jour");
  } else {
    messages.setError(result.error ?? "Erreur lors de l'upload");
  }
  target.value = "";
}
</script>

<template>
  <main class="min-h-dvh bg-white text-gray-900 pb-20">
    <!-- Header -->
    <AppHeader
      mode="profile"
      :display-name="displayName"
      @open-settings="openSettings"
    />

    <!-- Settings Sheet -->
    <SettingsSheet ref="settingsSheet" />

    <!-- Auth Sheet -->
    <AuthSheet ref="authSheet" />

    <!-- Content -->
    <div class="pt-16 px-5 py-6">
      <UiAlert
        v-if="messages.error.value"
        type="error"
        dismissible
        class="mb-6"
      >
        {{ messages.error.value }}
      </UiAlert>

      <template v-if="auth.user.value">
        <!-- Profile Photo Section -->
        <div class="flex flex-col items-center mb-8">
          <div class="relative mb-4">
            <NuxtImg
              v-if="auth.profile.value?.avatar_url"
              :src="auth.profile.value.avatar_url"
              :alt="displayName"
              class="w-24 h-24 rounded-full object-cover"
            />
            <NuxtImg
              v-else
              src="/img/profile.svg"
              :alt="displayName"
              class="w-24 h-24 rounded-full object-cover"
            />
            <button
              :disabled="uploadingAvatar"
              class="absolute bottom-0 right-0 bg-dark-500 text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50"
              title="Modifier la photo"
              @click="triggerAvatarUpload"
            >
              <NuxtImg
                src="/img/pencil.svg"
                alt="Modifier"
                class="w-3.5 h-3.5 brightness-0 invert"
              />
            </button>
          </div>
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleAvatarChange"
          />
          <p class="text-sm text-gray-500 text-center">
            {{ displayName }}, découvre tes statistiques !
          </p>
        </div>

        <!-- Game Stats Cards -->
        <div class="space-y-4">
          <div
            v-if="streakCount > 0 || streak > 0"
            class="bg-gray-50 p-4 rounded-lg"
          >
            <div class="flex items-start justify-between mb-3">
              <h3 class="font-bold text-lg">Danmen</h3>
              <NuxtImg
                src="/img/danmen.svg"
                alt="Danmen"
                class="w-8 h-8 object-contain"
              />
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-gray-500">Victoires</p>
                <p class="font-bold text-lg">{{ streakCount }}</p>
              </div>
              <div>
                <p class="text-gray-500">Streak</p>
                <p class="font-bold text-lg">{{ streak }}</p>
              </div>
              <div class="col-span-2 pt-2 border-t border-gray-200">
                <p class="text-gray-500">Meilleur temps</p>
                <p class="font-bold">--:--</p>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-8 text-gray-400">
            <p class="mb-2">Aucun jeu encore joué</p>
            <NuxtLink
              to="/games/danmen"
              class="text-purple-500 hover:underline"
            >
              Commence par jouer à Danmen →
            </NuxtLink>
          </div>
        </div>
      </template>

      <!-- Non connecté : Afficher les boutons d'auth -->
      <template v-else>
        <div
          class="flex flex-col items-center justify-center min-h-[calc(100dvh-200px)]"
        >
          <p class="text-center text-gray-600 mb-6 text-base">
            Connecte-toi pour voir ton profil et tes statistiques !
          </p>
          <div class="mb-3">
            <UiButton @click="openAuthRegister">
              Créer un compte gratuitement
            </UiButton>
          </div>
          <button
            class="text-dark-500 font-light underline"
            @click="openAuthLogin"
          >
            Se connecter
          </button>
        </div>
      </template>
    </div>
  </main>
</template>
