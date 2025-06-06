<template>
  <div class="w-full h-screen bg-black flex items-center justify-center">
    <!-- Terminal Shell -->
    <div
      class="relative bg-no-repeat bg-contain bg-center w-[90vw] h-auto aspect-[1024/768] max-w-[1024px]"
      :style="{ backgroundImage: `url(${terminalBg})` }"
    >
      <!-- Terminal Text Area -->
      <div class="absolute inset-0 px-[8%] pb-[10%] flex flex-col justify-end text-white font-mono">
        <!-- History -->
        <div class="overflow-y-auto max-h-[80%] mb-4">
          <div v-for="(line, i) in history" :key="i" class="mb-1 whitespace-pre-line">
            <span class="text-green-400">&gt;_</span> {{ line }}
          </div>
        </div>

        <!-- Input -->
        <div class="flex items-center">
          <span class="text-green-400 mr-2">&gt;_</span>
          <input
            v-model="input"
            @keydown.enter="submit"
            ref="terminalInput"
            class="flex-1 bg-transparent border-none outline-none caret-green-400 placeholder-gray-600"
            placeholder="type here..."
            autofocus
          />
          <span
            v-if="showCursor"
            class="ml-1 w-1 h-5 bg-green-400 animate-blink"
          ></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import terminalBg from '@/assets/Terminal.png'

const input = ref('')
const history = ref([])
const showCursor = ref(true)
const terminalInput = ref(null)

function submit() {
  if (input.value.trim()) {
    history.value.push(input.value.trim())
    input.value = ''
  }
}

onMounted(() => {
  setInterval(() => (showCursor.value = !showCursor.value), 500)
  terminalInput.value?.focus()
})
</script>

<style scoped>
@keyframes blink {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0; }
}
.animate-blink {
  animation: blink 1s step-start infinite;
}
</style>
