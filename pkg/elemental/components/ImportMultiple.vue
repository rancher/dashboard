<script>
import { mapGetters } from 'vuex';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import FileSelector from '@shell/components/form/FileSelector';
import AsyncButton from '@shell/components/AsyncButton';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SortableTable from '@shell/components/SortableTable';
import { sortBy } from '@shell/utils/sort';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { NAMESPACE } from '@shell/config/types';
import {
  NAME as NAME_COL, STATE, TYPE, NAMESPACE as NAMESPACE_COL, AGE
} from '@shell/config/table-headers';

export default {
  components: {
    AsyncButton,
    Banner,
    Card,
    Loading,
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
      allYamls:      [],
      allNamespaces: null,
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
        STATE,
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

    onFileSelected(filesContent) {
      this.allYamls = [];
      this.allYamls = filesContent;
    },

    handleMultipleImports(btnCb) {
      const promises = [];

      this.allYamls.forEach(file => promises.push(this.importYaml(file.value)));

      Promise.allSettled(promises).then((response) => {
        const rows = [];
        const errors = [];

        response.forEach((res) => {
          if (res.value && res.value[0]) {
            rows.push(res.value[0]);
          } else {
            errors.push(res.value.err);
          }
        });

        if (errors.length) {
          const errorMsg = `${ errors.length } out of ${ response.length } YAML files could not be applied successfully.`;

          this.errors = exceptionToErrorsArray(errorMsg);
          btnCb(false);
        }

        this.rows = rows;
        this.done = true;
        btnCb(true);
      });
    },

    async importYaml(content) {
      try {
        this.errors = [];

        return await this.currentCluster.doAction('apply', {
          yaml:             content,
          defaultNamespace: this.defaultNamespace,
        });
      } catch (err) {
        return { err };
      }
    },

    rowClick(e) {
      if ( e.target.tagName === 'A' ) {
        this.close();
      }
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <Card v-else :show-highlight-border="false">
    <template #title>
      <div style="display: block; width: 100%;">
        <template v-if="done">
          <h4>{{ t('import.success', {count: rows.length}) }}</h4>
        </template>
        <template v-else>
          <h4 v-t="'import.title'"></h4>
          <div class="row">
            <div class="col span-6">
              <FileSelector
                class="btn role-secondary pull-left"
                :label="t('generic.readFromFile')"
                :multiple="true"
                :include-file-name="true"
                @selected="onFileSelected"
              />
            </div>
            <div class="col span-6">
              <LabeledSelect
                v-model="defaultNamespace"
                class="pull-right"
                :options="namespaceOptions"
                label-key="import.defaultNamespace.label"
                mode="edit"
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
            @rowClick="rowClick"
          />
        </div>
      </template>
      <div v-else-if="allYamls.length">
        <h3>Files selected ({{ allYamls.length }} in total)</h3>
        <ul class="filename-list">
          <li v-for="(item, key) in allYamls" :key="key">
            {{ item.name }}
          </li>
        </ul>
      </div>
      <Banner v-for="(err, i) in errors" :key="i" color="error" :label="err" />
    </template>
    <template #actions>
      <div v-if="done" class="text-center" style="width: 100%">
        <button type="button" class="btn role-primary" @click="close">
          {{ t('generic.close') }}
        </button>
      </div>
      <div v-else class="text-center" style="width: 100%">
        <button type="button" class="btn role-secondary mr-10" @click="close">
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton v-if="!done" mode="import" :disabled="!allYamls.length" @click="handleMultipleImports" />
      </div>
    </template>
  </Card>
</template>

<style lang='scss' scoped>
.filename-list {
  list-style: none;
  margin: 20px 0;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
}
</style>
