<script setup lang="ts">
/**
 * Page de callback OAuth
 * Gère le retour après authentification via Google, LinkedIn, Apple, etc.
 */

definePageMeta({
  layout: "minimal",
});

useHead({ title: "Seed | Connexion..." });

const router = useRouter();
const route = useRoute();
const auth = useAuth();
const { $supabase } = useNuxtApp();

const error = ref<string | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    // Vérifier s'il y a une erreur dans l'URL (query params)
    if (route.query.error) {
      error.value =
        (route.query.error_description as string) ||
        "Erreur d'authentification";
      loading.value = false;
      return;
    }

    // Vérifier aussi l'erreur dans le hash fragment
    const hash = window.location.hash;
    if (hash.includes("error=")) {
      const params = new URLSearchParams(hash.substring(1));
      error.value =
        params.get("error_description") || "Erreur d'authentification";
      loading.value = false;
      return;
    }

    // Si le hash contient access_token, Supabase doit le traiter
    // On appelle getSession() qui va automatiquement parser le hash
    const { data, error: sessionError } = await $supabase.auth.getSession();

    if (sessionError) {
      error.value = sessionError.message;
      loading.value = false;
      return;
    }

    if (data.session) {
      // Session établie, mettre à jour l'état auth
      await auth.fetchSession();
      // Succès : rediriger vers le profil ou la page demandée
      const redirect = (route.query.redirect as string) || "/profile";
      await router.push(redirect);
    } else {
      // Pas de session immédiate, attendre un peu et réessayer
      await new Promise((resolve) => setTimeout(resolve, 500));
      const { data: retryData } = await $supabase.auth.getSession();

      if (retryData.session) {
        await auth.fetchSession();
        const redirect = (route.query.redirect as string) || "/profile";
        await router.push(redirect);
      } else {
        error.value = "La session n'a pas pu être établie. Veuillez réessayer.";
        loading.value = false;
      }
    }
  } catch (e) {
    error.value =
      e instanceof Error ? e.message : "Erreur lors de l'authentification";
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <!-- Loading state -->
      <div v-if="loading" class="space-y-4">
        <UiSpinner size="xl" class="mx-auto" />
        <h1 class="text-2xl font-medium text-dark-500">
          Connexion en cours...
        </h1>
        <p class="text-sm text-dark-500/60">
          Veuillez patienter pendant que nous établissons votre session
        </p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="space-y-6">
        <div
          class="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center"
        >
          <svg
            class="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <div>
          <h1 class="text-2xl font-medium text-dark-500 mb-2">
            Erreur d'authentification
          </h1>
          <p class="text-sm text-dark-500/70 mb-6">
            {{ error }}
          </p>
        </div>

        <UiButton variant="primary" @click="router.push('/auth/login')">
          Retour à la connexion
        </UiButton>
      </div>
    </div>
  </div>
</template>
