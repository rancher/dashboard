<script>
import ProgressBarMulti from '@/components/ProgressBarMulti';

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

  methods:  {
    scaleDown() {
      this.row.scaleDown();
    },

    scaleUp() {
      this.row.scaleUp();
    },
  }
};
</script>

<template>
  <v-popover trigger="hover" offset="1">
    <span>
      <ProgressBarMulti v-if="row.complexScale" :values="row.scaleParts" />
      <p v-else class="scale">
        <span v-if="!row.scales.current">?</span>
        <span v-else-if="row.showReadyScale">
          {{ row.status.scaleStatus.ready }} <i class="icon icon-chevron-right" />
        </span>
        {{ row.scales.desired }}
      </p>
    </span>

    <template slot="popover">
      <button class="btn btn-sm bg-primary scale-btn" @click="scaleDown">
        <i class="icon icon-minus" />
      </button>
      <button class="btn btn-sm bg-primary scale-btn" @click="scaleUp">
        <i class="icon icon-plus" />
      </button>
      <table v-if="row.complexScale" class="fixed">
        <tbody>
          <tr v-for="obj in row.scaleParts" :key="obj.label">
            <td :class="{'text-left': true, [obj.textColor]: true}">
              {{ obj.label }}>
            </td>
            <td class="text-right">
              {{ obj.value }}>
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
      cursor: pointer;
    }
  }

  .scale {
    margin: 0;
    padding: 0;
  }

</style>
