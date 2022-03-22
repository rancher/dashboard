<script>
export default {
  props: {
    value: {
      type:     Object,
      required: true
    }
  }
};
</script>

<template>
  <a v-if="value.runbook_url" rel="nofollow noopener noreferrer" target="_blank" :href="value.runbook_url">{{ value.message || value.description }} <i class="icon icon-external-link" /></a>
  <span v-else>{{ value.message || value.description }}</span>
</template>
