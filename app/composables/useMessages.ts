/**
 * Composable pour gérer les messages temporaires (toast-like)
 */

export function useMessages() {
  const error = ref<string | null>(null);
  const success = ref<string | null>(null);
  const info = ref<string | null>(null);

  let errorTimeout: ReturnType<typeof setTimeout> | null = null;
  let successTimeout: ReturnType<typeof setTimeout> | null = null;
  let infoTimeout: ReturnType<typeof setTimeout> | null = null;

  function clearAll() {
    error.value = null;
    success.value = null;
    info.value = null;
    if (errorTimeout) clearTimeout(errorTimeout);
    if (successTimeout) clearTimeout(successTimeout);
    if (infoTimeout) clearTimeout(infoTimeout);
  }

  function setError(message: string, autoClear = 5000) {
    error.value = message;
    if (errorTimeout) clearTimeout(errorTimeout);
    if (autoClear > 0) {
      errorTimeout = setTimeout(() => {
        error.value = null;
      }, autoClear);
    }
  }

  function setSuccess(message: string, autoClear = 5000) {
    success.value = message;
    if (successTimeout) clearTimeout(successTimeout);
    if (autoClear > 0) {
      successTimeout = setTimeout(() => {
        success.value = null;
      }, autoClear);
    }
  }

  function setInfo(message: string, autoClear = 5000) {
    info.value = message;
    if (infoTimeout) clearTimeout(infoTimeout);
    if (autoClear > 0) {
      infoTimeout = setTimeout(() => {
        info.value = null;
      }, autoClear);
    }
  }

  return {
    error: readonly(error),
    success: readonly(success),
    info: readonly(info),
    setError,
    setSuccess,
    setInfo,
    clearAll,
  };
}
