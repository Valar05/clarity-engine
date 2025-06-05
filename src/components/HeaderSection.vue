<template>
  <header class="w-full bg-black text-white flex flex-row items-start justify-center space-y-0 relative pt-4">
    <img src="@/assets/logo_vector.svg" alt="Logo" class="h-20 w-20 md:h-[196px] md:w-[196px] mr-4" />
    <h1 class="text-base sm:text-lg md:text-5xl font-bold text-left px-0 mt-2">
      Code is my second language. <br class="hidden sm:block" /><br/>
      <span class="text-red-500">Clarity is my first.</span>
    </h1>
  </header>
</template>

<script setup>
</script>

<style scoped>
h1 {
  animation: fadeIn 1s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
