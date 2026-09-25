<script setup lang="ts">
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
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import { RadioGroup } from '@components/Form/Radio';
import { RcButton } from '@components/RcButton';
import { downloadFile } from '@shell/utils/download';
import { escapeHtml } from '@shell/utils/string';
import { exportColumnsFor, rowsToCsv, rowsToJson } from '@shell/utils/table-views/export';
import { useI18n } from '@shell/composables/useI18n';

/** The formats a selection or a view can be written out as */
const FORMATS = ['yaml', 'json', 'csv'] as const;

type Format = typeof FORMATS[number];

const props = withDefaults(defineProps<{
  /** How many rows are being exported */
  count?: number,
  /** The view being exported, for the sentence naming it */
  viewName?: string,
  /**
   * Whether this was opened for a selection rather than for a whole view, which is the only
   * thing that changes what the modal says
   */
  isSelection?: boolean,
  /**
   * The resources to export. Handed over by the modal manager when a resource action opened
   * this; empty when the table is driving, because then the table has them.
   */
  resources?: any[],
}>(), {
  count:       0,
  viewName:    '',
  isSelection: false,
  resources:   () => [],
});

const emit = defineEmits<{
  close: [],
  export: [format: Format],
}>();

const store = useStore();
const { t } = useI18n(store);

/**
 * Whichever format the way in was already for.
 *
 * Export As... is the action that used to be Download YAML, reached from a row or from a
 * selection of them, and what is wanted there is the resources as the cluster holds them.
 * Exporting a whole view is the other way round: that is the table as it is being read, so it
 * comes out as a spreadsheet.
 */
const format = ref<Format>(props.isSelection ? 'yaml' : 'csv');

const formatOptions = computed(() => FORMATS.map((f) => ({ value: f, label: t(`tableViews.export.format.${ f }`) })));

/**
 * The columns to write for a selection: the ones this resource's table shows.
 *
 * Taken from the type rather than from the table on screen - the action is dispatched by the
 * resource and never learns which table it was picked in. A view that has hidden or added
 * columns is therefore not reflected here, only the type's own set.
 */
const selectionColumns = computed(() => {
  const first = props.resources[0];
  const schema = first?.schema;

  if (!schema) {
    return [];
  }

  // Server side pagination gives a type its own set of columns, and the table on screen is
  // showing whichever set applies - asking for the other one puts a column in the file that is
  // not in the table, or leaves one out
  const paginated = !!first.$ctx?.getters?.paginationEnabled?.({ id: first.type });
  const headers = store.getters['type-map/headersFor'](schema, paginated);

  return exportColumnsFor(headers, (key: string) => t(key));
});

const title = computed(() => (props.isSelection ? t('tableViews.export.selectionTitle') : t('tableViews.export.title')));

const intro = computed(() => {
  if (props.isSelection) {
    return t('tableViews.export.selectionIntro', { count: props.count }, true);
  }

  // The sentence around it is markup, so it is rendered as html - but the name is a name the user
  // typed, not markup, and a view called `<b>live</b>` should read as its own name
  return t('tableViews.export.intro', { count: props.count, name: escapeHtml(props.viewName) }, true);
});

/**
 * The export for resources that arrived without a table behind them.
 *
 * YAML is the resources themselves. The other two are the columns the resource's own table shows,
 * written by the same code the toolbar's export uses - a selection exported from an action and a
 * view exported from the toolbar should not disagree about what a row is.
 */
const exportResources = async() => {
  const items = props.resources;
  const first = items[0];

  if (format.value === 'yaml') {
    return items.length === 1 ? first.downloadYaml() : first.downloadYamlBulk(items);
  }

  const columns = selectionColumns.value;
  const name = (first?.type || 'resources').replace(/[^a-z0-9]+/gi, '-');

  if (format.value === 'json') {
    return downloadFile(`${ name }.json`, rowsToJson(items, columns), 'application/json;charset=utf-8');
  }

  return downloadFile(`${ name }.csv`, rowsToCsv(items, columns), 'text/csv;charset=utf-8');
};

const download = async() => {
  if (props.resources.length) {
    await exportResources();
  } else {
    emit('export', format.value);
  }

  emit('close');
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
      <RcButton
        variant="link"
        data-testid="table-views-export-cancel"
        @click="emit('close')"
      >
        {{ t('generic.cancel') }}
      </RcButton>
      <!-- `left-icon` rather than an `<i>` of its own: the button places and sizes the mark
           against its own label, which is what keeps every button in the product carrying one
           the same way. -->
      <RcButton
        variant="primary"
        left-icon="download"
        data-testid="table-views-export-download"
        @click="download"
      >
        {{ t('tableViews.export.download') }}
      </RcButton>
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
