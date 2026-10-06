<script setup lang="ts">
/**
 * Asks what to export as. From the toolbar the table does the writing; from a resource action the
 * resources come in as a prop and are written here
 */
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import { RadioGroup } from '@components/Form/Radio';
import RichTranslation from '@shell/components/RichTranslation.vue';
import { RcButton } from '@components/RcButton';
import { RcHeading } from '@components/RcHeading';
import { downloadFile } from '@shell/utils/download';
import { escapeHtml } from '@shell/utils/string';
import { exportColumnsFor, rowsToCsv, rowsToJson } from '@shell/utils/table-views/export';
import { useI18n } from '@shell/composables/useI18n';
import type { TableViewRow } from '@shell/types/table-views';

const FORMATS = ['yaml', 'json', 'csv'] as const;

/** An "all matching" export fetches this many at a time, so past it there is more than one request */
const SLOW_EXPORT_ROWS = 1000;

type Format = typeof FORMATS[number];

interface ExportResource extends TableViewRow {
  type: string;
  schema?: object;
  $ctx?: { getters?: { paginationEnabled?: (args: { id: string }) => boolean } };
  downloadYaml(): Promise<unknown>;
  downloadYamlBulk(items: ExportResource[]): Promise<unknown>;
}

const props = withDefaults(defineProps<{
  /** null when the api couldn't count the view's query */
  count?: number | null,
  viewName?: string,
  isSelection?: boolean,
  /** From a resource action; empty when the table is driving */
  resources?: ExportResource[],
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

/** A resource action wants the resources as held (YAML); a view is exported as a spreadsheet */
const format = ref<Format>(props.isSelection ? 'yaml' : 'csv');

const formatOptions = computed(() => FORMATS.map((f) => ({ value: f, label: t(`tableViews.export.format.${ f }`) })));

/** The type's own columns: a resource action never learns which table it was picked in */
const selectionColumns = computed(() => {
  const first = props.resources[0];
  const schema = first?.schema;

  if (!schema) {
    return [];
  }

  // Paginated lists have their own column set, so ask for the one the table is showing
  const paginated = !!first.$ctx?.getters?.paginationEnabled?.({ id: first.type });
  const headers = store.getters['type-map/headersFor'](schema, paginated);

  return exportColumnsFor(headers, (key: string) => t(key));
});

const title = computed(() => (props.isSelection ? t('tableViews.export.selectionTitle') : t('tableViews.export.title')));

const intro = computed(() => {
  const slow = (props.count ?? 0) > SLOW_EXPORT_ROWS;

  if (props.isSelection) {
    return { k: slow ? 'tableViews.export.selectionIntroSlow' : 'tableViews.export.selectionIntro', args: { count: props.count } };
  }

  // The name is text the user typed, not markup
  const name = escapeHtml(props.viewName);

  if (props.count === null) {
    return { k: 'tableViews.export.introUncounted', args: { name } };
  }

  return { k: slow ? 'tableViews.export.introSlow' : 'tableViews.export.intro', args: { count: props.count, name } };
});

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
    <div class="export-content">
      <RcHeading
        :size="3"
        class="export-title"
        data-modal-title
      >
        {{ title }}
      </RcHeading>

      <RichTranslation
        :k="intro.k"
        :args="intro.args"
        tag="p"
        class="export-intro"
      >
        <template #b="{ content }">
          <b v-clean-html="content" />
        </template>
      </RichTranslation>
      <RichTranslation
        k="tableViews.export.choose"
        tag="p"
        class="export-choose"
      >
        <template #b="{ content }">
          <b v-clean-html="content" />
        </template>
      </RichTranslation>

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
        size="large"
        data-testid="table-views-export-cancel"
        @click="emit('close')"
      >
        {{ t('generic.cancel') }}
      </RcButton>
      <RcButton
        variant="primary"
        size="large"
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
  gap: 40px;
  padding: 24px;
  min-width: 540px;
  max-width: 860px;

  .export-content,
  .export-actions {
    align-self: stretch;
  }

  .export-title {
    margin: 0 0 16px 0;
    font-weight: 600;
  }

  .export-intro b,
  .export-choose b {
    font-weight: 600;
  }

  .export-intro {
    margin-bottom: 16px;
    line-height: 20px;
  }

  .export-choose {
    margin-bottom: 16px;
  }

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
