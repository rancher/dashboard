<script>
import ProgressBarMulti from '@/components/ProgressBarMulti';
import { removeObject } from '@/utils/array';
import { ucFirst } from '@/utils/string';

export default {
  components: { ProgressBarMulti },

  props: {
    row: {
      type:     Object,
      required: true
    },
  },

  computed: {
    summary() {
      return this.row.status?.summary || {};
    },

    showHover() {
      return true;
    },

    stateParts() {
      const keys = Object.keys(this.summary);

      removeObject(keys, 'desiredReady');

      return keys.map((key) => {
        return {
          label:     ucFirst(key),
          color:     'bg-success',
          textColor: 'text-success',
          value:      this.summary[key]
        };
      });
    }
  },
};
</script>

<template>
  <v-popover
    class="text-center"
    :class="{'hand': showHover}"
    placement="top"
    :open-group="row.id"
    :trigger="showHover ? 'click' : 'manual'"
    offset="1"
  >
    <ProgressBarMulti :values="stateParts" class="mb-5" />
    <span>{{ summary.ready }}</span>
    <span v-if="summary.desiredReady != summary.ready">
      <i class="icon icon-chevron-right" />
      {{ summary.desired }}
    </span>

    <template #popover>
      <table v-if="showHover" class="fixed">
        <tbody>
          <tr v-for="obj in stateParts" :key="obj.label">
            <td :class="{'text-left': true, [obj.textColor]: true}">
              {{ obj.label }}
            </td>
            <td class="text-right">
              {{ obj.value }}
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </v-popover>
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
