<script>
import { mapGetters } from 'vuex';
import { Banner } from '@components/Banner';
import YamlEditor from '@shell/components/YamlEditor';
import FileSelector from '@shell/components/form/FileSelector';
import AsyncButton from '@shell/components/AsyncButton';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SortableTable from '@shell/components/SortableTable';
import { sortBy } from '@shell/utils/sort';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { NAMESPACE } from '@shell/config/types';
import { NAME as NAME_COL, TYPE, NAMESPACE as NAMESPACE_COL, AGE } from '@shell/config/table-headers';
import RcButton from '@components/RcButton/RcButton.vue';
import { RcModal } from '@components/RcModal';

export default {
  emits: ['close', 'onReadyYamlEditor'],

  components: {
    AsyncButton,
    Banner,
    YamlEditor,
    FileSelector,
    LabeledSelect,
    SortableTable,
    RcButton,
    RcModal
  },

  props: {
    modal: {
      type:     Object,
      required: true
    },
    defaultNamespace: {
      type:    String,
      default: undefined
    },
    resourceName: {
      type:    String,
      default: undefined
    }
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
      selectedNamespace: this.defaultNamespace,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    resourceNameLabel() {
      return this.resourceName || this.t('import.defaultResourceName');
    },

    namespaceOptions() {
      const out = this.allNamespaces.map((obj) => {
        return {
          label: obj.name,
          value: obj.name,
        };
      });

      return sortBy(out, 'label');
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
      this.modal.onClose();
      this.$emit('close');
    },

    onFileSelected(value) {
      const component = this.$refs.yamleditor;

      if (component) {
        this.errors = null;
        component.updateValue(value);
      }
    },

    async importYaml(btnCb) {
      try {
        this.errors = [];

        const res = await this.currentCluster.doAction('apply', {
          yaml:             this.currentYaml,
          defaultNamespace: this.selectedNamespace,
        });

        btnCb(true);

        this.rows = res;
        this.done = true;
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        this.done = false;
        btnCb(false);
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
  <RcModal
    :show="modal.show"
    size="large"
    data-testid="import-yaml"
    @close="close"
  >
    <template #title>
      <span
        v-if="done"
        data-testid="import-yaml-success"
      >
        {{ t('import.success', {count: rows.length}) }}
      </span>
      <span v-else>
        {{ t('import.title') }}
      </span>
    </template>
    <div>
      <template v-if="!done">
        <Banner
          class="import-instruction-banner"
          color="info"
        >
          <span class="banner-text">
            {{ t('import.instructions', { resourceName: resourceNameLabel }) }}
          </span>
        </Banner>
        <div class="row mb-24">
          <div class="col span-6">
            <FileSelector
              :aria-label="t('generic.readFromFileArea', { area: t('import.title') })"
              variant="secondary"
              class="pull-left"
              :label="t('generic.readFromFile')"
              @selected="onFileSelected"
            />
          </div>
          <div class="col span-6 namespace-col">
            <label>{{ t('import.namespace') }}</label>
            <LabeledSelect
              v-model:value="selectedNamespace"
              class="namespace-select"
              :options="namespaceOptions"
              size="medium"
              mode="edit"
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
          color="error"
          role="alert"
          :label="err"
        />
      </template>
      <div
        v-else
        class="results"
      >
        <SortableTable
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
      </div>
    </div>
    <template #actions>
      <div
        v-if="done"
        class="button-section"
      >
        <RcButton
          variant="primary"
          size="large"
          :aria-label="t('generic.close')"
          data-testid="import-yaml-close"
          @click="close"
        >
          {{ t('generic.close') }}
        </RcButton>
      </div>
      <div
        v-else
        class="text-right button-section"
        style="width: 100%"
      >
        <RcButton
          variant="link"
          size="large"
          class="cancel-btn"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </RcButton>
        <AsyncButton
          v-if="!done"
          mode="import"
          class="import-btn"
          icon="icon-upload"
          :disabled="!currentYaml.length"
          data-testid="import-yaml-import-action"
          :aria-label="t('import.title')"
          @click="importYaml"
        />
      </div>
    </template>
  </RcModal>
</template>

<style lang='scss' scoped>
  $min: 50vh;
  $max: 50vh;

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

  .import-instruction-banner {
    margin: 0 0 24px 0;
  }

  .medium {
    height: 32px;
    min-height: 32px;
    padding: 0 12px;
  }

  .namespace-select {
    max-width: 300px;
  }

  .namespace-col {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;

    label {
      margin: 0;
      white-space: nowrap;
    }
  }

  .import-btn {
    padding-left: 16px;
    padding-right: 16px;
    margin-left: 8px;
  }

  .cancel-btn {
    padding-left: 16px;
    padding-right: 16px;
  }

  .button-section {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .mb-24 {
    margin-bottom: 24px;
  }
</style>
