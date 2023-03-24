<script lang="ts">
import Vue from 'vue';

interface Data {}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  data() {
    return { word: '' };
  },

  computed: {
    isPalindrome() {
      if (!this.word) {
        return false;
      }

      const lowerCaseTrimString = this.word.toLowerCase().trim().replace(/\s/g, ''); // lowercase, trim, no spaces
      const reverseString = lowerCaseTrimString.toLowerCase().split('').reverse().join('');

      return reverseString === lowerCaseTrimString;
    },
  },

  methods: {},
});
</script>

<template>
  <div>
    <h2>Check palindrome</h2>

    <label>
      Type a word:
      <input
        v-model="word"
        type="text"
      >
      </input>
    </label>

    Is palindrome: {{ isPalindrome }}
  </div>
</template>
