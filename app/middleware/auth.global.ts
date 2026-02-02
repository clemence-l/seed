export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith("/auth")) return;
  if (to.path.startsWith("/games")) return;

  // Pour les autres pages protégées (ex: /profile), vérifier la connexion
  const auth = useAuth();

  // Si le module d'auth n'est pas encore prêt (restauration de session en cours),
  // attendre un court laps de temps avant de décider de rediriger.
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
      );

      // timeout safety (3s)
      setTimeout(() => {
        if (typeof stop === "function") stop();
        resolve();
      }, 3000);
    });
  }

  // Rediriger vers login uniquement pour les pages protégées
  if (to.path === "/profile" && !auth.isLoggedIn.value) {
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }
});
