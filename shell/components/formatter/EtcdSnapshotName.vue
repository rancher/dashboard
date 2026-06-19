<script>
import { get } from '@shell/utils/object';

export default {
  props: {
    value: {
      type:    String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:    Object,
      default: () => {}
    },
    reference: {
      type:    String,
      default: null,
    },
    getCustomDetailLink: {
      type:    Function,
      default: null
    }
  },

  computed: {
    to() {
      if (this.getCustomDetailLink) {
        return this.getCustomDetailLink(this.row);
      }
      if ( this.row && this.reference ) {
        return get(this.row, this.reference);
      }

      return this.row?.detailLocation;
    },

    showPredatesImportIcon() {
      return !!this.row?.isSnapshotTooOld;
    },

    predatesImportMessage() {
      return this.t('cluster.snapshot.predatesImportTooltip');
    },
  }
};
</script>

<template>
  <span>
    <router-link
      v-if="to"
      :to="to"
    >
      {{ value }}
    </router-link>
    <span v-else>
      {{ value }}
      <template v-if="!value && col.dashIfEmpty">
        <span class="text-muted">&mdash;</span>
      </template>
    </span>
    <i
      v-if="showPredatesImportIcon"
      v-clean-tooltip="{ content: predatesImportMessage, triggers: ['hover', 'touch', 'focus'] }"
      v-stripped-aria-label="predatesImportMessage"
      tabindex="0"
      class="icon icon-error text-error ml-5"
    />
  </span>
</template>
