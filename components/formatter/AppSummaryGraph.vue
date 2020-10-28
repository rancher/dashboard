<script>
import ProgressBarMulti from '@/components/ProgressBarMulti';
import { ucFirst } from '@/utils/string';
import { colorForState, stateDisplay, stateSort } from '@/plugins/steve/resource-instance';
import { sortBy } from '@/utils/sort';

export default {
  components: { ProgressBarMulti },

  props: {
    row: {
      type:     Object,
      required: true
    },
  },

  computed: {
    show() {
      return this.stateParts.length > 0;
    },

    stateParts() {
      const out = {};

      for ( const r of this.row.deployedResources ) {
        const textColor = colorForState(r.state, r.error, r.transitioning);
        const state = stateDisplay(r.state);
        const key = `${ textColor }/${ state }`;

        if ( out[key] ) {
          out[key].value = out[key].value + 1;
        } else {
          out[key] = {
            key,
            label:     state,
            color:     textColor.replace(/text-/, 'bg-'),
            textColor,
            value:     1,
            sort:      stateSort(textColor, state),
          };
        }
      }

      return sortBy(Object.values(out), 'sort:desc');
    }
  },
};
</script>

<template>
  <v-popover
    v-if="show"
    class="text-center hand"
    placement="top"
    :open-group="row.id"
    :trigger="show ? 'click' : 'manual'"
    offset="1"
  >
    <ProgressBarMulti :values="stateParts" class="mb-5" />
    <span>{{ row.deployedResources.length }}</span>

    <template #popover>
      <table v-if="show" class="fixed">
        <tbody>
          <tr v-for="obj in stateParts" :key="obj.key">
            <td class="text-left pr-20" :class="{[obj.textColor]: true}">
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
  <div v-else class="text-center text-muted">
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
