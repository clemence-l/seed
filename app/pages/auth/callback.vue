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

const error = ref<string | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    // Vérifier s'il y a une erreur dans l'URL
    if (route.query.error) {
      error.value =
        (route.query.error_description as string) ||
        "Erreur d'authentification";
      loading.value = false;
      return;
    }

    // Attendre que Supabase détecte et établisse la session
    // Le plugin Supabase a detectSessionInUrl: true donc il gère automatiquement
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Recharger la session pour s'assurer qu'elle est à jour
    await auth.fetchSession();

    if (auth.isLoggedIn.value) {
      // Succès : rediriger vers le profil ou la page demandée
      const redirect = (route.query.redirect as string) || "/profile";
      await router.push(redirect);
    } else {
      error.value = "La session n'a pas pu être établie. Veuillez réessayer.";
      loading.value = false;
    }
  } catch (e) {
    console.error("[Callback] Error:", e);
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
        <UiSpinner class="mx-auto w-12 h-12 text-purple-500" />
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
