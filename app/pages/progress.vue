<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useProgress } from "~/composables/useProgress";
import { useFriends, type FriendProfile } from "~/composables/useFriends";

definePageMeta({ layout: "mobile" });

useHead({ title: "Aínigma | Progression" });

const auth = useAuth();
const progress = useProgress();
const friendsComposable = useFriends();

// Stats personnelles
const streak = ref(0);
const totalWins = ref(0);
const bestTime = ref<number | null>(null);
const avgMoves = ref<number | null>(null);
const recentDays = ref<
  Array<{
    date: string;
    success: boolean;
    moves: number | null;
    timeSpentSeconds: number | null;
  }>
>([]);

// Calendrier (30 derniers jours)
const last30Days = computed(() => {
  const days: Array<{ date: string; label: string; played: boolean }> = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const played = recentDays.value.some(
      (r) => r.date === dateStr && r.success,
    );
    days.push({
      date: dateStr,
      label: d.getDate().toString(),
      played,
    });
  }
  return days;
});

// Amis
const friendsList = ref<FriendProfile[]>([]);
const showAddFriend = ref(false);
const searchQuery = ref("");
const searchResults = ref<
  Array<{ id: string; username: string; avatar_url: string | null }>
>([]);
const searching = ref(false);

// Recherche d'amis
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout);
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }
  searching.value = true;
  searchTimeout = setTimeout(async () => {
    searchResults.value = await friendsComposable.searchUsers(
      searchQuery.value,
    );
    searching.value = false;
  }, 400);
}

async function addFriend(userId: string) {
  friendsComposable.addFriend(userId);
  searchQuery.value = "";
  searchResults.value = [];
  showAddFriend.value = false;
  await loadFriends();
}

async function removeFriendHandler(userId: string) {
  friendsComposable.removeFriend(userId);
  await loadFriends();
}

async function loadFriends() {
  friendsList.value = await friendsComposable.getFriendsWithStats();
}

function formatTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

onMounted(async () => {
  try {
    if (!auth.isLoggedIn.value) {
      loading.value = false;
      return;
    }

    // Charger tout en PARALLÈLE (au lieu de séquentiellement)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().slice(0, 10);
    const endDate = new Date().toISOString().slice(0, 10);

    const [streakData, plays] = await Promise.all([
      progress.getStreak(),
      progress.getPlaysForDateRange(startDate, endDate),
    ]);

    streak.value = streakData.streak;
    recentDays.value = plays.map((p) => ({
      date: p.date,
      success: true,
      moves: p.moves,
      timeSpentSeconds: p.timeSpentSeconds,
    }));
    totalWins.value = plays.length;

    // Calculer meilleur temps et moyenne coups en local (pas de requête!)
    const times = plays
      .map((p) => p.timeSpentSeconds)
      .filter((t): t is number => t !== null);
    bestTime.value = times.length > 0 ? Math.min(...times) : null;

    const movesArray = plays
      .map((p) => p.moves)
      .filter((m): m is number => m !== null);
    avgMoves.value =
      movesArray.length > 0
        ? Math.round(movesArray.reduce((a, b) => a + b, 0) / movesArray.length)
        : null;

    // Charger amis en PARALLÈLE aussi
    await loadFriends();
  } catch (e) {
    console.error("Erreur chargement progression:", e);
  }
});
</script>

<template>
  <div class="bg-white min-h-dvh pb-20">
    <!-- Header -->
    <AppHeader
      mode="app"
    />

    <!-- Non connecté -->
    <div v-if="!auth.isLoggedIn.value" class="px-5 py-16 text-center">
      <div
        class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <p class="text-gray-500 mb-4">Connecte-toi pour voir ta progression</p>
      <NuxtLink
        to="/auth/login"
        class="inline-block bg-linear-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold"
      >
        Se connecter
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Stats rapides -->
      <section class="px-5 mt-4">
        <div class="grid grid-cols-4 gap-3">
          <div
            class="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center"
          >
            <p class="text-2xl font-bold text-pink-500">{{ streak }}</p>
            <p class="text-[10px] text-gray-400 mt-0.5">Série</p>
          </div>
          <div
            class="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center"
          >
            <p class="text-2xl font-bold text-purple-500">{{ totalWins }}</p>
            <p class="text-[10px] text-gray-400 mt-0.5">Victoires</p>
          </div>
          <div
            class="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center"
          >
            <p class="text-2xl font-bold text-lime-600">
              {{ formatTime(bestTime) }}
            </p>
            <p class="text-[10px] text-gray-400 mt-0.5">Record</p>
          </div>
          <div
            class="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-center"
          >
            <p class="text-2xl font-bold text-gray-900">
              {{ avgMoves ?? "--" }}
            </p>
            <p class="text-[10px] text-gray-400 mt-0.5">Moy. coups</p>
          </div>
        </div>
      </section>

      <!-- Calendrier 30 jours -->
      <section class="px-5 mt-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">
          30 derniers jours
        </h2>
        <div class="bg-gray-50 border border-gray-100 rounded-2xl p-4">
          <div class="grid grid-cols-10 gap-1.5">
            <div
              v-for="day in last30Days"
              :key="day.date"
              class="aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors"
              :class="
                day.played
                  ? 'bg-pink-500 text-white shadow-sm shadow-pink-500/20'
                  : 'bg-gray-200/60 text-gray-400'
              "
              :title="day.date"
            >
              {{ day.label }}
            </div>
          </div>
          <div class="flex items-center gap-3 mt-3 text-xs text-gray-400">
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded bg-pink-500" />
              <span>Joué</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded bg-gray-200/60" />
              <span>Pas joué</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Historique récent -->
      <section class="px-5 mt-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">
          Parties récentes
        </h2>
        <div v-if="recentDays.length === 0" class="text-center py-8">
          <p class="text-gray-400 text-sm">Aucune partie récente</p>
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="play in recentDays.slice().reverse().slice(0, 7)"
            :key="play.date"
            class="bg-gray-50 border border-gray-100 rounded-xl p-3.5 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                :class="
                  play.success
                    ? 'bg-pink-500/10 text-pink-500'
                    : 'bg-gray-100 text-gray-400'
                "
              >
                {{ play.success ? "✓" : "✗" }}
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ formatDate(play.date) }}
                </p>
                <p class="text-xs text-gray-400">
                  {{ play.moves != null ? `${play.moves} coups` : "" }}
                  {{
                    play.moves != null && play.timeSpentSeconds != null
                      ? " · "
                      : ""
                  }}
                  {{
                    play.timeSpentSeconds != null
                      ? formatTime(play.timeSpentSeconds)
                      : ""
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section Amis -->
      <section class="px-5 mt-8">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-900">Amis</h2>
          <button
            class="w-8 h-8 bg-pink-500/10 text-pink-500 rounded-lg flex items-center justify-center active:scale-95 transition-transform"
            @click="showAddFriend = !showAddFriend"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          </button>
        </div>

        <!-- Barre de recherche amis -->
        <Transition name="slide">
          <div
            v-if="showAddFriend"
            class="mb-4 bg-gray-50 border border-gray-100 rounded-2xl p-4"
          >
            <p class="text-sm text-gray-500 mb-2">
              Recherche un joueur par pseudo
            </p>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Pseudo..."
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-colors"
              @input="onSearchInput"
            />

            <!-- Résultats de recherche -->
            <div v-if="searching" class="text-center py-3">
              <div
                class="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"
              />
            </div>
            <div v-else-if="searchResults.length > 0" class="mt-3 space-y-2">
              <div
                v-for="user in searchResults"
                :key="user.id"
                class="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-100"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold"
                  >
                    {{ user.username.charAt(0).toUpperCase() }}
                  </div>
                  <span class="text-sm font-medium text-gray-900">{{
                    user.username
                  }}</span>
                </div>
                <button
                  v-if="!friendsComposable.isFriend(user.id)"
                  class="text-xs bg-pink-500 text-white px-3 py-1.5 rounded-lg font-medium active:scale-95 transition-transform"
                  @click="addFriend(user.id)"
                >
                  Ajouter
                </button>
                <span v-else class="text-xs text-gray-400 font-medium"
                  >Déjà ami</span
                >
              </div>
            </div>
            <p
              v-else-if="searchQuery.length >= 2 && !searching"
              class="text-xs text-gray-400 mt-3 text-center"
            >
              Aucun résultat
            </p>
          </div>
        </Transition>

        <!-- Liste des amis -->
        <div
          v-if="friendsList.length === 0 && !showAddFriend"
          class="text-center py-8"
        >
          <div
            class="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-2xl flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          </div>
          <p class="text-gray-400 text-sm mb-1">Pas encore d'amis</p>
          <p class="text-gray-300 text-xs">
            Ajoute des amis pour comparer vos scores
          </p>
        </div>

        <div v-else class="space-y-2">
          <!-- Classement : Toi d'abord -->
          <div
            class="bg-linear-to-r from-pink-500/5 to-purple-500/5 border border-pink-500/10 rounded-xl p-3.5 flex items-center gap-3"
          >
            <div
              class="w-8 h-8 rounded-full bg-linear-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0"
            >
              {{
                auth.displayName.value
                  ? auth.displayName.value.charAt(0).toUpperCase()
                  : "?"
              }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">
                {{ auth.displayName.value ?? "Toi" }}
                <span
                  class="text-[10px] text-pink-500 bg-pink-500/10 px-1.5 py-0.5 rounded-full ml-1"
                  >Toi</span
                >
              </p>
            </div>
            <div class="flex items-center gap-4 shrink-0">
              <div class="text-center">
                <p class="text-sm font-bold text-pink-500">{{ streak }}</p>
                <p class="text-[9px] text-gray-400">série</p>
              </div>
              <div class="text-center">
                <p class="text-sm font-bold text-gray-900">{{ totalWins }}</p>
                <p class="text-[9px] text-gray-400">victoires</p>
              </div>
            </div>
          </div>

          <!-- Amis -->
          <div
            v-for="friend in friendsList"
            :key="friend.id"
            class="bg-gray-50 border border-gray-100 rounded-xl p-3.5 flex items-center gap-3"
          >
            <div
              class="w-8 h-8 rounded-full bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0"
            >
              {{ friend.username.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ friend.username }}
              </p>
            </div>
            <div class="flex items-center gap-4 shrink-0">
              <div class="text-center">
                <p class="text-sm font-bold text-pink-500">
                  {{ friend.streak }}
                </p>
                <p class="text-[9px] text-gray-400">série</p>
              </div>
              <div class="text-center">
                <p class="text-sm font-bold text-gray-900">
                  {{ friend.totalWins }}
                </p>
                <p class="text-[9px] text-gray-400">victoires</p>
              </div>
              <button
                class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                title="Retirer"
                @click="removeFriendHandler(friend.id)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 400px;
}
</style>
