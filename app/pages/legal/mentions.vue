<script setup lang="ts">
useHead({ title: "Seed | Mentions légales" });
</script>

<template>
  <div class="min-h-screen pt-24 pb-16 px-8">
    <article class="max-w-3xl mx-auto">
      <h1 class="text-4xl text-dark-500 mb-8">Mentions légales</h1>

      <div
        class="prose prose-dark max-w-none space-y-8 md:max-w-[65ch] text-sm"
      >
        <section
          class="py-12 border-b border-[rgba(17,24,39,0.5)] last:border-b-0"
        >
          <h2 class="text-xl font-semibold text-dark-500 mb-3">
            Éditeur du site
          </h2>
          <p class="text-dark-500/70 leading-relaxed">
            Le site Seed est édité dans le cadre d’un projet individuel de BUT
            MMI (Métiers du Multimédia et de l’Internet).
          </p>
          <ul class="mt-4 space-y-2 text-dark-500/70">
            <li><strong>Responsable :</strong> Clémence Lauga</li>
            <li><strong>Formation :</strong> BUT MMI 3ème année</li>
            <li>
              <strong>Contact :</strong>
              <a
                href="mailto:contact@seed-game.fr"
                class="text-purple-500 hover:underline"
              >
                contact@seed-game.fr
              </a>
            </li>
          </ul>
        </section>

        <section
          class="py-12 border-b border-[rgba(17,24,39,0.5)] last:border-b-0"
        >
          <h2 class="text-xl font-semibold text-dark-500 mb-3">Hébergement</h2>
          <p class="text-dark-500/70 leading-relaxed">
            Ce site est hébergé par :
          </p>
          <ul class="mt-4 space-y-2 text-dark-500/70">
            <li><strong>Vercel Inc.</strong></li>
            <li>440 N Barranca Ave #4133</li>
            <li>Covina, CA 91723, États-Unis</li>
            <li>
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener"
                class="text-purple-500 hover:underline"
              >
                vercel.com
              </a>
            </li>
          </ul>
        </section>

        <section
          class="py-12 border-b border-[rgba(17,24,39,0.5)] last:border-b-0"
        >
          <h2 class="text-xl font-semibold text-dark-500 mb-3">
            Base de données
          </h2>
          <p class="text-dark-500/70 leading-relaxed">
            Les données sont hébergées par Supabase Inc., service de base de
            données cloud conforme au RGPD.
          </p>
        </section>

        <section
          class="py-12 border-b border-[rgba(17,24,39,0.5)] last:border-b-0"
        >
          <h2 class="text-xl font-semibold text-dark-500 mb-3">
            Propriété intellectuelle
          </h2>
          <p class="text-dark-500/70 leading-relaxed">
            L’ensemble des contenus présents sur ce site (textes, images,
            graphismes, logo, icônes, code source) sont la propriété exclusive
            de Seed, sauf mention contraire. Toute reproduction, représentation,
            modification ou adaptation de ces éléments est strictement interdite
            sans autorisation préalable.
          </p>
        </section>

        <section
          class="py-12 border-b border-[rgba(17,24,39,0.5)] last:border-b-0"
        >
          <h2 class="text-xl font-semibold text-dark-500 mb-3">
            Crédits et attributions
          </h2>
          <p class="text-dark-500/70 leading-relaxed">
            Ce projet utilise des technologies open source :
          </p>
          <ul class="mt-4 space-y-2 text-dark-500/70">
            <li>Nuxt 3 - Framework Vue.js</li>
            <li>Tailwind CSS - Framework CSS</li>
            <li>Supabase - Backend as a Service</li>
          </ul>
        </section>

        <section class="relative py-12">
          <h2 class="text-xl font-semibold text-dark-500 mb-3">
            Limitation de responsabilité
          </h2>
          <p class="text-dark-500/70 leading-relaxed">
            Seed s’efforce d’assurer l’exactitude des informations diffusées sur
            ce site. Cependant, il ne peut garantir l’exactitude, la précision
            ou l’exhaustivité des informations mises à disposition. En
            conséquence, Seed décline toute responsabilité pour les
            imprécisions, inexactitudes ou omissions.
          </p>
        </section>
      </div>

      <div class="mt-12 pt-8 border-t border-dark-500/10">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-purple-500 hover:text-purple-600 transition-colors"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Retour à l’accueil
        </NuxtLink>
      </div>
    </article>
  </div>
</template>

<style scoped>
/* Placeholder style block to ensure PostCSS processes valid CSS for this SFC. */
</style>
