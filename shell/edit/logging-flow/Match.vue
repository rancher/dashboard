<script>
import KeyValue from '@shell/components/form/KeyValue';
import Select from '@shell/components/form/Select';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import { labelSelectPaginationFunction } from '@shell/components/form/LabeledSelect/labeled-select.utils';
import paginationUtils from '@shell/utils/pagination-utils';
import { LABEL_SELECT_KINDS } from '@shell/types/components/labeledSelect';
import { isArray, uniq } from '@shell/utils/array';
import {
  LOGGING, NAMESPACE, NODE, POD, SCHEMA
} from '@shell/config/types';

export default {
  components: {
    KeyValue, Select, LabeledSelect
  },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },

    nodes: {
      type:    Array,
      default: () => [],
    },

    // containers: {
    //   type:    Array,
    //   default: () => [],
    // },

    namespaces: {
      type:    Array,
      default: () => [],
    },

    isClusterFlow: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return { allPods: [] };
  },

  async fetch() {
    if (this.$store.getters[`cluster/schemaFor`](POD)) {
      this.allPods = await this.$store.dispatch('cluster/findAll', { type: POD });
    }
  },

  computed: {
    containers() {
      const out = [];

      for ( const pod of this.allPods ) {
        for ( const c of (pod.spec?.containers || []) ) {
          out.push(c.name);
        }
      }

      return uniq(out).sort();
    },
  },

  methods: {
    update() {},

    removeRule() {
      this.$emit('remove');
    },

    /**
     * @param [PaginateFnOptions] opts
     * @returns PaginateFnResponse
     */
    async paginateContainers(opts) {
      const { filter } = opts;
      const filters = !!filter ? [
        PaginationParamFilter.createSingleField({ field: 'spec.dontainers.name', value: filter }),
        PaginationParamFilter.createSingleField({ field: 'metadata.name', value: filter }),
      ] : [];

      if (this.value.namespaces?.length) {
        filters.push(
          PaginationParamFilter.createSingleField({ field: 'metadata.namespace', value: this.value.namespaces.join(',') }),
        );
      }

      const {
        page,
        ...rest
      } = await labelSelectPaginationFunction({
        opts,
        filters,
        groupByNamespace: false,
        type:             POD,
        ctx:              { getters: this.$store.getters, dispatch: this.$store.dispatch },
        classify:         false,
        sort:             [],
      });

      const containers = page.reduce((res, p) => {
        if (p.spec?.containers?.length) {
          res.push({
            kind:     'group',
            icon:     'icon-namespace',
            id:       p.id,
            // metadata: { name: ns },
            disabled: true,
          },
          ...p.spec.containers.map((c) => c.name)
          );
        }

        return res;
      }, []);

      return {
        ...rest,
        page: containers
      };
    },
  },
};
</script>

<template>
  <div>
    <KeyValue
      v-model="value.labels"
      :title="value.select ? t('logging.flow.matches.pods.title.include') : t('logging.flow.matches.pods.title.exclude')"
      :mode="mode"
      :initial-empty-row="true"
      :read-allowed="false"
      :title-add="true"
      protip=""
      :key-label="t('logging.flow.matches.pods.keyLabel')"
      :value-label="t('logging.flow.matches.pods.valueLabel')"
      :add-label="t('logging.flow.matches.pods.addLabel')"
    />
    <div class="spacer" />
    <h3>
      {{ value.select ? t('logging.flow.matches.nodes.title.include') : t('logging.flow.matches.nodes.title.exclude') }}
    </h3>
    <div class="row">
      <div class="col span-12">
        <Select
          v-model="value.hosts"
          class="lg"
          :options="nodes"
          :placeholder="t('logging.flow.matches.nodes.placeholder')"
          :multiple="true"
          :searchable="true"
          :taggable="true"
          :clearable="true"
          :close-on-select="false"
          :reduce="(e) => e.value"
        />
      </div>
    </div>
    <div class="spacer" />
    <h3>
      {{ value.select ? t('logging.flow.matches.containerNames.title.include') : t('logging.flow.matches.containerNames.title.exclude') }}
    </h3>
    <div class="row">
      <div class="col span-12">
        <!--
          :key="namespace" value.namespaces
          :paginate="paginateContainerNames"
          -->
        !!{{ value.namespaces }}!!
        <LabeledSelect
          v-model="value.container_names"
          :mode="mode"
          :options="containers"
          :paginate="paginateContainers"
          :disabled="false"
          :placeholder="t('logging.flow.matches.containerNames.placeholder')"
          :multiple="true"
          :taggable="true"
          :clearable="true"
          :close-on-select="false"
          placement="top"
        />

        <!-- <Select
          v-model="value.container_names"
          class="lg"
          :options="containers"

          :multiple="true"
          :taggable="true"
          :clearable="true"
          :close-on-select="false"
          placement="top"
        /> -->
      </div>
    </div>
    <div v-if="isClusterFlow">
      <div class="spacer" />
      <h3>
        {{ value.select ? t('logging.flow.matches.namespaces.title.include') : t('logging.flow.matches.namespaces.title.exclude') }}
      </h3>
      <div class="row">
        <div class="col span-12">
          <Select
            v-model="value.namespaces"
            class="lg"
            :options="namespaces"
            :placeholder="t('logging.flow.matches.namespaces.placeholder')"
            :multiple="true"
            :taggable="true"
            :clearable="true"
            :close-on-select="false"
            placement="top"
          />
        </div>
      </div>
    </div>
  </div>
</template>
