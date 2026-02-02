export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn } = useAuth();

  // Si on va sur /profile et pas connecté -> redirect login
  if (to.path === "/profile" && !isLoggedIn.value) {
    return navigateTo("/auth/login");
  }

  // Si on va sur /auth/login et déjà connecté -> redirect profile
  if (to.path === "/auth/login" && isLoggedIn.value) {
    return navigateTo("/profile");
  }
});
