<script>
import ProgressBarMulti from '@shell/components/ProgressBarMulti';

export default {
  components: { ProgressBarMulti },

  props: {
    row: {
      type:     Object,
      required: true
    },

    col: {
      type:    Object,
      default: null
    }
  },

  computed: {
    canAdjust() {
      const row = this.row;

      if ( !row.scales ) {
        return false;
      }

      if ( row.scales.global || row.scales.auto ) {
        return false;
      }

      return true;
    },

    showHover() {
      return this.row.complexScale || this.canAdjust;
    }
  },

  methods: {
    scaleDown() {
      this.row.scaleDown();
    },

    scaleUp() {
      this.row.scaleUp();
    },
  },
};
</script>

<template>
  <v-popover
    :class="{'hand': showHover}"
    placement="top"
    :open-group="row.id"
    :trigger="showHover ? 'click' : 'manual'"
    offset="1"
  >
    <span>
      <ProgressBarMulti
        v-if="row.complexScale"
        :values="row.scaleParts"
      />
      <p
        v-if="row.scales && row.scales.global"
        class="scale"
      >Global</p>
      <span
        v-else
        class="scale"
      >
        {{ row.scales.current }}
        <div
          v-if="row.scales.auto"
          class="text-small text-muted"
        >
          ({{ row.scales.desired }})
        </div>
        <span v-else-if="row.showDesiredScale">
          <i class="icon icon-chevron-right" />
          {{ row.scales.desired }}
        </span>
      </span>
    </span>

    <template #popover>
      <div
        v-if="canAdjust"
        class="text-center pb-5"
      >
        <button
          type="button"
          class="btn btn-sm bg-primary scale-btn"
          @click="scaleDown"
        >
          <i class="icon icon-minus" />
        </button>
        <button
          type="button"
          class="btn btn-sm bg-primary scale-btn"
          @click="scaleUp"
        >
          <i class="icon icon-plus" />
        </button>
      </div>
      <table
        v-if="row.complexScale"
        class="fixed"
      >
        <tbody>
          <tr
            v-for="obj in row.scaleParts"
            :key="obj.label"
          >
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
