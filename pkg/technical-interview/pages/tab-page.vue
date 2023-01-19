<script lang="ts">
import Vue from 'vue';

interface Data {
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  components: {},

  layout: 'plain',

  data() {
    return { };
  },

  computed: {},

  methods: {}

});
</script>

<template>
  <div>
    <h1>{{ t('interview.tabPage.title') }}</h1>
  </div>
</template>
