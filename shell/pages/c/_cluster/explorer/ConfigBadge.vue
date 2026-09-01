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
    customBadgeDialog() {
      this.$store.dispatch('cluster/promptModal', { component: 'AddCustomBadgeDialog', componentProps: { mode: _EDIT } });
    },
  },
};
</script>

<template>
  <div class="config-badge">
    <div>
      <button
        v-clean-tooltip="{content: tooltip, triggers: ['hover', 'touch', 'focus'] }"
        v-stripped-aria-label="tooltip"
        class="badge-install btn btn-sm role-secondary"
        data-testid="add-custom-cluster-badge"
        role="button"
        @click="customBadgeDialog"
      >
        <i class="icon icon-brush-icon" />
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

    &:focus {
      outline: 0;
    }
  }

</style>
