<script setup lang="ts">
import type { TypedSupabaseClient } from "../../types/supabase";

const router = useRouter();
const auth = useAuth();
const progress = useProgress();

// Edit states
const editingUsername = ref(false);
const editingEmail = ref(false);
const editingPassword = ref(false);

// Form values
const newUsername = ref("");
const newEmail = ref("");
const newPassword = ref("");
const confirmPassword = ref("");

// Messages
const updateError = ref<string | null>(null);
const updateSuccess = ref<string | null>(null);
const pendingEmail = ref<string | null>(null);

// Avatar
const avatarInput = ref<HTMLInputElement | null>(null);
const uploadingAvatar = ref(false);

// Stats
const streak = ref(0);
const totalWins = ref(0);
const loading = ref(true);

// Local display name for optimistic updates
const localDisplayName = ref<string | null>(null);

const displayName = computed(
  () => localDisplayName.value || auth.displayName.value || "Joueur",
);

useHead(() => ({
  title: `Seed | ${displayName.value}`,
}));

function getPlantBorderClasses(s: number): string {
  if (s === 0) return "from-amber-700 to-amber-900";
  if (s <= 3) return "from-lime-400 to-green-500";
  if (s <= 7) return "from-green-500 to-emerald-600";
  if (s <= 14) return "from-emerald-500 to-teal-600";
  if (s <= 30) return "from-teal-500 to-green-600";
  return "from-green-500 to-teal-500";
}

function getPlantStage(s: number): string {
  if (s === 0) return "Graine";
  if (s <= 3) return "Pousse";
  if (s <= 7) return "Jeune plante";
  if (s <= 14) return "Plante";
  if (s <= 30) return "Plante florissante";
  return "Arbre majestueux";
}

function getStageBadgeClasses(s: number): string {
  if (s === 0) return "bg-amber-100 text-amber-800";
  if (s <= 3) return "bg-lime-100 text-lime-800";
  if (s <= 7) return "bg-green-100 text-green-800";
  if (s <= 14) return "bg-emerald-100 text-emerald-800";
  if (s <= 30) return "bg-teal-100 text-teal-800";
  return "bg-green-100 text-green-800";
}

onMounted(async () => {
  await auth.initAuth();
  if (!auth.isLoggedIn.value) {
    await router.push("/auth/login");
    return;
  }
  try {
    const plantState = await progress.getPlantState();
    streak.value = plantState.streak;
    const user = auth.user.value;
    if (user) {
      const nuxtApp = useNuxtApp();
      const supabase = nuxtApp.$supabase as TypedSupabaseClient;
      const { count } = await supabase
        .from("plays")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("success", true);
      totalWins.value = count ?? 0;
    }
  } catch (e) {
    console.error("Erreur chargement stats:", e);
  } finally {
    loading.value = false;
  }
});

async function handleLogout() {
  console.log("[profile] handleLogout called");
  try {
    await auth.signOut();
    await router.push("/");
  } catch (e) {
    console.error("[profile] handleLogout error", e);
  }
}

function clearMessages() {
  updateError.value = null;
  updateSuccess.value = null;
}

function startEditUsername() {
  newUsername.value = auth.displayName.value ?? "";
  editingUsername.value = true;
  clearMessages();
}

async function saveUsername() {
  console.log("[profile] saveUsername called", newUsername.value);
  clearMessages();

  const savedName = newUsername.value;

  // Mise à jour optimiste : afficher le nouveau pseudo immédiatement
  localDisplayName.value = savedName;
  editingUsername.value = false;

  // Lancer la mise à jour en arrière-plan
  auth
    .updateDisplayName(savedName)
    .then((result) => {
      console.log("[profile] saveUsername result", result);
      if (result.success) {
        updateSuccess.value = "Pseudo mis à jour";
      } else {
        // En cas d'erreur, rouvrir l'input et restaurer l'ancien pseudo
        localDisplayName.value = null;
        newUsername.value = savedName;
        editingUsername.value = true;
        updateError.value = result.error ?? "Erreur de mise à jour";
      }
    })
    .catch((e) => {
      console.error("[profile] saveUsername error", e);
      localDisplayName.value = null;
      newUsername.value = savedName;
      editingUsername.value = true;
      updateError.value = "Erreur interne";
    });
}

function cancelEditUsername() {
  editingUsername.value = false;
  clearMessages();
}

function startEditEmail() {
  // If a pending confirmation exists, prefill with it so the user can re-send or confirm
  newEmail.value = pendingEmail.value ?? auth.user.value?.email ?? "";
  editingEmail.value = true;
  clearMessages();
}

async function saveEmail() {
  console.log("[profile] saveEmail called", newEmail.value);
  clearMessages();

  const savedEmail = newEmail.value;

  // Mise à jour optimiste : fermer l'input et stocker l'email en attente
  pendingEmail.value = savedEmail;
  editingEmail.value = false;

  // Lancer la mise à jour en arrière-plan
  auth
    .updateEmail(savedEmail)
    .then((result) => {
      console.log("[profile] saveEmail result", result);
      if (!result.success) {
        // En cas d'erreur, rouvrir l'input
        pendingEmail.value = null;
        newEmail.value = savedEmail;
        editingEmail.value = true;
        updateError.value = result.error ?? "Erreur de mise à jour";
      }
    })
    .catch((e) => {
      console.error("[profile] saveEmail error", e);
      pendingEmail.value = null;
      newEmail.value = savedEmail;
      editingEmail.value = true;
      updateError.value = "Erreur interne";
    });
}

function cancelEditEmail() {
  editingEmail.value = false;
  clearMessages();
}

function startEditPassword() {
  newPassword.value = "";
  confirmPassword.value = "";
  editingPassword.value = true;
  clearMessages();
}

async function savePassword() {
  console.log("[profile] savePassword called");
  clearMessages();

  if (newPassword.value !== confirmPassword.value) {
    updateError.value = "Les mots de passe ne correspondent pas";
    return;
  }

  const savedPassword = newPassword.value;

  // Fermer l'input immédiatement
  editingPassword.value = false;
  newPassword.value = "";
  confirmPassword.value = "";

  // Lancer la mise à jour en arrière-plan
  auth
    .updatePassword(savedPassword)
    .then((result) => {
      console.log("[profile] savePassword result", result);
      if (result.success) {
        updateSuccess.value = "Mot de passe mis à jour";
      } else {
        editingPassword.value = true;
        updateError.value = result.error ?? "Erreur de mise à jour";
      }
    })
    .catch((e) => {
      console.error("[profile] savePassword error", e);
      editingPassword.value = true;
      updateError.value = "Erreur interne";
    });
}

function cancelEditPassword() {
  editingPassword.value = false;
  clearMessages();
}

function triggerAvatarUpload() {
  console.log("[profile] triggerAvatarUpload called");
  avatarInput.value?.click();
}

async function handleAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    updateError.value = "Le fichier doit être une image";
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    updateError.value = "L'image ne doit pas dépasser 2MB";
    return;
  }
  uploadingAvatar.value = true;
  clearMessages();
  const result = await auth.updateAvatar(file);
  uploadingAvatar.value = false;
  if (result.success) {
    updateSuccess.value = "Photo de profil mise à jour";
  } else {
    updateError.value = result.error ?? "Erreur lors de l'upload";
  }
  target.value = "";
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
</script>

<template>
  <main
    class="min-h-dvh bg-light-500 text-dark-500 px-4 py-8 pt-16 md:px-8 rounded-b-3xl flex items-center"
  >
    <div class="max-w-5xl mx-auto">
      <div
        v-if="updateSuccess"
        class="mb-4 p-4 rounded-xl bg-green-100 text-green-800 text-sm"
      >
        {{ updateSuccess }}
      </div>
      <div
        v-if="updateError"
        class="mb-4 p-4 rounded-xl bg-red-100 text-red-800 text-sm"
      >
        {{ updateError }}
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <div
          class="w-8 h-8 border-2 border-dark-500 border-t-transparent rounded-full animate-spin"
        />
      </div>

      <template v-else-if="auth.user.value">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-4">
            <div
              class="rounded-2xl border border-dark-500/10 bg-white p-8 flex flex-col items-center text-center shadow-sm"
            >
              <div class="relative mb-6">
                <button
                  type="button"
                  class="group relative cursor-pointer"
                  :disabled="uploadingAvatar"
                  @click="triggerAvatarUpload"
                >
                  <div
                    class="w-40 h-40 rounded-full p-1 bg-linear-to-br"
                    :class="getPlantBorderClasses(streak)"
                  >
                    <div
                      class="w-full h-full rounded-full bg-light-500 flex items-center justify-center overflow-hidden"
                    >
                      <img
                        v-if="auth.profile.value?.avatar_url"
                        :src="auth.profile.value.avatar_url"
                        alt="Avatar"
                        class="w-full h-full object-cover"
                      />
                      <NuxtImg
                        v-else
                        src="/img/profile.svg"
                        alt="Avatar par défaut"
                        class="w-11/12 h-11/12 object-contain"
                      />
                    </div>
                  </div>
                  <div
                    class="absolute inset-0 rounded-full bg-dark-500/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <svg
                      v-if="!uploadingAvatar"
                      class="w-8 h-8 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <div
                      v-else
                      class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"
                    />
                  </div>
                </button>
                <input
                  ref="avatarInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleAvatarChange"
                />
                <div
                  class="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                  :class="getStageBadgeClasses(streak)"
                >
                  {{ getPlantStage(streak) }}
                </div>
              </div>

              <h2 class="text-2xl font-bold text-dark-500 mb-1">
                {{ displayName }}
              </h2>
              <p class="text-sm text-dark-500/60 mb-6">Joueur Seed</p>

              <div class="w-full grid grid-cols-2 gap-3">
                <div
                  class="rounded-xl bg-dark-500/5 border border-dark-500/10 p-4 text-center"
                >
                  <p class="text-2xl font-bold text-dark-500">{{ streak }}</p>
                  <p class="text-xs text-dark-500/50">Jours de streak</p>
                </div>
                <div
                  class="rounded-xl bg-dark-500/5 border border-dark-500/10 p-4 text-center"
                >
                  <p class="text-2xl font-bold text-dark-500">
                    {{ totalWins }}
                  </p>
                  <p class="text-xs text-dark-500/50">Niveaux réussis</p>
                </div>
              </div>

              <NuxtLink
                to="/progress"
                class="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-dark-500 text-light-500 font-semibold hover:bg-dark-500/90 transition-all"
              >
                Voir ma plante
                <svg
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </NuxtLink>
            </div>
          </div>

          <div class="lg:col-span-8 space-y-6">
            <div
              class="rounded-2xl border border-dark-500/10 bg-white p-6 shadow-sm"
            >
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-dark-500">
                  Informations du compte
                </h3>
                <div
                  class="w-2 h-2 rounded-full bg-green-500"
                  title="Connecté"
                />
              </div>

              <div class="space-y-6">
                <div class="pb-6 border-b border-dark-500/10">
                  <p
                    class="text-xs text-dark-500/40 uppercase tracking-wider mb-1"
                  >
                    Email
                  </p>
                  <template v-if="editingEmail">
                    <div class="flex items-center gap-2">
                      <input
                        v-model="newEmail"
                        type="email"
                        class="flex-1 rounded-lg border border-dark-500/20 bg-light-500 px-3 py-2 text-dark-500 outline-none focus:border-dark-500 focus:ring-1 focus:ring-dark-500"
                        placeholder="nouveau@email.com"
                      />
                      <button
                        type="button"
                        class="w-8 h-8 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors cursor-pointer"
                        @click="saveEmail"
                      >
                        <svg
                          class="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            d="M5 13l4 4L19 7"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors cursor-pointer"
                        @click="cancelEditEmail"
                      >
                        <svg
                          class="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            d="M6 18L18 6M6 6l12 12"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </template>
                  <template v-else>
                    <div class="flex items-center justify-between">
                      <p class="text-dark-500">{{ auth.user.value?.email }}</p>
                      <button
                        type="button"
                        class="text-dark-500/50 hover:text-dark-500 transition-colors cursor-pointer"
                        @click="startEditEmail"
                      >
                        <svg
                          class="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <p
                      v-if="
                        pendingEmail && pendingEmail !== auth.user.value?.email
                      "
                      class="mt-2 text-xs text-green-600"
                    >
                      Un email de confirmation a été envoyé à
                      {{ pendingEmail }}.
                    </p>
                  </template>
                </div>

                <div class="pb-6 border-b border-dark-500/10">
                  <p
                    class="text-xs text-dark-500/40 uppercase tracking-wider mb-1"
                  >
                    Pseudo
                  </p>
                  <template v-if="editingUsername">
                    <div class="flex items-center gap-2">
                      <input
                        v-model="newUsername"
                        type="text"
                        class="flex-1 rounded-lg border border-dark-500/20 bg-light-500 px-3 py-2 text-dark-500 outline-none focus:border-dark-500 focus:ring-1 focus:ring-dark-500"
                        placeholder="TonPseudo"
                      />
                      <button
                        type="button"
                        class="w-8 h-8 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors cursor-pointer"
                        @click="saveUsername"
                      >
                        <svg
                          class="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            d="M5 13l4 4L19 7"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors cursor-pointer"
                        @click="cancelEditUsername"
                      >
                        <svg
                          class="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            d="M6 18L18 6M6 6l12 12"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </template>
                  <template v-else>
                    <div class="flex items-center justify-between">
                      <p class="text-dark-500">{{ displayName }}</p>
                      <button
                        type="button"
                        class="text-dark-500/50 hover:text-dark-500 transition-colors cursor-pointer"
                        @click="startEditUsername"
                      >
                        <svg
                          class="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </template>
                </div>

                <div class="pb-6 border-b border-dark-500/10">
                  <p
                    class="text-xs text-dark-500/40 uppercase tracking-wider mb-1"
                  >
                    Mot de passe
                  </p>
                  <template v-if="editingPassword">
                    <div class="space-y-2">
                      <input
                        v-model="newPassword"
                        type="password"
                        class="w-full rounded-lg border border-dark-500/20 bg-light-500 px-3 py-2 text-dark-500 outline-none focus:border-dark-500 focus:ring-1 focus:ring-dark-500"
                        placeholder="Nouveau mot de passe"
                      />
                      <input
                        v-model="confirmPassword"
                        type="password"
                        class="w-full rounded-lg border border-dark-500/20 bg-light-500 px-3 py-2 text-dark-500 outline-none focus:border-dark-500 focus:ring-1 focus:ring-dark-500"
                        placeholder="Confirmer le mot de passe"
                      />
                      <div class="flex items-center gap-2">
                        <UiButton
                          variant="success"
                          size="md"
                          class="flex-1"
                          @click="savePassword"
                          >Enregistrer</UiButton
                        >
                        <UiButton
                          variant="danger"
                          size="md"
                          class="flex-1"
                          @click="cancelEditPassword"
                          >Annuler</UiButton
                        >
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="flex items-center justify-between">
                      <p class="text-dark-500">••••••••</p>
                      <button
                        type="button"
                        class="text-dark-500/50 hover:text-dark-500 transition-colors cursor-pointer"
                        @click="startEditPassword"
                      >
                        <svg
                          class="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </template>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p
                      class="text-xs text-dark-500/40 uppercase tracking-wider mb-1"
                    >
                      Statut
                    </p>
                    <span
                      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-dark-500/5 text-dark-500 text-sm font-medium"
                    >
                      <svg
                        class="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                        />
                      </svg>
                      {{
                        auth.profile.value?.role === "admin"
                          ? "Administrateur"
                          : "Joueur"
                      }}
                    </span>
                  </div>
                  <div>
                    <p
                      class="text-xs text-dark-500/40 uppercase tracking-wider mb-1"
                    >
                      Membre depuis
                    </p>
                    <p class="text-dark-500">
                      {{ formatDate(auth.profile.value?.created_at) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

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

      <div
        v-else-if="auth.error.value"
        class="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
      >
        <p class="text-red-500">{{ auth.error.value }}</p>
      </div>
    </div>
  </main>
</template>
