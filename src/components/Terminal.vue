<template>
  <div class="w-full bg-black flex items-center justify-center">
    <!-- Terminal Shell -->
    <div id="terminal-image"
      class="relative bg-no-repeat bg-cover bg-center w-[90vw] h-auto max-w-[1024px] aspect-[960/1920] md:aspect-[1024/768]"
      :style="{ backgroundImage: `url(${isTall ? terminalTallBg : terminalBg})` }"
    >
      <!-- Terminal Text Area -->
      <div id="terminal-text" class="absolute inset-0 px-[8%] mb-2  flex flex-col justify-end text-white font-mono pt-0 md:pt-0"
        :class="[isTall ? 'pb-[25%] pl-[12%]' : 'pb-[8%]']"
      >
        <!-- History -->
        <div id="terminal-history" class="overflow-y-auto mb-4 ml-6 break-words whitespace-pre-line relative pt-0 h-full flex flex-col"
          :class="[isTall ? 'max-h-[80%] mr-[10%]' : 'max-h-[65%]']" style="background: transparent; min-height: 0;">
          <div class="history-lines mt-auto relative z-30">
            <div v-for="(line, i) in history" :key="i" :class="['mb-1', line.role]">
              {{ line.text }}
            </div>
          </div>
        </div>
        <!-- Overlay gradient absolutely positioned at the top of the scrollable area, OUTSIDE the scrollable container -->
        <div class="fade-text-top absolute left-0 top-0 pointer-events-none" style="height:2.5rem;"></div>

        <!-- Input -->
        <div class="flex items-center">
          <span class="text-green-400 mr-2">&gt;</span>
          <div class="flex-1 flex items-center relative">
            <div class="relative w-full flex items-center overflow-x-hidden">
              <span class="invisible select-none w-full block absolute left-0 top-0 pointer-events-none">
                {{ input.slice(0, cursorPos) }}
              </span>
              <input
                v-model="input"
                @keydown.enter="submit"
                ref="terminalInput"
                class="w-full bg-transparent border-none outline-none caret-transparent placeholder-gray-600 pr-0 relative z-10 overflow-x-auto"
                :placeholder="!isFocused ? 'type here...' : ''"
                autofocus
                @focus="isFocused = true"
                @blur="isFocused = false"
                @input="updateSelection"
                style="max-width:95%; overflow-x: auto; white-space: nowrap;"
              />
              <span
                v-if="isFocused"
                :class="['cursor-block', { 'animate-blink': showCursor }]"
                :style="cursorOverlayStyle"
              >
                <template v-if="input.length > 0 && cursorPos > 0">{{ input.slice(cursorPos-1, cursorPos) }}</template>
                <template v-else>&nbsp;</template>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import terminalBg from '@/assets/Terminal.png'
import terminalTallBg from '@/assets/Terminal_tall.png';
import recruiterQuestions from '@/../RecruiterQuestions.json';

const input = ref('')
const history = ref([])
const showCursor = ref(true)
const terminalInput = ref(null)
const isFocused = ref(false)
const cursorPos = ref(0)
const recruiterContext = ref([])

// Responsive isTall logic
const isTall = ref(false)
onMounted(() => {
  const checkTall = () => {
    isTall.value = window.innerWidth < 768;
  };
  checkTall();
  window.addEventListener('resize', checkTall);
  setInterval(() => (showCursor.value = !showCursor.value), 500)
  terminalInput.value?.focus()
  cursorPos.value = input.value.length

  recruiterContext.value = recruiterQuestions.map(q => ({
    role: 'system',
    text: `${q.question}\n${q.answer}`
  }));
})

watch(input, (val) => {
  // Keep cursorPos in sync with input length if user types
  cursorPos.value = terminalInput.value ? terminalInput.value.selectionStart : val.length
})

const cursorOverlayStyle = computed(() => {
  if (!terminalInput.value) return {};
  const inputEl = terminalInput.value;
  const value = input.value;
  const selection = cursorPos.value;
  // Create a dummy span to measure the caret position
  const dummy = document.createElement('span');
  dummy.style.visibility = 'hidden';
  dummy.style.position = 'absolute';
  dummy.style.whiteSpace = 'pre';
  dummy.style.font = window.getComputedStyle(inputEl).font;
  dummy.style.overflow = 'hidden';
  dummy.style.maxWidth = inputEl.offsetWidth + 'px';
  dummy.textContent = value.slice(0, selection ? selection - 1 : 0);
  document.body.appendChild(dummy);
  let left = dummy.getBoundingClientRect().width;
  // Constrain the left position to the input width
  const maxLeft = inputEl.offsetWidth - 12; // 12px for cursor width/padding
  if (left > maxLeft) left = maxLeft;
  document.body.removeChild(dummy);
  return {
    position: 'absolute',
    left: `${left}px`,
    top: 0,
    height: '100%',
    pointerEvents: 'none',
    zIndex: 20,
  };
})

// Gemini chat integration
const isLoading = ref(false)
async function submit() {
  if (input.value.trim()) {
    const userMessage = input.value.trim();
    history.value.push({ text: '> ' + userMessage, role: 'user' });
    input.value = '';
    cursorPos.value = 0;
    isLoading.value = true;
    // Show '...' while waiting for response
    history.value.push({ text: '...', role: 'system' });
    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      let answer = '';
      if (res.body && res.body.getReader) {
        // Stream response
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          answer += decoder.decode(value);
        }
      } else {
        answer = await res.text();
      }
      // Typewriter effect for system response
      await typewriterSystemResponse(answer);
    } catch (err) {
      history.value[history.value.length - 1].text = '[error] Could not get a response.';
    } finally {
      isLoading.value = false;
      // Only scroll for user input, not for system response
      setTimeout(() => {
        const historyEl = document.getElementById('terminal-history');
        if (historyEl) {
          historyEl.scrollTop = historyEl.scrollHeight;
        }
      }, 0);
    }
  }
}

// Typewriter effect for system (server) response
async function typewriterSystemResponse(fullText) {
  const idx = history.value.length - 1;
  history.value[idx].text = '';
  const historyEl = document.getElementById('terminal-history');
  let prevScrollTop = historyEl ? historyEl.scrollTop : 0;
  let prevScrollHeight = historyEl ? historyEl.scrollHeight : 0;
  for (let i = 0; i < fullText.length; i++) {
    history.value[idx].text = fullText.slice(0, i + 1);
    await new Promise(r => setTimeout(r, 12));
    if (historyEl) {
      // Adjust scrollTop to preserve the visible area as the scroll bar grows
      const newScrollHeight = historyEl.scrollHeight;
      if (newScrollHeight > prevScrollHeight) {
        historyEl.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
        prevScrollTop = historyEl.scrollTop;
        prevScrollHeight = newScrollHeight;
      }
    }
  }
}

function updateSelection(e) {
  // Get the caret position in the input
  cursorPos.value = e.target.selectionStart
}
</script>

<style scoped>
.caret-transparent {
  caret-color: transparent;
}
.cursor-block {
  background: #22ff22;
  color: #000;
  border-radius: 2px;
  padding: 0 2px;
  display: inline-block;
  min-width: 1ch;
  text-align: center;
  position: absolute;
}
@keyframes blink {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0; }
}
.animate-blink {
  animation: blink 1s step-start infinite;
}

/* Custom scrollbar styles for the history container */
.overflow-y-auto::-webkit-scrollbar {
  width: 10px;
  background: #695555;
  border-radius: 8px;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #5a120c;
  border-radius: 8px;
  box-shadow: 0 0 8px 2px #FF3622;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #e02d1a;
  box-shadow: 0 0 12px 4px #FF3622;
  border-radius: 12px;
}
.overflow-y-auto::-webkit-scrollbar-corner {
  background: #fff;
  border-radius: 8px;
}

/* Firefox */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #cf2b1c #00000000;
  border-radius: 8px;
}
.overflow-y-auto:hover {
  box-shadow: 0 0 8px 2px #FF3622;
}
.user {
  max-width: 60%;
  word-break: break-word;
  text-align: left;
  align-self: flex-start;
}
.system {
  max-width: 60%;
  word-break: break-word;
  align-self: flex-end;
  margin-left: auto;
  color: #22ff22;
}
.history-lines {
  position: relative;
  z-index: 0;
}

/* Gradient fade effect at the top of the history container */
.fade-text-top {
  position: absolute;
  top: 26%;
  left: 10.5%;
  width: 81%;
  height: 3.5rem;
  pointer-events: none;
  /* z-index must be lower than the overlay image */
  z-index: 10;
  background: linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%);
}
@media (max-width: 767px) {
  .fade-text-top {
    top: 11%;
    left: 16.5%;
    width: 69%;
  }
}
</style>
