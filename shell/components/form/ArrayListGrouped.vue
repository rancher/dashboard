<script>
import ArrayList from '@shell/components/form/ArrayList';
import InfoBox from '@shell/components/InfoBox';
import { _EDIT, _VIEW } from '@shell/config/query-params';

export default {
  name:       'ArrayListGrouped',
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
     * Start with empty row
     */
    initialEmptyRow: {
      type:    Boolean,
      default: false,
    },

    /**
     * Form mode for the component
     */
    mode: {
      type:    String,
      default: _EDIT,
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },
  },

  emits: ['update:value', 'add', 'remove'],

  computed: {
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
    },
  }
};
</script>

<template>
  <ArrayList
    class="array-list-grouped"
    :value="value"
    v-bind="$attrs"
    :add-allowed="canAdd && !isView"
    :mode="mode"
    :initial-empty-row="initialEmptyRow"
    @update:value="$emit('update:value', $event)"
    @add="$emit('add')"
    @remove="$emit('remove', $event)"
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
        :data-testid="`remove-item-${scope.i}`"
        @click="scope.remove"
      >
        <i class="icon icon-x" />
      </button>
      <span v-else />
    </template>
    <!-- Pass down templates provided by the caller -->
    <template
      v-for="(_, slot) of $slots"
      #[slot]="scope"
      :key="slot"
    >
      <template v-if="typeof $slots[slot] === 'function'">
        <slot
          :name="slot"
          v-bind="scope"
        />
      </template>
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

        top: 0;
        right: 0;
      }

      & > .info-box {
        margin-bottom: 0;
        padding-right: 25px;
      }
    }
}

</style>
