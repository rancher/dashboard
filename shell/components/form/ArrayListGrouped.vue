<script>
import { mapGetters } from 'vuex';
import ArrayList from '@shell/components/form/ArrayList';
import InfoBox from '@shell/components/InfoBox';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { RcSection, RcSectionActions } from '@components/RcSection';

export default {
  name:       'ArrayListGrouped',
  components: {
    ArrayList, InfoBox, RcSection, RcSectionActions
  },
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

    /**
     * Use the RcSection/RcButton components in place of the legacy
     * InfoBox/`btn` markup for the group container, add and remove buttons
     */
    useRc: {
      type:    Boolean,
      default: false,
    },
  },

  emits: ['update:value', 'add', 'remove'],

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

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
    :use-rc-button="useRc"
    :add-icon="useRc ? 'icon-plus' : ''"
    @update:value="$emit('update:value', $event)"
    @add="$emit('add')"
    @remove="$emit('remove', $event)"
  >
    <template v-slot:columns="scope">
      <RcSection
        v-if="useRc"
        type="secondary"
        :mode="canRemoveRow(scope.row, scope.i) ? 'with-header' : 'no-header'"
        :expandable="false"
      >
        <div>
          <slot v-bind="scope" />
        </div>
        <template
          v-if="canRemoveRow(scope.row, scope.i)"
          #actions
        >
          <RcSectionActions
            :actions="[{ icon: 'trash', ariaLabel: t('generic.ariaLabel.remove', { index: scope.i }), action: scope.remove }]"
            :data-testid="`remove-item-${scope.i}`"
          />
        </template>
      </RcSection>
      <InfoBox v-else>
        <slot v-bind="scope" />
      </InfoBox>
    </template>
    <template v-slot:remove-button="scope">
      <!-- when useRc is set the remove action is rendered in the RcSection header instead -->
      <button
        v-if="!useRc && canRemoveRow(scope.row, scope.i)"
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
