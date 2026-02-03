<script setup lang="ts">
/**
 * Page Profil - Version refactorisée
 */
import ProfileCard from "../components/profile/ProfileCard.vue";
import ProfileAccountInfo from "../components/profile/ProfileAccountInfo.vue";
import UiAlert from "../components/ui/Alert.vue";
import UiSpinner from "../components/ui/Spinner.vue";
import UiButton from "../components/UiButton.vue";

const router = useRouter();
const auth = useAuth();
const progress = useProgress();
const messages = useMessages();

const avatarInput = ref<HTMLInputElement | null>(null);
const uploadingAvatar = ref(false);
const streak = ref(0);
const streakCount = ref(0);
const loading = ref(true);
const localDisplayName = ref<string | null>(null);
const pendingEmail = ref<string | null>(null);

const displayName = computed(
  () => localDisplayName.value || auth.displayName.value || "Joueur",
);

useHead(() => ({
  title: `Seed | ${displayName.value}`,
}));

onMounted(async () => {
  await auth.initAuth();
  if (!auth.isLoggedIn.value) {
    await router.push("/auth/login");
    return;
  }
  try {
    const plantState = await progress.getPlantState();
    streak.value = plantState.totalStreak ?? 0;
    streakCount.value = plantState.plants.length;
  } catch (e) {
    console.error("Erreur chargement stats:", e);
  } finally {
    loading.value = false;
  }
});

async function handleLogout() {
  try {
    await auth.signOut();
    await router.push("/");
  } catch (e) {
    console.error("[profile] handleLogout error", e);
  }
}

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
  if (file.size > 2 * 1024 * 1024) {
    messages.setError("L'image ne doit pas dépasser 2MB");
    return;
  }
  uploadingAvatar.value = true;
  messages.clearAll();
  const result = await auth.updateAvatar(file);
  uploadingAvatar.value = false;
  if (result.success) {
    messages.setSuccess("Photo de profil mise à jour");
  } else {
    messages.setError(result.error ?? "Erreur lors de l'upload");
  }
  target.value = "";
}

async function handleSaveEmail(newEmail: string) {
  messages.clearAll();
  pendingEmail.value = newEmail;
  const result = await auth.updateEmail(newEmail);
  if (!result.success) {
    pendingEmail.value = null;
    messages.setError(result.error ?? "Erreur de mise à jour");
  }
}

async function handleSaveUsername(newUsername: string) {
  messages.clearAll();
  localDisplayName.value = newUsername;
  const result = await auth.updateDisplayName(newUsername);
  if (result.success) {
    messages.setSuccess("Pseudo mis à jour");
  } else {
    localDisplayName.value = null;
    messages.setError(result.error ?? "Erreur de mise à jour");
  }
}

async function handleSavePassword(password: string) {
  messages.clearAll();
  const result = await auth.updatePassword(password);
  if (result.success) {
    messages.setSuccess("Mot de passe mis à jour");
  } else {
    messages.setError(result.error ?? "Erreur de mise à jour");
  }
}
</script>

<template>
  <main
    class="min-h-dvh bg-light-500 text-dark-500 px-4 py-8 pt-16 md:px-8 rounded-b-3xl flex items-center"
  >
    <div class="max-w-5xl mx-auto w-full">
      <UiAlert
        v-if="messages.success.value"
        type="success"
        dismissible
        class="mb-4"
      >
        {{ messages.success.value }}
      </UiAlert>
      <UiAlert
        v-if="messages.error.value"
        type="error"
        dismissible
        class="mb-4"
      >
        {{ messages.error.value }}
      </UiAlert>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <UiSpinner size="lg" />
      </div>

      <template v-else-if="auth.user.value">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-4">
            <ProfileCard
              :display-name="displayName"
              :avatar-url="auth.profile.value?.avatar_url"
              :streak="streak"
              :streak-count="streakCount"
              :is-uploading="uploadingAvatar"
              @upload-avatar="triggerAvatarUpload"
            />
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleAvatarChange"
            />
          </div>

          <div class="lg:col-span-8 space-y-6">
            <ProfileAccountInfo
              :email="auth.user.value?.email ?? ''"
              :display-name="displayName"
              :role="auth.profile.value?.role"
              :created-at="auth.profile.value?.created_at"
              :pending-email="pendingEmail"
              @save-email="handleSaveEmail"
              @save-username="handleSaveUsername"
              @save-password="handleSavePassword"
            />

            <div class="flex flex-col sm:flex-row gap-4">
              <NuxtLink
                to="/"
                class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-light-500 border border-dark-500/20 text-dark-500 font-semibold hover:bg-dark-500/5 transition-colors"
              >
                Retour accueil
              </NuxtLink>
              <UiButton
                variant="danger"
                size="lg"
                class="flex-1"
                @click="handleLogout"
              >
                Déconnexion
              </UiButton>
            </div>
          </div>
        </div>
      </template>

      <UiAlert v-else-if="auth.error.value" type="error" class="text-center">
        {{ auth.error.value }}
      </UiAlert>
    </div>
  </main>
</template>
