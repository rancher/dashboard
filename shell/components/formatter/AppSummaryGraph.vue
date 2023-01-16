<script>
import ProgressBarMulti from '@shell/components/ProgressBarMulti';
import { colorForState, stateDisplay, stateSort } from '@shell/plugins/dashboard-store/resource-class';
import { sortBy } from '@shell/utils/sort';

export default {
  components: { ProgressBarMulti },

  props: {
    row: {
      type:     Object,
      required: true
    },

    labelKey: {
      type:    String,
      default: null
    },

    linkTo: {
      type:    Object,
      default: null
    }
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
          out[key].value += 1;
        } else {
          out[key] = {
            key,
            label: state,
            color: textColor.replace(/text-/, 'bg-'),
            textColor,
            value: 1,
            sort:  stateSort(textColor, state),
          };
        }
      }

      return sortBy(Object.values(out), 'sort:desc');
    },

    colorParts() {
      const out = {};

      for ( const p of this.stateParts ) {
        if ( out[p.color] ) {
          out[p.color].value += 1;
        } else {
          out[p.color] = {
            color: p.color,
            value: p.value,
            sort:  p.sort,
          };
        }
      }

      return sortBy(Object.values(out), 'sort:desc');
    },

    displayLabel() {
      const count = this.row?.deployedResources?.length || 0;

      if ( this.labelKey ) {
        return this.t(this.labelKey, { count });
      }

      return `${ count }`;
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
    <ProgressBarMulti
      :values="colorParts"
      class="mb-5"
    />
    <n-link
      v-if="linkTo"
      :to="linkTo"
    >
      {{ displayLabel }}
    </n-link>
    <span v-else>{{ displayLabel }}</span>

    <template #popover>
      <table
        v-if="show"
        class="fixed"
      >
        <tbody>
          <tr
            v-for="obj in stateParts"
            :key="obj.key"
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
  </v-popover>
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
