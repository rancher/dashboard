<template>
  <div>
    <!-- Button to toggle the panel -->
    <button @click="togglePanel">Toggle Panel</button>

    <!-- Slide-in panel -->
    <transition
      name="slide-in"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @leave="onLeave"
      @after-leave="onAfterLeave"
    >
      <div 
        v-if="isOpen" 
        class="slide-panel"
        :class="{ active: isActive }"
        @click.stop
      >
        <p>This is the slide-in panel content!</p>
        <button @click="togglePanel">Close</button>
      </div>
    </transition>

    <!-- Overlay -->
    <!-- <div 
      v-if="isOpen" 
      class="overlay" 
      @click="togglePanel"
    ></div> -->
  </div>
</template>

<script>
export default {
  name: 'SlidePanel',
  data() {
    return {
      isOpen: false, // Controls visibility of the panel
      isActive: false, // Tracks the active state after animation
    };
  },
  methods: {
    togglePanel() {
      this.isOpen = !this.isOpen;
    },
    onEnter() {
      console.log('Panel animation started (enter)');
    },
    onAfterEnter() {
      console.log('Panel animation completed (after-enter)');
      this.isActive = true; // Mark the panel as active
    },
    onLeave() {
      console.log('Panel animation started (leave)');
    },
    onAfterLeave() {
      console.log('Panel animation completed (after-leave)');
      this.isActive = false; // Reset the active state
    },
  },
};
</script>


<style scoped>
/* Container for the panel */
.slide-panel {
  position: fixed;
  top: 0;
  right: -100%; /* Start off-screen */
  width: 300px;
  height: 100%;
  background: #fff;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
  overflow-y: auto;
  transition: right 0.3s ease; /* Smooth sliding */
  z-index: 100;
}

.active {
  right: 0;
}

/* Overlay to darken the background */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10;
}

/* Enter animation */
.slide-in-enter-active {
  transition: right 0.5s ease; /* Animates both enter and leave */
}

.slide-in-leave-active {
  transition: right 1s ease; /* Animates both enter and leave */
}

.slide-in-enter-from,
.slide-in-leave-to {
  right: -100%; /* Off-screen position */
}

.slide-in-enter-to,
.slide-in-leave-from {
  right: 0; /* Fully visible position */
}
</style>
