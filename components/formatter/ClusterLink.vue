<script>
import { get } from '@/utils/object';
import { TIME_FORMAT, DATE_FORMAT } from '@/store/prefs';
import day from 'dayjs';
import { escapeHtml } from '@/utils/string';

export default {
  props:      {
    value: {
      type:     String,
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
  computed:   {
    to() {
      if ( this.row && this.reference ) {
        return get(this.row, this.reference);
      }

      return this.row?.detailLocation;
    },

    clusterHasIssues() {
      return this.row.status?.conditions?.some(condition => condition.error === true) || this.snapshotErrors.length;
    },

    statusErrorConditions() {
      if (this.clusterHasIssues) {
        return this.row?.status.conditions.filter(condition => condition.error === true);
      }

      return false;
    },

    snapshotErrors() {
      const snapshots = this.row.etcdSnapshots;

      if (!snapshots.length) {
        return [];
      }

      const dateFormat = escapeHtml(this.$store.getters['prefs/get'](DATE_FORMAT));
      const timeFormat = escapeHtml( this.$store.getters['prefs/get'](TIME_FORMAT));

      return snapshots.filter(snapshot => snapshot.errorMessage).map((snapshot) => {
        return {
          time: `${ day(snapshot.snapshotFile.createdAt).format(dateFormat) } ${ day(snapshot.snapshotFile.createdAt).format(timeFormat) }`,
          msg:  snapshot.errorMessage
        };
      });
    },

    formattedConditions() {
      if (this.clusterHasIssues) {
        const filteredConditions = this.statusErrorConditions;
        const formattedTooltip = [];

        filteredConditions
          .forEach((c) => {
            formattedTooltip.push(`<p>${ [c.type] } (${ c.status })</p>`);
          });

        this.snapshotErrors.forEach((err) => {
          formattedTooltip.push(`<p>${ this.t('cluster.snapshot.failed', { time: err.time }) }: ${ err.msg } </p> `);
        });

        return formattedTooltip.toString().replaceAll(',', '');
      }

      return false;
    },
  },

};

</script>
<template>
  <span>
    <n-link v-if="to" :to="to">
      {{ value }}
    </n-link>
    <span v-else>{{ value }}</span>
    <i
      v-if="clusterHasIssues"
      v-tooltip="{ content: `<div>${formattedConditions}</div>`, html: true }"
      class="conditions-alert-icon icon-error icon-lg"
    />
  </span>
</template>

<style lang="scss" scoped>
  .conditions-alert-icon {
    color: var(--error);
    padding-left: 2px;
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
</style>
