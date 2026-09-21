<script>
import { RadioGroup } from '@components/Form/Radio';
import { downloadFile } from '@shell/utils/download';
import { escapeHtml } from '@shell/utils/string';
import { exportColumnsFor, rowsToCsv, rowsToJson } from '@shell/utils/table-views';

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

    /**
     * The columns to write for a selection: the ones this resource's table shows.
     *
     * Taken from the type rather than from the table on screen - the action is dispatched by the
     * resource and never learns which table it was picked in. A view that has hidden or added
     * columns is therefore not reflected here, only the type's own set.
     */
    selectionColumns() {
      const first = this.resources[0];
      const schema = first?.schema;

      if (!schema) {
        return [];
      }

      // Server side pagination gives a type its own set of columns, and the table on screen is
      // showing whichever set applies - asking for the other one puts a column in the file that
      // is not in the table, or leaves one out
      const paginated = !!first.$ctx?.getters?.paginationEnabled?.({ id: first.type });
      const headers = this.$store.getters['type-map/headersFor'](schema, paginated);

      return exportColumnsFor(headers, (key) => this.t(key));
    },

    title() {
      return this.isSelection ? this.t('tableViews.export.selectionTitle') : this.t('tableViews.export.title');
    },

    intro() {
      if (this.isSelection) {
        return this.t('tableViews.export.selectionIntro', { count: this.count }, true);
      }

      // The sentence around it is markup, so it is rendered as html - but the name is a name the
      // user typed, not markup, and a view called `<b>live</b>` should read as its own name
      return this.t('tableViews.export.intro', { count: this.count, name: escapeHtml(this.viewName) }, true);
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
     * The export for resources that arrived without a table behind them.
     *
     * YAML is the resources themselves. The other two are the columns the resource's own table
     * shows, written by the same code the toolbar's export uses - a selection exported from an
     * action and a view exported from the toolbar should not disagree about what a row is.
     */
    async exportResources() {
      const items = this.resources;
      const first = items[0];

      if (this.format === 'yaml') {
        return items.length === 1 ? first.downloadYaml() : first.downloadYamlBulk(items);
      }

      const columns = this.selectionColumns;
      const name = (first?.type || 'resources').replace(/[^a-z0-9]+/gi, '-');

      if (this.format === 'json') {
        return downloadFile(`${ name }.json`, rowsToJson(items, columns), 'application/json;charset=utf-8');
      }

      return downloadFile(`${ name }.csv`, rowsToCsv(items, columns), 'text/csv;charset=utf-8');
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
