<script>
export default {
  name: 'ClusterRepoDetail',

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },
};
</script>

<template>
  <div class="mt-20 row">
    <div :class="{'col': true, 'span-6': value.isGit, 'span-12': !value.isGit}">
      <h3>URL</h3>
      <span>{{ value.urlDisplay }}</span>
    </div>
    <div v-if="value.isGit" class="span-6">
      <h3>Branch</h3>
      <span>{{ value.branchDisplay }}</span>
    </div>
  </div>
</template>
