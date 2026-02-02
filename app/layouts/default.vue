<template>
  <div class="min-h-screen">
    <main
      class="relative z-10 bg-light-500 min-h-screen rounded-b-3xl mb-64 shadow-xl"
    >
      <MyHeader />
      <slot />
    </main>
    <MyFooter />
  </div>
</template>
