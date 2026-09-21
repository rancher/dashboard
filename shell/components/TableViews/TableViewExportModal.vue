<script>
import { RadioGroup } from '@components/Form/Radio';
import { downloadFile } from '@shell/utils/download';

/** The formats a selection or a view can be written out as */
const FORMATS = ['yaml', 'json', 'csv'];

/**
 * Asks what to write the chosen resources out as.
 *
 * Opened two ways, and it has to serve both:
 *
 *  - from the toolbar, for everything a view matches. The table owns those rows and knows which
 *    columns are on show, so it is handed the format and does the writing.
 *  - from a resource's own actions, for whatever is selected. Nothing else there knows what was
 *    picked, so the resources come in as a prop and the export is done here.
 *
 * YAML means the same thing whichever way it was opened: the resources as the cluster holds them,
 * which is what the action formerly called Download YAML has always given.
 */
export default {
  name: 'TableViewExportModal',

  emits: ['close', 'export'],

  components: { RadioGroup },

  props: {
    /** How many rows are being exported */
    count: {
      type:    Number,
      default: 0
    },

    /** The view being exported, for the sentence naming it */
    viewName: {
      type:    String,
      default: ''
    },

    /**
     * Whether this was opened for a selection rather than for a whole view, which is the only
     * thing that changes what the modal says
     */
    isSelection: {
      type:    Boolean,
      default: false
    },

    /**
     * The resources to export. Handed over by the modal manager when a resource action opened
     * this; empty when the table is driving, because then the table has them.
     */
    resources: {
      type:    Array,
      default: () => []
    },
  },

  data() {
    return { format: 'csv' };
  },

  computed: {
    formatOptions() {
      return FORMATS.map((format) => ({ value: format, label: this.t(`tableViews.export.format.${ format }`) }));
    },

    title() {
      return this.isSelection ? this.t('tableViews.export.selectionTitle') : this.t('tableViews.export.title');
    },

    intro() {
      return this.isSelection ? this.t('tableViews.export.selectionIntro', { count: this.count }, true) : this.t('tableViews.export.intro', { count: this.count, name: this.viewName }, true);
    },
  },

  methods: {
    async download() {
      if (this.resources.length) {
        await this.exportResources();
      } else {
        this.$emit('export', this.format);
      }

      this.$emit('close');
    },

    /**
     * The export for resources that arrived without a table behind them. YAML is the resources
     * themselves; the other two are what can be said about them without a set of columns to go on.
     */
    async exportResources() {
      const items = this.resources;
      const first = items[0];

      if (this.format === 'yaml') {
        return items.length === 1 ? first.downloadYaml() : first.downloadYamlBulk(items);
      }

      const records = items.map((item) => ({
        name:      item.nameDisplay ?? item.metadata?.name ?? item.id,
        namespace: item.metadata?.namespace ?? '',
        type:      item.type ?? '',
        state:     item.stateDisplay ?? item.state ?? '',
        age:       item.creationTimestamp ?? item.metadata?.creationTimestamp ?? '',
      }));

      if (this.format === 'json') {
        return downloadFile('resources.json', JSON.stringify(records, null, 2), 'application/json;charset=utf-8');
      }

      const columns = Object.keys(records[0] || {});
      const escape = (value) => `"${ `${ value ?? '' }`.replace(/"/g, '""') }"`;
      const csv = [columns.join(','), ...records.map((r) => columns.map((c) => escape(r[c])).join(','))].join('\n');

      return downloadFile('resources.csv', csv, 'text/csv;charset=utf-8');
    },
  }
};
</script>

<template>
  <div
    class="export-modal"
    data-testid="table-views-export-modal"
  >
    <!-- What the modal says, and what it offers to do about it: the two blocks the layout's gap
         sits between. The spacing within each is its own. -->
    <div class="export-content">
      <h4>{{ title }}</h4>

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
        :aria-label="title"
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
</template>

<style lang="scss" scoped>
.export-modal {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  // Between the content and the actions, which are this column's only two children
  gap: 40px;
  padding: 24px;
  // The band the design gives the modal. The width itself is set on the modal around this.
  min-width: 540px;
  max-width: 860px;

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
