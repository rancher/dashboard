<script>
import { SECRET, SERVICE } from '@/config/types';
import CreateEditView from '@/mixins/create-edit-view';
import DetailTop from '@/components/DetailTop';
import SortableTable from '@/components/SortableTable';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Labels from '@/components/form/Labels';

export default {
  components: {
    DetailTop,
    SortableTable,
    Tabbed,
    Tab,
    Labels
  },
  mixins:     [CreateEditView],
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  computed: {

    detailTopColumns() {
      const firstRule = this.firstRule || {};
      const firstPath = firstRule?.http?.paths?.[0] || {};

      const columns = [
        {
          title:   'Hostname',
          content: firstRule?.host
        },
        {
          title:   'Path',
          content: firstPath?.path
        },
        {
          title:   'Target',
          content: firstPath?.backend?.serviceName
        },
        {
          title:   'Port',
          content: firstPath?.backend?.servicePort
        }

      ];

      return columns;
    },

    ruleHeaders() {
      return [
        {
          name:  'path',
          label: 'Path',
          value: 'path'
        },
        {
          name:      'target',
          label:     'Target',
          value:     'link',
          formatter: 'Link'
        },
        {
          name:  'port',
          label: 'Port',
          value: 'backend.servicePort'
        }
      ];
    },

    backendHeaders() {
      return [
        {
          name:   'target',
          label:  'Target',
          value:  'serviceName',
          width:  200
        },
        {
          name:  'port',
          label: 'Port',
          value: 'servicePort'
        }
      ];
    },

    certHeaders() {
      return [
        {
          name:      'certificate',
          label:     'Certificate',
          value:     'link',
          formatter: 'Link',
          sort:      'link.text'
        },
        {
          name:      'hosts',
          label:     'Hosts',
          value:     'hosts',
          formatter: 'list'
        },
      ];
    },

    certRows() {
      return this.value?.spec?.tls.map((cert) => {
        if (cert.secretName) {
          const name = 'c-cluster-resource-namespace-id';
          const params = {
            namespace: this.value?.metadata?.namespace,
            id:        cert.secretName,
            resource:  SECRET
          };

          const url = this.$router.resolve({ name, params }).href;

          cert.link = { url, text: cert.secretName };
        } else {
          cert.link = { text: 'default' };
        }

        return cert;
      });
    },

    firstRule() {
      return this.value?.spec?.rules?.[0];
    },

    ruleRows() {
      return this.withUrl(this.firstRule?.http?.paths || []);
    }
  },

  methods: {
    withUrl(paths = []) {
      const rows = paths.map((path) => {
        const serviceName = path?.backend?.serviceName;

        const targetsWorkload = !serviceName.startsWith('ingress-');
        let name; let params;

        if (targetsWorkload) {
          name = 'c-cluster-workloads-namespace-id';
          params = { namespace: this.value?.metadata?.namespace, id: serviceName };
        } else {
          name = 'c-cluster-resource-namespace-id';
          params = {
            resource:  SERVICE,
            id:        serviceName,
            namespace: this.value?.metadata?.namespace
          };
        }

        const url = this.$router.resolve({ name, params }).href;

        path.link = { url, text: path?.backend?.serviceName };

        return path;
      });

      return rows;
    },
  }
};
</script>

<template>
  <div>
    <DetailTop class="mb-20" :columns="detailTopColumns" />
    <div>
      <h3 class="mb-20">
        Rules
      </h3>
      <div v-if="value.spec.rules">
        <div v-for="(rule, i) in value.spec.rules" :key="i" class="rule mb-20">
          <div class="label-col mb-40">
            <span>Hostname</span>
            <code>  {{ rule.host }}</code>
          </div>
          <SortableTable
            :rows="ruleRows"
            :headers="ruleHeaders"
            key-field="path"
            :search="false"
            :table-actions="false"
            :row-actions="false"
          />
        </div>
      </div>
      <div v-else class="rule">
        <div class="mb-10">
          Use as the default backend
        </div>
        <SortableTable
          :rows="[value.spec.backend]"
          :headers="backendHeaders"
          key-field="service"
          :search="false"
          :table-actions="false"
          :row-actions="false"
        />
      </div>
    </div>
    <Tabbed default-tab="labels">
      <Tab name="labels" label="Labels">
        <Labels :spec="value" :mode="mode" />
      </Tab>
      <Tab name="certificates" label="Certificates">
        <SortableTable
          :rows="certRows"
          :headers="certHeaders"
          key-field="secretName"
          :search="false"
          :table-actions="false"
          :row-actions="false"
        />
      </Tab>
    </Tabbed>
  </div>
</template>

<style scoped lang='scss'>
  .rule {
    background: var(--tabbed-container-bg);
    border: 1px solid var(--tabbed-border);
    border-radius: var(--border-radius);
    padding: 20px;
  }

  .label-col {
      display: flex;
      flex-direction: column;
      &>:first-child{
          color: var(--input-label)
      }
  }
</style>
