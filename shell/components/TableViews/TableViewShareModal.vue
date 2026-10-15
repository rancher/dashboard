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
import { RcModal } from '@components/RcModal';
import { useI18n } from '@shell/composables/useI18n';
import { importTableView, sharedTableType } from '@shell/utils/table-views/share';
import type { SharedTableView } from '@shell/utils/table-views/share';

// i18n-uses tableViews.share.*, tableViews.import.*

const props = withDefaults(defineProps<{
  /** `show` and the close handler, from the table that opens it */
  modal: { show: boolean, onClose:() => void },
  mode: 'share' | 'import',
  /** The view as text, to share */
  value?: string,
  /** The table an imported view is for - see sharedTableKey */
  tableKey?: string,
  /** Imported into a view added for it, rather than over one's settings */
  intoNewView?: boolean,
  /** The shared view has a filter, whose names and values the text gives away */
  hasFilter?: boolean,
}>(), {
  value:       '',
  tableKey:    '',
  intoNewView: false,
  hasFilter:   false,
});

const emit = defineEmits<{
  import: [view: SharedTableView],
}>();

const store = useStore();
const { t } = useI18n(store);

const fieldId = useId();

const pasted = ref('');

const sharing = computed(() => props.mode === 'share');

const introKey = computed(() => {
  if (sharing.value) {
    return 'tableViews.share.intro';
  }

  return props.intoNewView ? 'tableViews.import.introNew' : 'tableViews.import.intro';
});

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
    props.modal.onClose();
  }
};
</script>

<template>
  <RcModal
    v-bind="modal"
    :title="t(`tableViews.${ mode }.title`)"
    class="share-modal"
    :data-testid="`table-views-${ mode }-modal`"
  >
    <RichTranslation
      :k="introKey"
      tag="p"
      class="share-intro"
    >
      <template #b="{ content }">
        <b v-clean-html="content" />
      </template>
    </RichTranslation>
    <p
      v-if="sharing && hasFilter"
      data-testid="table-views-share-warning"
    >
      {{ t('tableViews.filterWarning', undefined, true) }}
    </p>
    <DetailText
      v-if="sharing"
      :label="t('tableViews.share.label')"
      :value="value"
      :max-length="Infinity"
      data-testid="table-views-share-text"
    />
    <div v-else>
      <DetailText
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

    <template
      v-if="sharing"
      #actions="{ close }"
    >
      <RcButton
        variant="primary"
        size="large"
        data-testid="table-views-share-close"
        @click="close"
      >
        {{ t('generic.close') }}
      </RcButton>
    </template>
    <template
      v-else
      #primary-action
    >
      <RcButton
        variant="primary"
        size="large"
        :disabled="!canImport"
        data-testid="table-views-import-confirm"
        @click="doImport"
      >
        {{ t('tableViews.import.import') }}
      </RcButton>
    </template>
  </RcModal>
</template>

<style lang="scss" scoped>
.share-intro b {
  font-weight: 600;
}

.share-problem {
  margin: 8px 0 0 0;
}
</style>
