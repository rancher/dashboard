<script>
import ArrayList from '@shell/components/form/ArrayList';
import InfoBox from '@shell/components/InfoBox';
import { _EDIT, _VIEW } from '@shell/config/query-params';

export default {
  components: { ArrayList, InfoBox },
  props:      {
    /**
     * Allow to remove items by value or computation
     */
    canRemove: {
      type:    [Boolean, Function],
      default: true,
    },

    /**
     * Allow to extend list
     */
    canAdd: {
      type:    Boolean,
      default: true,
    },

    /**
     * Form mode for the component
     */
    mode: {
      type:    String,
      default: _EDIT,
    },
  },

  computed:   {
    isView() {
      return this.mode === _VIEW;
    }
  },

  methods: {
    /**
     * Verify if row can be removed by mode, function and declaration
     */
    canRemoveRow(row, idx) {
      if ( this.isView ) {
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
  <ArrayList
    class="array-list-grouped"
    v-bind="$attrs"
    :add-allowed="canAdd && !isView"
    :mode="mode"
    @input="$emit('input', $event)"
    @add="$emit('add')"
  >
    <template v-slot:columns="scope">
      <InfoBox>
        <slot v-bind="scope" />
      </InfoBox>
    </template>
    <template v-slot:remove-button="scope">
      <button
        v-if="canRemoveRow(scope.row, scope.i)"
        type="button"
        class="btn role-link close btn-sm"
        :data-testid="`remove-row-${scope.i}`"
        @click="scope.remove"
      >
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
