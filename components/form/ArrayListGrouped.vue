<script>
import ArrayList from '@/components/form/ArrayList';
import InfoBox from '@/components/InfoBox';
import { _VIEW } from '@/config/query-params';

export default {
  components: { ArrayList, InfoBox },
  props:      {
    canRemove: {
      type:    [Boolean, Function],
      default: true,
    }
  },

  computed:   {
    isDisabled() {
      return this.$attrs.mode === _VIEW;
    }
  },

  methods: {
    canRemoveRow(row, idx) {
      if ( this.isDisabled ) {
        return false;
      }

      if ( typeof this.canRemove === 'function' ) {
        return this.canRemove(row, idx);
      }

      return this.canRemove;
    }
  }
};
</script>

<template>
  <ArrayList class="array-list-grouped" v-bind="$attrs" @input="$emit('input', $event)" @add="$emit('add')">
    <template v-slot:columns="scope">
      <InfoBox>
        <slot v-bind="scope" />
      </InfoBox>
    </template>
    <template v-slot:remove-button="scope">
      <button v-if="canRemoveRow(scope.row, scope.i)" type="button" class="btn role-link close" @click="scope.remove">
        <i class="icon icon-2x icon-x" />
      </button>
      <span v-else></span>
    </template>
    <!-- Pass down templates provided by the caller -->
    <template v-for="(_, slot) of $scopedSlots" v-slot:[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </ArrayList>
</template>

<style lang="scss">
.array-list-grouped {
    & > .box {
      position: relative;
      display: block;

      & > .remove {
        position: absolute;

        padding: 0px;

        top: 0;
        right: 0;
      }

      & > .info-box {
        margin-bottom: 0;
      }
    }
}
</style>
