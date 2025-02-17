<script>
import { mapGetters } from 'vuex';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import YamlEditor from '@shell/components/YamlEditor';
import FileSelector from '@shell/components/form/FileSelector';
import AsyncButton from '@shell/components/AsyncButton';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SortableTable from '@shell/components/SortableTable';
import { sortBy } from '@shell/utils/sort';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { NAMESPACE } from '@shell/config/types';
import { NAME as NAME_COL, TYPE, NAMESPACE as NAMESPACE_COL, AGE } from '@shell/config/table-headers';

export default {
  emits: ['close', 'onReadyYamlEditor'],

  components: {
    AsyncButton,
    Banner,
    Card,
    Loading,
    YamlEditor,
    FileSelector,
    LabeledSelect,
    SortableTable
  },

  props: {
    defaultNamespace: {
      type:    String,
      default: 'default'
    },
  },

  async fetch() {
    this.allNamespaces = await this.$store.dispatch('cluster/findAll', { type: NAMESPACE, opt: { url: 'namespaces' } });
  },

  data() {
    return {
      currentYaml:   '',
      allNamespaces: [],
      errors:        null,
      rows:          null,
      done:          false,
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
          defaultNamespace: this.defaultNamespace,
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
  <Loading v-if="$fetchState.pending" />
  <Card
    v-else
    :show-highlight-border="false"
    data-testid="import-yaml"
    :trigger-focus-trap="true"
  >
    <template #title>
      <div style="display: block; width: 100%;">
        <template v-if="done">
          <h4 data-testid="import-yaml-success">
            {{ t('import.success', {count: rows.length}) }}
          </h4>
        </template>
        <template v-else>
          <h4 v-t="'import.title'" />
          <div class="row">
            <div class="col span-6">
              <FileSelector
                role="button"
                :aria-label="t('generic.readFromFileArea', { area: t('import.title') })"
                class="btn role-secondary pull-left"
                :label="t('generic.readFromFile')"
                @selected="onFileSelected"
              />
            </div>
            <div class="col span-6">
              <LabeledSelect
                :value="defaultNamespace"
                :options="namespaceOptions"
                label-key="import.defaultNamespace.label"
                mode="edit"
                @update:value="newValue => defaultNamespace = newValue"
              />
            </div>
          </div>
        </template>
      </div>
    </template>
    <template #body>
      <template v-if="done">
        <div class="results">
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
      </template>
      <YamlEditor
        v-else
        ref="yamleditor"
        v-model:value="currentYaml"
        class="yaml-editor"
        @onReady="onReadyYamlEditor"
      />
      <Banner
        v-for="(err, i) in errors"
        :key="i"
        color="error"
        :label="err"
      />
    </template>
    <template #actions>
      <div
        v-if="done"
        class="text-center"
        style="width: 100%"
      >
        <button
          :aria-label="t('generic.close')"
          role="button"
          type="button"
          class="btn role-primary"
          data-testid="import-yaml-close"
          @click="close"
        >
          {{ t('generic.close') }}
        </button>
      </div>
      <div
        v-else
        class="text-center"
        style="width: 100%"
      >
        <button
          :aria-label="t('generic.cancel')"
          role="button"
          type="button"
          class="btn role-secondary mr-10"
          data-testid="import-yaml-cancel"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton
          v-if="!done"
          mode="import"
          :disabled="!currentYaml.length"
          data-testid="import-yaml-import-action"
          :aria-label="t('import.title')"
          @click="importYaml"
        />
      </div>
    </template>
  </Card>
</template>

<style lang='scss' scoped>
  $min: 50vh;
  $max: 50vh;

  .yaml-editor {
    flex: 1;
    min-height: $min;
    max-height: $max;

    :deep() .code-mirror {
      .CodeMirror {
        position: initial;
      }

      .CodeMirror,
      .CodeMirror-scroll,
      .CodeMirror-gutters {
        min-height: $min;
        max-height: $max;
      }
    }
  }
</style>
