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
    :width="560"
    height="auto"
    :trigger-focus-trap="true"
    data-testid="table-views-export-modal"
    @close="$emit('close')"
  >
    <div class="export-modal">
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
  padding: 24px;

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

  .export-formats {
    display: flex;
    align-items: center;
    gap: 32px;
    margin-bottom: 24px;
  }

  .export-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
  }
}
</style>
