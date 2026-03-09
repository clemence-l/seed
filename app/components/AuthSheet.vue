<script setup lang="ts">
import { ref } from "vue";

const auth = useAuth();
const messages = useMessages();

const step = ref<"email" | "password">("email");
const isOpen = ref(false);
const loading = ref(false);

const email = ref("");
const password = ref("");
const passwordConfirm = ref("");
const isExisting = ref(false);
const userProvider = ref<string | null>(null);
const checked = ref(false);

function open() {
  step.value = "email";
  isOpen.value = true;
  email.value = "";
  password.value = "";
  passwordConfirm.value = "";
  isExisting.value = false;
  userProvider.value = null;
  checked.value = false;
}

function close() {
  isOpen.value = false;
  step.value = "email";
  email.value = "";
  password.value = "";
  passwordConfirm.value = "";
  isExisting.value = false;
  userProvider.value = null;
  checked.value = false;
}

function goBack() {
  step.value = "email";
  password.value = "";
  passwordConfirm.value = "";
}

async function handleEmailSubmit() {
  if (!email.value.trim()) {
    messages.setError("L'email est requis");
    return;
  }

  loading.value = true;
  messages.clearAll();

  try {
    // Vérifier si l'email existe via RPC
    const supabase = useNuxtApp().$supabase;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("check_email_exists", {
      email_param: email.value,
    });

    if (error) {
      console.error("Erreur lors de la vérification:", error);
      messages.setError("Erreur lors de la vérification de l'email");
      return;
    }

    // data retourne {exists: boolean, provider: string | null}
    isExisting.value = data.exists === true;
    userProvider.value = data.provider || null;

    // Si compte existant avec provider OAuth, afficher alerte native du système
    if (isExisting.value && userProvider.value) {
      window.alert(`Cette adresse email est déjà associée à un compte ${userProvider.value}.\n\nConnecte-toi via ${userProvider.value} pour accéder à ton compte.`);
      email.value = "";
    } else {
      step.value = "password";
    }
  } catch (e) {
    console.error("Exception:", e);
    messages.setError("Une erreur est survenue");
  } finally {
    loading.value = false;
  }
}

async function handlePasswordSubmit() {
  // Vérifier que confirm password match seulement pour les nouveaux users
  if (!isExisting.value && password.value !== passwordConfirm.value) {
    messages.setError("Les mots de passe ne correspondent pas");
    return;
  }

  loading.value = true;
  messages.clearAll();

  try {
    // Essayer d'abord de se connecter
    let result = await auth.signIn(email.value, password.value);

    if (result.success) {
      // Connexion réussie - c'est un user existant
      isExisting.value = true;
      messages.setSuccess("Connecté avec succès !");
      close();
      return;
    }

    // Si signIn échoue, essayer de créer un compte
    result = await auth.signUp(email.value, password.value);
    if (result.success) {
      // Inscription réussie - c'est un nouvel utilisateur
      isExisting.value = false;
      messages.setSuccess("Compte créé avec succès !");
      close();
      return;
    }

    // Si les deux échouent, afficher l'erreur
    messages.setError(result.error ?? "Erreur d'authentification");
  } catch (e) {
    messages.setError("Une erreur est survenue");
    console.error(e);
  } finally {
    loading.value = false;
  }
}

defineExpose({ open, close });
</script>

<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 bg-black/50 z-50" @click="close" />
  </Transition>

  <!-- Sheet -->
  <Transition name="slide-up">
    <div
      v-if="isOpen"
      style="height: 96vh; z-index: 51"
      class="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-lg flex flex-col"
    >
      <!-- Header -->
      <div class="p-3 flex items-center justify-between">
        <button
          class="text-dark-500/40"
          :aria-label="step === 'password' ? 'Retour' : 'Fermer'"
          @click="step === 'password' ? goBack() : close()"
        >
          {{ step === "password" ? "←" : "✕" }}
        </button>
        <h2 class="text-base font-light uppercase text-dark-500">Seed</h2>
        <div class="w-6" />
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 flex flex-col">
        <h2 class="text-center mb-2 font-medium">
          Connectez-vous ou créez un compte
        </h2>
        <!-- Step 1: Email -->
        <template v-if="step === 'email'">
          <form class="space-y-3" @submit.prevent="handleEmailSubmit">
            <UiFormInput
              v-model="email"
              label="Email"
              type="email"
              placeholder="exemple@exemple.com"
              :disabled="loading"
            />

            <UiButton type="submit" size="sm" full-width :disabled="loading">
              {{ loading ? "Vérification..." : "Continuer avec l'email" }}
            </UiButton>
          </form>

          <!-- Divider -->
          <div class="flex items-center gap-3 my-6">
            <div class="flex-1 h-px bg-dark-500/20" />
            <span class="text-xs text-dark-500/60">ou</span>
            <div class="flex-1 h-px bg-dark-500/20" />
          </div>

          <!-- OAuth buttons -->
          <div class="space-y-2">
            <UiButton
              variant="outline"
              full-width
              @click="
                () => {
                  /* TODO: Google OAuth */
                }
              "
            >
              <NuxtImg
                src="/img/google.png"
                alt="Google"
                class="w-4 h-4 object-contain"
              />
              Continuer avec Google
            </UiButton>
            <UiButton
              variant="outline"
              full-width
              @click="
                () => {
                  /* TODO: Apple OAuth */
                }
              "
            >
              <NuxtImg
                src="/img/apple.png"
                alt="Apple"
                class="w-4 h-4 object-contain"
              />
              Continuer avec Apple
            </UiButton>
            <UiButton
              variant="outline"
              full-width
              @click="
                () => {
                  /* TODO: LinkedIn OAuth */
                }
              "
            >
              <NuxtImg
                src="/img/linkedin.png"
                alt="LinkedIn"
                class="w-4 h-4 object-contain"
              />
              Continuer avec LinkedIn
            </UiButton>
          </div>
        </template>

        <!-- Step 2: Password -->
        <template v-else-if="step === 'password' && !showOAuthAlert">
          <!-- Message pour les comptes existants -->
          <p v-if="isExisting" class="mb-4 text-sm text-dark-500">
            Connecte-toi avec ton mot de passe
          </p>

          <!-- Message pour les nouveaux comptes -->
          <p v-else class="mb-4 text-sm text-dark-500">
            Crée un mot de passe pour ton compte
          </p>

          <form class="space-y-3" @submit.prevent="handlePasswordSubmit">
            <div>
              <UiFormInput
                v-model="password"
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
                :disabled="loading"
              />
            </div>

            <div v-if="!isExisting">
              <UiFormInput
                v-model="passwordConfirm"
                label="Confirmer le mot de passe"
                type="password"
                placeholder="••••••••"
                :disabled="loading"
              />
            </div>

            <UiButton type="submit" size="sm" full-width :disabled="loading">
              {{
                loading
                  ? "Chargement..."
                  : isExisting
                    ? "Se connecter"
                    : "Créer un compte"
              }}
            </UiButton>
          </form>
        </template>
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
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
