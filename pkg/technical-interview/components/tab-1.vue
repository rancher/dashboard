<script lang="ts">
import Vue from 'vue';

interface Data {}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  data() {
    return { counter: 0 };
  },

  computed: {},

  methods: {
    increment() {
      this.counter++;
    },
    decrement() {
      this.counter--;
    },
  },
});
</script>

<template>
  <div>
    Tab 1
    {{ counter }}
    <button @click="increment">
      Increment
    </button>
    <button @click="decrement">
      Decrement
    </button>
  </div>
</template>
