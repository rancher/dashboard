<script>
import AppModal from '@shell/components/AppModal.vue';
import { Checkbox } from '@components/Form/Checkbox';

/** The formats a view can be written out as */
const FORMATS = ['csv', 'json'];

/**
 * Asks what to write the current view out as.
 *
 * Every format ticked is downloaded as its own file, so someone can take the same rows away as
 * both a spreadsheet and something to feed a script.
 */
export default {
  name: 'TableViewExportModal',

  emits: ['close', 'export'],

  components: { AppModal, Checkbox },

  props: {
    /** How many rows the view matches */
    count: {
      type:    Number,
      default: 0
    },

    /** Plural display name of what is being exported, eg "clusters" */
    resourceLabel: {
      type:    String,
      default: ''
    },

    /** The view being exported, for the sentence naming it */
    viewName: {
      type:    String,
      default: ''
    },
  },

  data() {
    return { formats: { csv: false, json: true } };
  },

  computed: {
    availableFormats() {
      return FORMATS;
    },

    chosen() {
      return FORMATS.filter((format) => this.formats[format]);
    },

    /** "2 matching clusters", or just "2 matching rows" when the type has no name to use */
    countLabel() {
      if (this.resourceLabel) {
        return this.t('tableViews.export.resources', { count: this.count, type: this.resourceLabel });
      }

      return this.t('tableViews.export.rows', { count: this.count });
    },

    intro() {
      return this.t('tableViews.export.intro', { count: this.countLabel, name: this.viewName }, true);
    },
  },

  methods: {
    download() {
      if (!this.chosen.length) {
        return;
      }

      this.$emit('export', this.chosen);
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

      <div class="export-formats">
        <Checkbox
          v-for="format in availableFormats"
          :key="format"
          v-model:value="formats[format]"
          :label="t(`tableViews.export.format.${ format }`)"
          :data-testid="`table-views-export-format-${ format }`"
        />
      </div>

      <div class="export-actions">
        <button
          type="button"
          class="btn role-secondary"
          data-testid="table-views-export-cancel"
          @click="$emit('close')"
        >
          {{ t('generic.cancel') }}
        </button>
        <button
          type="button"
          class="btn role-primary"
          :disabled="!chosen.length"
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
