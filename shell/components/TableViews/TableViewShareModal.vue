<script setup lang="ts">
/**
 * Share View and Import View: a table's view as text, to copy out or to paste in. Both show it in the
 * same DetailText box, with Copy on one and Paste on the other, laid out as the export modal is
 */
import { computed, ref, useId } from 'vue';
import { useStore } from 'vuex';

import DetailText from '@shell/components/DetailText.vue';
import RichTranslation from '@shell/components/RichTranslation.vue';
import { RcButton } from '@components/RcButton';
import { RcHeading } from '@components/RcHeading';
import { useI18n } from '@shell/composables/useI18n';
import { importTableView, sharedTableType } from '@shell/utils/table-views/share';
import type { SharedTableView } from '@shell/utils/table-views/share';

// i18n-uses tableViews.share.*, tableViews.import.*

const props = withDefaults(defineProps<{
  mode: 'share' | 'import',
  /** The view as text, to share */
  value?: string,
  /** The table an imported view is for - see sharedTableKey */
  tableKey?: string,
}>(), {
  value:    '',
  tableKey: '',
});

const emit = defineEmits<{
  close: [],
  import: [view: SharedTableView],
}>();

const store = useStore();
const { t } = useI18n(store);

const fieldId = useId();

const pasted = ref('');

const sharing = computed(() => props.mode === 'share');

const imported = computed(() => (sharing.value ? null : importTableView(pasted.value, props.tableKey)));

/** Said once something is in the box: the text isn't a view, or is one for another table */
const problem = computed(() => {
  const result = imported.value;

  if (!result || !('problem' in result) || !pasted.value.trim()) {
    return '';
  }

  // Raw, as it is shown as text: escaped, an apostrophe would read as &#39;
  if (result.problem === 'invalid') {
    return t('tableViews.import.invalid', undefined, true);
  }

  const type = sharedTableType(result.tableKey);
  const schema = store.getters['cluster/schemaFor']?.(type) || store.getters['management/schemaFor']?.(type) || { id: type };
  const list = store.getters['type-map/labelFor'](schema, 2);

  // The same type kept by another page, eg the clusters on Home and in Cluster Management
  return t(type === sharedTableType(props.tableKey) ? 'tableViews.import.otherPage' : 'tableViews.import.otherTable', { list }, true);
});

const canImport = computed(() => !!imported.value && 'view' in imported.value);

const doImport = () => {
  const result = imported.value;

  if (result && 'view' in result) {
    emit('import', result.view);
    emit('close');
  }
};
</script>

<template>
  <div
    class="share-modal"
    :data-testid="`table-views-${ mode }-modal`"
  >
    <div class="share-content">
      <RcHeading
        :size="3"
        class="share-title"
        data-modal-title
      >
        {{ t(`tableViews.${ mode }.title`) }}
      </RcHeading>
      <RichTranslation
        :k="`tableViews.${ mode }.intro`"
        tag="p"
        class="share-intro"
      >
        <template #b="{ content }">
          <b v-clean-html="content" />
        </template>
      </RichTranslation>
      <DetailText
        v-if="sharing"
        :label="t('tableViews.share.label')"
        :value="value"
        :max-length="Infinity"
        data-testid="table-views-share-text"
      />
      <DetailText
        v-else
        v-model:value="pasted"
        :label="t('tableViews.share.label')"
        :copy="false"
        editable
        paste
        :placeholder="t('tableViews.import.placeholder')"
        :invalid="!!problem"
        :described-by="problem ? `${ fieldId }-problem` : undefined"
        data-testid="table-views-import-text"
      />
      <p
        v-if="problem"
        :id="`${ fieldId }-problem`"
        class="share-problem text-error"
        aria-live="polite"
        data-testid="table-views-import-problem"
      >
        {{ problem }}
      </p>
    </div>
    <div class="share-actions">
      <RcButton
        :variant="sharing ? 'primary' : 'link'"
        size="large"
        :data-testid="`table-views-${ mode }-close`"
        @click="emit('close')"
      >
        {{ t('generic.close') }}
      </RcButton>
      <RcButton
        v-if="!sharing"
        variant="primary"
        size="large"
        :disabled="!canImport"
        data-testid="table-views-import-confirm"
        @click="doImport"
      >
        {{ t('tableViews.import.import') }}
      </RcButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.share-modal {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 40px;
  padding: 24px;
  min-width: 540px;
  max-width: 860px;

  .share-content,
  .share-actions {
    align-self: stretch;
  }

  .share-title {
    margin: 0 0 16px 0;
    font-weight: 600;
  }

  .share-intro {
    margin-bottom: 16px;
    line-height: 20px;

    b {
      font-weight: 600;
    }
  }

  .share-problem {
    margin: 8px 0 0 0;
  }

  .share-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
  }
}
</style>
