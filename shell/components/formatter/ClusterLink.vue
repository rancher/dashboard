<script>
import { get } from '@shell/utils/object';

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
    }
  },
  computed: {
    to() {
      if ( this.row && this.reference ) {
        return get(this.row, this.reference);
      }

      return this.row?.detailLocation;
    },

    statusErrorConditions() {
      if (this.row.hasError) {
        return this.row?.status.conditions.filter(condition => condition.error === true);
      }

      return false;
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

      return false;
    },
  },

};

</script>
<template>
  <span class="cluster-link">
    <n-link
      v-if="to"
      :to="to"
    >
      {{ value }}
    </n-link>
    <span v-else>{{ value }}</span>
    <i
      v-if="row.rkeTemplateUpgrade"
      v-tooltip="t('cluster.rkeTemplateUpgrade', { name: row.rkeTemplateUpgrade })"
      class="template-upgrade-icon icon-alert icon"
    />
    <i
      v-if="row.hasError"
      v-tooltip="{ content: `<div>${formattedConditions}</div>`, html: true }"
      class="conditions-alert-icon icon-error icon-lg"
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
  ::v-deep {
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
  .template-upgrade-icon {
    border: 1px solid var(--warning);
    border-radius: 50%;
    color: var(--warning);
    margin-left: 4px;
    font-size: 14px;
    padding: 2px;
  }
</style>
