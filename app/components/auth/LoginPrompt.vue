<template>
  <div class="login-prompt">
    <div class="login-prompt__icon">
      <UiIcon name="alert-circle" />
    </div>
    <div class="login-prompt__content">
      <p class="login-prompt__text">
        {{ message }}
      </p>
      <NuxtLink :to="loginUrl" class="login-prompt__button">
        Se connecter
      </NuxtLink>
    </div>
    <button
      v-if="dismissible"
      class="login-prompt__close"
      @click="$emit('dismiss')"
      aria-label="Fermer"
    >
      <UiIcon name="x" />
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string;
  returnUrl?: string;
  dismissible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  message: "Connecte-toi pour sauvegarder ta progression !",
  returnUrl: "",
  dismissible: true,
});

defineEmits<{
  dismiss: [];
}>();

const route = useRoute();

const loginUrl = computed(() => {
  const redirect = props.returnUrl || route.fullPath;
  return `/auth/login?redirect=${encodeURIComponent(redirect)}`;
});
</script>

<style scoped>
.login-prompt {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.login-prompt__icon {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
}

.login-prompt__content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.login-prompt__text {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
}

.login-prompt__button {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  text-decoration: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.login-prompt__button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.login-prompt__close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.login-prompt__close:hover {
  opacity: 1;
}

@media (max-width: 640px) {
  .login-prompt {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .login-prompt__content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    width: 100%;
  }

  .login-prompt__button {
    width: 100%;
    justify-content: center;
  }

  .login-prompt__close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
  }
}
</style>
