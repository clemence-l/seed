export default defineNuxtPlugin(async () => {
  const auth = useAuth();
  console.debug("[plugin] auth-init: starting initAuth");
  await auth.initAuth();
  console.debug(
    "[plugin] auth-init: initAuth complete, ready=",
    auth.ready?.value,
  );
});
