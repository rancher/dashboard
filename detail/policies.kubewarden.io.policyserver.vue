<script>
import { mapGetters } from 'vuex';
import { _CREATE } from '@/config/query-params';
import { SERVICE } from '@/config/types';
import CreateEditView from '@/mixins/create-edit-view';
import ResourceTable from '@/components/ResourceTable';
import ResourceTabs from '@/components/form/ResourceTabs';
import Tab from '@/components/Tabbed/Tab';

export default {
  name: 'PolicyServer',

  components: {
    ResourceTable, ResourceTabs, Tab
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:    String,
      default: _CREATE,
    },
    resource: {
      type:    String,
      default: null
    },
    value: {
      type:     Object,
      required: true,
    }
  },

  async fetch() {
    const inStore = this.$store.getters['currentStore'](this.resource);

    try {
      this.jaegerService = await this.$store.dispatch('cluster/find', { type: SERVICE, id: 'jaeger/jaeger-operator-metrics' });
    } catch (e) {
      console.error(`Error fetching Jaeger service: ${ e }`); // eslint-disable-line no-console
    }

    const JAEGER_PROXY = `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/jaeger/services/http:all-in-one-query:16686/proxy/api/traces?operation=/api/traces&service=jaeger-query`;

    this.traces = await this.$store.dispatch(`${ inStore }/request`, { url: JAEGER_PROXY });
  },

  data() {
    return { jaegerService: null, traces: null };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    tracesHeaders() {
      return [
        {
          name:   'processes',
          value:  'processes.p1.serviceName',
          label:  'Processes',
          sort:   'processes'
        },
      ];
    },

    tracesRows() {
      return this.traces?.data;
    }
  }
};
</script>

<template>
  <div>
    <div class="mb-20">
      <h3>{{ t('namespace.resources') }}</h3>
    </div>
    <ResourceTabs v-model="value" :mode="mode">
      <Tab v-if="jaegerService" name="policy-tracing" label="Tracing">
        <template #default>
          <ResourceTable
            v-if="traces"
            :rows="tracesRows"
            :headers="tracesHeaders"
            :table-actions="false"
            :row-actions="false"
            key-field="key"
            default-sort-by="state"
            :paged="true"
          />
        </template>
      </Tab>
    </ResourceTabs>
  </div>
</template>
