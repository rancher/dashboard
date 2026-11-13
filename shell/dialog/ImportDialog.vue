<script>
import { mapGetters } from 'vuex';
import { Banner } from '@components/Banner';
import { RcButton } from '@components/RcButton';
import { RcModal } from '@components/RcModal';
import YamlEditor from '@shell/components/YamlEditor';
import FileSelector from '@shell/components/form/FileSelector';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SortableTable from '@shell/components/SortableTable';
import { sortBy } from '@shell/utils/sort';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { NAMESPACE } from '@shell/config/types';
import { NAME as NAME_COL, TYPE, NAMESPACE as NAMESPACE_COL, AGE } from '@shell/config/table-headers';

export default {
  emits: ['onReadyYamlEditor'],

  // PromptModal also passes `resources`, and the header passes `cluster`, which this dialog doesn't use,
  // so keep stray attributes off RcModal's dialog element.
  inheritAttrs: false,

  components: {
    Banner,
    FileSelector,
    LabeledSelect,
    RcButton,
    RcModal,
    SortableTable,
    YamlEditor
  },

  props: {
    /**
     * `show` and the `close` handler, from whoever owns this dialog's visibility
     */
    modal: {
      type:     Object,
      required: true
    },

    defaultNamespace: {
      type:    String,
      default: undefined
    },
  },

  async fetch() {
    this.allNamespaces = (await this.$store.dispatch('cluster/findAll', { type: NAMESPACE, opt: { url: 'namespaces' } })) || [];

    if (this.selectedNamespace === undefined) {
      const defaultNamespace = 'default';
      const hasAccessToDefaultNamespace = this.allNamespaces.some((ns) => ns.name === defaultNamespace);

      this.selectedNamespace = hasAccessToDefaultNamespace ? defaultNamespace : this.allNamespaces[0]?.name;
    }
  },

  data() {
    return {
      currentYaml:       '',
      allNamespaces:     [],
      errors:            null,
      rows:              null,
      done:              false,
      importing:         false,
      selectedNamespace: this.defaultNamespace,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    namespaceOptions() {
      const out = this.allNamespaces.map((obj) => {
        return {
          label: obj.name,
          value: obj.name,
        };
      });

      return sortBy(out, 'label');
    },

    importDisabled() {
      return this.importing || !this.currentYaml.length;
    },

    headers() {
      return [
        TYPE,
        NAME_COL,
        NAMESPACE_COL,
        AGE
      ];
    },
  },

  methods: {
    close() {
      // Stay open while the import is in flight, so its outcome is never lost
      if (this.importing) {
        return;
      }

      this.modal.onClose();
    },

    onFileSelected(value) {
      const component = this.$refs.yamleditor;

      if (component) {
        this.errors = null;
        component.updateValue(value);
      }
    },

    async importYaml() {
      if (this.importDisabled) {
        return;
      }

      this.errors = [];
      this.importing = true;

      try {
        const res = await this.currentCluster.doAction('apply', {
          yaml:             this.currentYaml,
          defaultNamespace: this.selectedNamespace,
        });

        this.rows = res;
        this.done = true;
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
      } finally {
        this.importing = false;
      }
    },

    rowClick(e) {
      if ( e.target.tagName === 'A' ) {
        this.close();
      }
    },

    onReadyYamlEditor(arg) {
      this.$emit('onReadyYamlEditor', arg);
    }
  },
};
</script>

<template>
  <!-- Not v-bind="modal": closing goes through close(), which refuses while an import is in flight -->
  <RcModal
    :show="modal.show"
    size="large"
    :click-to-close="!importing"
    data-testid="import-yaml"
    @close="close"
    @primary-action="importYaml"
  >
    <template #title>
      <span
        v-if="done"
        data-testid="import-yaml-success"
      >
        {{ t('import.success', {count: rows.length}) }}
      </span>
      <template v-else>
        {{ t('import.title') }}
      </template>
    </template>

    <template v-if="!done">
      <Banner
        class="m-0"
        color="info"
        :label="t('import.instructions')"
      />
      <div class="import-controls">
        <FileSelector
          :aria-label="t('generic.readFromFileArea', { area: t('import.title') })"
          variant="secondary"
          :label="t('generic.readFromFile')"
          @selected="onFileSelected"
        />
        <div class="namespace">
          <label id="import-yaml-namespace-label">{{ t('import.namespace') }}</label>
          <LabeledSelect
            v-model:value="selectedNamespace"
            class="namespace-select"
            :options="namespaceOptions"
            size="medium"
            aria-labelledby="import-yaml-namespace-label"
          />
        </div>
      </div>
      <YamlEditor
        ref="yamleditor"
        v-model:value="currentYaml"
        class="yaml-editor"
        @onReady="onReadyYamlEditor"
      />
      <Banner
        v-for="(err, i) in errors"
        :key="i"
        class="m-0"
        color="error"
        role="alert"
        :label="err"
      />
    </template>
    <SortableTable
      v-else
      :rows="rows"
      :headers="headers"
      mode="view"
      key-field="_key"
      :search="false"
      :paging="true"
      :row-actions="false"
      :table-actions="false"
      :sub-rows-description="false"
      @rowClick="rowClick"
    />

    <template
      v-if="done"
      #actions
    >
      <RcButton
        variant="primary"
        size="large"
        data-testid="import-yaml-close"
        @click="close"
      >
        {{ t('generic.close') }}
      </RcButton>
    </template>
    <template
      v-else
      #primary-action="{ primaryAction }"
    >
      <RcButton
        variant="primary"
        size="large"
        left-icon="upload"
        :disabled="importDisabled"
        :aria-busy="importing"
        :aria-label="t('import.title')"
        data-testid="import-yaml-import-action"
        @click="primaryAction"
      >
        {{ t('import.action') }}
      </RcButton>
    </template>
  </RcModal>
</template>

<style lang='scss' scoped>
  $min: 50vh;
  $max: 50vh;

  .import-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .namespace {
    display: flex;
    align-items: center;
    gap: 8px;

    label {
      margin: 0;
      white-space: nowrap;
      color: var(--label-secondary);
    }
  }

  .namespace-select {
    width: 300px;
  }

  .yaml-editor {
    flex: 1;
    min-height: $min;
    max-height: $max;

    :deep() .code-mirror {
      .cm-editor {
        min-height: $min;
        max-height: $max;
      }
    }
  }
</style>
