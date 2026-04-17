<script>

export default {
  name: 'MgmtClusterKubeVersion',

  props: {
    row: {
      type:    Object,
      default: null,
    },
  },
};
</script>

<template>
  <div>
    <span>
      {{ row.kubernetesVersion }}
    </span>
    <div
      v-clean-tooltip="{content: row.architecture.tooltip, placement: 'left'}"
      class="text-muted"
    >
      {{ row.architecture.label }}
    </div>
  </div>
</template>
