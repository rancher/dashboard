<script lang="ts">
import Vue from 'vue';

interface Data {}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  data() {
    return {
      originalJson: null,
      swappedJson:  null,
    };
  },

  computed: {},

  methods: {
    onFileChange(e: any) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          this.originalJson = JSON.parse(event?.target?.result as string);
          this.swappedJson = null;
        } catch (e) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    },
    swapKeysAndValues() {
      this.swappedJson = this.swap(this.originalJson);
    },
    swap(json: any): any {
      if (typeof json !== 'object' || Array.isArray(json)) {
        return json;
      }

      const result: any = {};

      for (const key in json) {
        const value = json[key];

        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          result[value.toString()] = key;
        } else {
          result[key] = this.swap(value);
        }
      }

      return result;
    },
  },
});
</script>

<template>
  <div>
    Tab 3

    <div>
      <input
        type="file"
        @change="onFileChange"
      >
      <div v-if="originalJson">
        <h3>Original JSON:</h3>
        <pre>{{ originalJson }}</pre>
      </div>
      <button
        v-if="originalJson"
        @click="swapKeysAndValues"
      >
        Swap Keys and Values
      </button>
      <div v-if="swappedJson">
        <h3>Swapped JSON:</h3>
        <pre>{{ swappedJson }}</pre>
      </div>
    </div>
  </div>
</template>
