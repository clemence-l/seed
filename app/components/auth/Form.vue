<script setup lang="ts">
import UiInput from "../ui/Input.vue";
import UiAlert from "../ui/Alert.vue";

interface Props {
  mode: "login" | "register";
}

const props = defineProps<Props>();

const router = useRouter();
const auth = useAuth();

const email = ref("");
const password = ref("");
const displayName = ref("");
const errorMsg = ref<string | null>(null);
const successMsg = ref<string | null>(null);

const isLogin = computed(() => props.mode === "login");

async function handleSubmit(): Promise<void> {
  errorMsg.value = null;
  successMsg.value = null;

  if (isLogin.value) {
    const result = await auth.signIn(email.value, password.value);
    if (result.success) {
      await router.push("/profile");
    } else {
      errorMsg.value = result.error ?? "Erreur de connexion";
    }
  } else {
    const result = await auth.signUp(
      email.value,
      password.value,
      displayName.value || undefined,
    );
    if (result.success) {
      if (result.needsConfirmation) {
        successMsg.value = "Vérifiez votre email pour confirmer votre compte";
      } else {
        await router.push("/");
      }
    } else {
      errorMsg.value = result.error ?? "Erreur d'inscription";
    }
  }
}
</script>

<template>
  <div class="flex flex-col gap-24">
    <!-- Onglets -->
    <nav class="flex border-b border-dark-500/10 shrink-0">
      <NuxtLink
        to="/auth/login"
        class="flex-1 py-3.5 px-4 text-center text-sm font-medium text-dark-500/50 border-b-2 border-transparent -mb-px transition-all hover:text-dark-500/80"
        :class="{ 'text-dark-500! border-dark-500!': isLogin }"
      >
        Connexion
      </NuxtLink>
      <NuxtLink
        to="/auth/register"
        class="flex-1 py-3.5 px-4 text-center text-sm font-medium text-dark-500/50 border-b-2 border-transparent -mb-px transition-all hover:text-dark-500/80"
        :class="{ 'text-dark-500! border-dark-500!': !isLogin }"
      >
        Créer un compte
      </NuxtLink>
    </nav>

    <!-- Formulaire centré -->
    <div class="flex-1 flex justify-center py-0">
      <div class="w-full max-w-sm px-6">
        <!-- Title -->
        <h1 class="text-3xl font-medium mb-2 text-center">
          {{ isLogin ? "Bon retour !" : "Rejoins Seed" }}
        </h1>
        <p class="text-sm text-dark-500/60 mb-12 text-center">
          {{
            isLogin
              ? "Connecte-toi pour sauvegarder ta progression"
              : "Crée ton compte et commence à jouer"
          }}
        </p>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <!-- Display Name (register only) -->
          <UiInput
            v-if="!isLogin"
            v-model="displayName"
            type="text"
            label="Pseudo"
            placeholder="TonPseudo"
            autocomplete="nickname"
          />

          <!-- Email -->
          <UiInput
            v-model="email"
            type="email"
            label="Email"
            placeholder="toi@mail.com"
            autocomplete="email"
            required
          />

          <!-- Password -->
          <UiInput
            v-model="password"
            type="password"
            label="Mot de passe"
            placeholder="••••••••"
            :autocomplete="isLogin ? 'current-password' : 'new-password'"
            required
          />

          <!-- Messages -->
          <UiAlert v-if="errorMsg" type="error">
            {{ errorMsg }}
          </UiAlert>
          <UiAlert v-if="successMsg" type="success">
            {{ successMsg }}
          </UiAlert>

          <!-- Submit -->
          <UiButton
            type="submit"
            variant="primary"
            size="lg"
            class="w-full"
            :disabled="auth.loading.value"
          >
            {{
              auth.loading.value
                ? "Chargement…"
                : isLogin
                  ? "Se connecter"
                  : "Créer mon compte"
            }}
          </UiButton>
        </form>
      </div>
    </div>
  </div>
</template>
