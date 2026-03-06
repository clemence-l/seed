<script setup lang="ts">
/**
 * Composant ProfileAccountInfo - Informations du compte éditables
 */
import UiIcon from "../ui/Icon.vue";
import UiButton from "../UiButton.vue";

const props = defineProps<{
  email: string;
  displayName: string;
  role?: string;
  createdAt?: string | null;
  pendingEmail?: string | null;
}>();

const emit = defineEmits<{
  "save-email": [value: string];
  "save-username": [value: string];
  "save-password": [password: string];
}>();

const editingEmail = ref(false);
const editingUsername = ref(false);
const editingPassword = ref(false);

const newEmail = ref(props.email);
const newUsername = ref(props.displayName);
const newPassword = ref("");
const confirmPassword = ref("");
const passwordError = ref<string | null>(null);

const { formatDate } = useDateFormat();

watch(
  () => props.email,
  (val) => {
    newEmail.value = val;
  },
);
watch(
  () => props.displayName,
  (val) => {
    newUsername.value = val;
  },
);

function startEditEmail() {
  newEmail.value = props.pendingEmail ?? props.email;
  editingEmail.value = true;
}
function saveEmail() {
  emit("save-email", newEmail.value);
  editingEmail.value = false;
}
function cancelEmail() {
  newEmail.value = props.email;
  editingEmail.value = false;
}

function startEditUsername() {
  newUsername.value = props.displayName;
  editingUsername.value = true;
}
function saveUsername() {
  emit("save-username", newUsername.value);
  editingUsername.value = false;
}
function cancelUsername() {
  newUsername.value = props.displayName;
  editingUsername.value = false;
}

function startEditPassword() {
  newPassword.value = "";
  confirmPassword.value = "";
  passwordError.value = null;
  editingPassword.value = true;
}
function savePassword() {
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = "Les mots de passe ne correspondent pas";
    return;
  }
  emit("save-password", newPassword.value);
  editingPassword.value = false;
  newPassword.value = "";
  confirmPassword.value = "";
}
function cancelPassword() {
  editingPassword.value = false;
  newPassword.value = "";
  confirmPassword.value = "";
  passwordError.value = null;
}
</script>

<template>
  <div class=" border border-dark-500/10 bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-dark-500">
        Informations du compte
      </h3>
      <div class="w-2 h-2 bg-green-500" title="Connecté" />
    </div>

    <div class="space-y-6">
      <!-- Email -->
      <div class="pb-6 border-b border-dark-500/10">
        <p class="text-xs text-dark-500/40 uppercase tracking-wider mb-1">
          Email
        </p>
        <template v-if="editingEmail">
          <div class="flex items-center gap-2">
            <input
              v-model="newEmail"
              type="email"
              class="flex-1 border border-dark-500/20 bg-light-500 px-3 py-2 text-dark-500 outline-none focus:border-dark-500 focus:ring-1 focus:ring-dark-500"
              placeholder="nouveau@email.com"
              @keyup.enter="saveEmail"
              @keyup.escape="cancelEmail"
            >
            <button
              type="button"
              class="w-8 h-8 bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors cursor-pointer"
              @click="saveEmail"
            >
              <UiIcon name="check" class="w-4 h-4" />
            </button>
            <button
              type="button"
              class="w-8 h-8 bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors cursor-pointer"
              @click="cancelEmail"
            >
              <UiIcon name="close" class="w-4 h-4" />
            </button>
          </div>
        </template>
        <template v-else>
          <div class="flex items-center justify-between">
            <p class="text-dark-500">{{ email }}</p>
            <button
              type="button"
              class="text-dark-500/50 hover:text-dark-500 transition-colors cursor-pointer"
              @click="startEditEmail"
            >
              <UiIcon name="edit" class="w-4 h-4" />
            </button>
          </div>
          <p
            v-if="pendingEmail && pendingEmail !== email"
            class="mt-2 text-xs text-green-600"
          >
            Un email de confirmation a été envoyé à {{ pendingEmail }}.
          </p>
        </template>
      </div>

      <!-- Pseudo -->
      <div class="pb-6 border-b border-dark-500/10">
        <p class="text-xs text-dark-500/40 uppercase tracking-wider mb-1">
          Pseudo
        </p>
        <template v-if="editingUsername">
          <div class="flex items-center gap-2">
            <input
              v-model="newUsername"
              type="text"
              class="flex-1 border border-dark-500/20 bg-light-500 px-3 py-2 text-dark-500 outline-none focus:border-dark-500 focus:ring-1 focus:ring-dark-500"
              placeholder="TonPseudo"
              @keyup.enter="saveUsername"
              @keyup.escape="cancelUsername"
            >
            <button
              type="button"
              class="w-8 h-8 bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors cursor-pointer"
              @click="saveUsername"
            >
              <UiIcon name="check" class="w-4 h-4" />
            </button>
            <button
              type="button"
              class="w-8 h-8 bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors cursor-pointer"
              @click="cancelUsername"
            >
              <UiIcon name="close" class="w-4 h-4" />
            </button>
          </div>
        </template>
        <template v-else>
          <div class="flex items-center justify-between">
            <p class="text-dark-500">{{ displayName }}</p>
            <button
              type="button"
              class="text-dark-500/50 hover:text-dark-500 transition-colors cursor-pointer"
              @click="startEditUsername"
            >
              <UiIcon name="edit" class="w-4 h-4" />
            </button>
          </div>
        </template>
      </div>

      <!-- Mot de passe -->
      <div class="pb-6 border-b border-dark-500/10">
        <p class="text-xs text-dark-500/40 uppercase tracking-wider mb-1">
          Mot de passe
        </p>
        <template v-if="editingPassword">
          <div class="space-y-2">
            <input
              v-model="newPassword"
              type="password"
              class="w-full border border-dark-500/20 bg-light-500 px-3 py-2 text-dark-500 outline-none focus:border-dark-500 focus:ring-1 focus:ring-dark-500"
              placeholder="Nouveau mot de passe"
            >
            <input
              v-model="confirmPassword"
              type="password"
              class="w-full border border-dark-500/20 bg-light-500 px-3 py-2 text-dark-500 outline-none focus:border-dark-500 focus:ring-1 focus:ring-dark-500"
              placeholder="Confirmer le mot de passe"
              @keyup.enter="savePassword"
            >
            <p v-if="passwordError" class="text-xs text-red-600">
              {{ passwordError }}
            </p>
            <div class="flex items-center gap-2">
              <UiButton
                variant="success"
                size="md"
                class="flex-1"
                @click="savePassword"
                >Enregistrer</UiButton
              >
              <UiButton
                variant="danger"
                size="md"
                class="flex-1"
                @click="cancelPassword"
                >Annuler</UiButton
              >
            </div>
          </div>
        </template>
        <template v-else>
          <div class="flex items-center justify-between">
            <p class="text-dark-500">••••••••</p>
            <button
              type="button"
              class="text-dark-500/50 hover:text-dark-500 transition-colors cursor-pointer"
              @click="startEditPassword"
            >
              <UiIcon name="edit" class="w-4 h-4" />
            </button>
          </div>
        </template>
      </div>

      <!-- Statut et date -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p class="text-xs text-dark-500/40 uppercase tracking-wider mb-1">
            Statut
          </p>
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1 bg-dark-500/5 text-dark-500 text-sm font-medium"
          >
            <UiIcon name="star" class="w-3 h-3" />
            {{ role === "admin" ? "Administrateur" : "Joueur" }}
          </span>
        </div>
        <div>
          <p class="text-xs text-dark-500/40 uppercase tracking-wider mb-1">
            Membre depuis
          </p>
          <p class="text-dark-500">{{ formatDate(createdAt) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
