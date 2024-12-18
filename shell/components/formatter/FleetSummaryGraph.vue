<script>
import ProgressBarMulti from '@shell/components/ProgressBarMulti';
import { ucFirst } from '@shell/utils/string';
import { colorForState, stateSort } from '@shell/plugins/dashboard-store/resource-class';
import { sortBy } from '@shell/utils/sort';
import { FLEET } from '@shell/config/types';

export default {
  components: { ProgressBarMulti },

  props: {
    row: {
      type:     Object,
      required: true
    },

    clusterId: {
      type:     String,
      required: false,
      default:  null,
    }
  },

  computed: {
    summary() {
      if (this.clusterId) {
        return this.row.statusResourceCountsForCluster(this.clusterId);
      }

      return this.row.status?.resourceCounts || {};
    },

    show() {
      return this.stateParts.length > 0 && (this.row.type === FLEET.CLUSTER || this.row.targetClusters?.length);
    },

    stateParts() {
      const summary = this.summary;
      const keys = Object.keys(summary).filter((x) => !x.startsWith('desired'));

      const out = keys.map((key) => {
        const textColor = colorForState(key);

        return {
          label: ucFirst(key),
          color: textColor.replace(/text-/, 'bg-'),
          textColor,
          value: summary[key],
          sort:  stateSort(textColor, key),
        };
      }).filter((x) => x.value > 0);

      return sortBy(out, 'sort:desc');
    },

  },
};
</script>

<template>
  <v-dropdown
    v-if="show"
    class="text-center hand"
    placement="top"
    :show-group="row.id"
    :triggers="show ? ['click'] : []"
    offset="1"
  >
    <ProgressBarMulti
      :values="stateParts"
      class="mb-5"
    />
    <span v-if="summary.desiredReady === summary.ready">{{ summary.ready }}</span>
    <span v-else>{{ summary.ready }} of {{ summary.desiredReady }}</span>

    <template #popper>
      <table
        v-if="show"
        class="fixed"
      >
        <tbody>
          <tr
            v-for="(obj, i) in stateParts"
            :key="i"
          >
            <td
              class="text-left pr-20"
              :class="{ [obj.textColor]: true }"
            >
              {{ obj.label }}
            </td>
            <td class="text-right">
              {{ obj.value }}
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </v-dropdown>
  <div
    v-else
    class="text-center text-muted"
  >
    &mdash;
  </div>
</template>

<style lang="scss">
.col-scale {
  position: relative;

  .trigger {
    width: 100%;
  }
}

.scale {
  margin: 0;
  padding: 0;
  line-height: initial;
}
</style>
