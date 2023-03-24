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
    <h2>Counter</h2>

    <span
      class="mr-3"
    >
      {{ counter }}
    </span>
    <button
      class="btn btn-sm role-primary"
      @click="increment"
    >
      +
    </button>
    <button
      class="btn btn-sm role-primary"
      @click="decrement"
    >
      -
    </button>
  </div>
</template>
