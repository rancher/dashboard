<script lang="ts">
import CreateEditView from '@/mixins/create-edit-view';
import Loading from '@/components/Loading.vue';

export default {
  components: { Loading },
  mixins:     [
    CreateEditView
  ],

  data() {
    return {};
  },

  computed: {
    valid() {
      return false;
    },
  },

  methods: {}
};
</script>

<template>
  <Loading v-if="!value" />
  <div v-else>
    Mode: {{ mode }}<br>
    Value: {{ JSON.stringify(value) }}<br>
    originalValue: {{ JSON.stringify(originalValue) }}<br>
  </div>
</template>
