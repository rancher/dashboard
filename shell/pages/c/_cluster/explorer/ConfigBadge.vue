<script>
import { _EDIT } from '@shell/config/query-params';
export default {
  props: {
    cluster: {
      type:     Object,
      required: true,
    },
  },

  name: 'ConfigBadge',

  computed: {
    tooltip() {
      return this.t('clusterBadge.customizeAppearance');
    }
  },
  methods: {
    customBadgeDialog(ev) {
      this.$store.dispatch('cluster/promptModal', { component: 'AddCustomBadgeDialog', componentProps: { mode: _EDIT } });
    },
  },
};
</script>

<template>
  <div
    class="config-badge"
  >
    <div>
      <button
        class="badge-install btn btn-sm role-secondary"
        data-testid="add-custom-cluster-badge"
        role="button"
        tabindex="0"
        @click="customBadgeDialog"
        @keyup.space="customBadgeDialog"
      >
        <i
          v-clean-tooltip="tooltip"
          class="icon icon-brush-icon"
        />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .badge-install:hover {
    cursor: pointer;
  }
  .badge-install {
    display: flex;
    margin-left: 10px;

    &:hover {
      border-color: var(--lightest);
    }

    > I {
      line-height: inherit;
    }
  }

</style>
