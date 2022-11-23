<script>
import ProgressBarMulti from '@shell/components/ProgressBarMulti';

export default {
  components: { ProgressBarMulti },

  props: {
    row: {
      type:     Object,
      required: true
    },
    horizontal: {
      type:    Boolean,
      default: false
    }
  },

  computed: {
    ready() {
      // Ensure we never show more ready machines than desired
      // If w can address in backedn, we could revert this in the future
      const ready = this.row?.ready || 0;
      const desired = this.row?.desired || 0;

      return ready > desired ? desired : ready;
    }
  },
};
</script>

<template>
  <v-popover
    class="text-center hand machine-summary-graph"
    placement="top"
    :open-group="row.id"
    trigger="click"
    offset="1"
  >
    <template #popover>
      <table class="fixed">
        <tbody>
          <tr
            v-for="obj in row.stateParts"
            :key="obj.label"
          >
            <td
              class="text-left pr-20"
              :class="{[obj.textColor]: true}"
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

    <div
      class="content"
      :class="{ horizontal }"
    >
      <ProgressBarMulti
        v-if="row.stateParts"
        :values="row.stateParts"
        class="progress-bar"
      />
      <span
        v-if="row.desired === ready"
        class="count"
      >{{ ready }}</span>
      <span
        v-else
        class="count"
      >{{ ready }} of {{ row.desired }}</span>
    </div>
  </v-popover>
</template>

<style lang="scss" scoped>
  .machine-summary-graph {
    display: flex;
    align-items: center;

    .content {
      .progress-bar {
        margin-bottom: 5px;
      }

      &.horizontal {
        // When horizontal, put the number before the graph
        align-items: center;
        direction: rtl;
        display: flex;

        > * {
          direction: ltr;
        }

        .progress-bar {
          margin-bottom: 0;
          margin-left: 10px;
        }
      }
    }
  }
</style>
