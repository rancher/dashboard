<script>
import AppModal from '@shell/components/AppModal.vue';
import { RadioGroup } from '@components/Form/Radio';

/** The formats a view can be written out as */
const FORMATS = ['yaml', 'json', 'csv'];

/**
 * Asks what to write the current view out as.
 *
 * Every format ticked is downloaded as its own file, so someone can take the same rows away as
 * both a spreadsheet and something to feed a script.
 */
export default {
  name: 'TableViewExportModal',

  emits: ['close', 'export'],

  components: { AppModal, RadioGroup },

  props: {
    /** How many rows the view matches */
    count: {
      type:    Number,
      default: 0
    },

    /** The view being exported, for the sentence naming it */
    viewName: {
      type:    String,
      default: ''
    },
  },

  data() {
    return { format: 'csv' };
  },

  computed: {
    formatOptions() {
      return FORMATS.map((format) => ({ value: format, label: this.t(`tableViews.export.format.${ format }`) }));
    },

    intro() {
      return this.t('tableViews.export.intro', { count: this.count, name: this.viewName }, true);
    },
  },

  methods: {
    download() {
      this.$emit('export', this.format);
    },
  }
};
</script>

<template>
  <app-modal
    name="tableViewsExportModal"
    :width="640"
    styles="min-width: 540px;max-width: 860px"
    height="auto"
    :trigger-focus-trap="true"
    data-testid="table-views-export-modal"
    @close="$emit('close')"
  >
    <div class="export-modal">
      <!-- What the modal says, and what it offers to do about it: the two blocks the layout's gap
           sits between. The spacing within each is its own. -->
      <div class="export-content">
        <h4>{{ t('tableViews.export.title') }}</h4>

        <p
          v-clean-html="intro"
          class="export-intro"
        />
        <p
          v-clean-html="t('tableViews.export.choose', {}, true)"
          class="export-choose"
        />

        <RadioGroup
          v-model:value="format"
          name="table-views-export-format"
          class="export-formats"
          :options="formatOptions"
          :row="true"
          :aria-label="t('tableViews.export.title')"
          data-testid="table-views-export-formats"
        />
      </div>

      <div class="export-actions">
        <button
          type="button"
          class="btn role-link"
          data-testid="table-views-export-cancel"
          @click="$emit('close')"
        >
          {{ t('generic.cancel') }}
        </button>
        <button
          type="button"
          class="btn role-primary"
          data-testid="table-views-export-download"
          @click="download"
        >
          {{ t('tableViews.export.download') }}
        </button>
      </div>
    </div>
  </app-modal>
</template>

<style lang="scss" scoped>
.export-modal {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  // Between the content and the actions, which are this column's only two children
  gap: 40px;
  padding: 24px;

  // Both run the width of the modal, so the actions can sit against its right hand edge
  .export-content,
  .export-actions {
    align-self: stretch;
  }

  h4 {
    margin: 0 0 16px 0;
    font-size: 18px;
  }

  .export-intro {
    margin-bottom: 16px;
    line-height: 20px;
  }

  .export-choose {
    margin-bottom: 16px;
  }

  // Spacing between the options is RadioGroup's own - `row` already lays them out. What follows
  // the options is the column's gap.
  .export-formats {
    margin-bottom: 0;
  }

  .export-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
  }
}
</style>
