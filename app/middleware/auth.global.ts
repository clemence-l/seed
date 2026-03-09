export default defineNuxtRouteMiddleware(async (to) => {
  // Auth is client-only (session stored in localStorage) — skip during SSR
  if (import.meta.server) return;

  if (to.path.startsWith("/auth")) return;
  if (to.path.startsWith("/games")) return;
  if (to.path.startsWith("/legal")) return;

  const auth = useAuth();

  // Attendre que l'auth soit prête (le plugin client devrait déjà l'avoir fait)
  if (!auth.ready.value) {
    await new Promise<void>((resolve) => {
      const stop = watch(
        () => auth.ready.value,
        (v) => {
          if (v) {
            stop();
            resolve();
          }
        },
        { immediate: true },
      );

      // timeout safety (5s)
      setTimeout(() => {
        if (typeof stop === "function") stop();
        resolve();
      }, 5000);
    });
  }

  // /profile est accessible avec ou sans connexion
  // La page profile gère l'affichage conditionnel elle-même
});
