<script>
import { get } from '@shell/utils/object';
import { isConditionReadyAndWaiting } from '@shell/plugins/dashboard-store/resource-class';

export default {
  props: {
    value: {
      type:    String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    reference: {
      type:    String,
      default: null,
    },
    getCustomDetailLink: {
      type:    Function,
      default: null
    }
  },
  computed: {
    to() {
      if ( this.row && this.reference ) {
        return get(this.row, this.reference);
      }

      if (this.getCustomDetailLink) {
        return this.getCustomDetailLink(this.row);
      }

      return this.row?.detailLocation;
    },

    statusErrorConditions() {
      if (this.row.hasError) {
        return this.row?.status.conditions.filter((cond) => cond.error === true && !isConditionReadyAndWaiting(cond));
      }

      return [];
    },

    formattedConditions() {
      if (this.row.hasError) {
        const filteredConditions = this.statusErrorConditions;
        const formattedTooltip = [];

        filteredConditions
          .forEach((c) => {
            formattedTooltip.push(`<p>${ [c.type] } (${ c.status })</p>`);
          });

        return formattedTooltip.toString().replaceAll(',', '');
      }

      return '';
    },
  },

};

</script>
<template>
  <span class="cluster-link">
    <router-link
      v-if="to"
      :to="to"
    >
      {{ value }}
    </router-link>
    <span v-else>{{ value }}</span>
    <i
      v-if="row.unavailableMachines"
      v-clean-tooltip="row.unavailableMachines"
      class="conditions-alert-icon icon-alert icon"
      data-testid="unavailable-machines-alert-icon"
    />
    <i
      v-if="row.isRke1"
      v-clean-tooltip="t('cluster.rke1Unsupported')"
      class="rke1-unsupported-icon icon-warning icon"
      data-testid="rke1-unsupported-icon"
    />
    <i
      v-if="row.hasError && statusErrorConditions.length > 0"
      v-clean-tooltip="{ content: `<div>${formattedConditions}</div>`, html: true }"
      class="conditions-alert-icon icon-error icon-lg"
      data-testid="conditions-has-error-icon"
    />
  </span>
</template>

<style lang="scss" scoped>
  .cluster-link {
    display: flex;
    align-items: center;
  }
  .conditions-alert-icon {
    color: var(--error);
    margin-left: 4px;
  }
  :deep() {
    .labeled-tooltip, .status-icon {
      position: relative;
      display: inline;
      left: auto;
      right: auto;
      top: 2px;
      bottom: auto;
    }
  }
  .mytooltip ul {
    outline: 1px dashed red;
  }
  .rke1-unsupported-icon {
    color: var(--warning);
    margin-left: 4px;
    font-size: 14px;
  }
</style>
