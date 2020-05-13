<script>
import DefaultBackend from '@/shared/networking.k8s.io.ingress/DefaultBackend';
import { SECRET, SERVICE } from '@/config/types';
import CreateEditView from '@/mixins/create-edit-view';
import SortableTable from '@/components/SortableTable';
import Tab from '@/components/Tabbed/Tab';
import ResourceTabs from '@/components/form/ResourceTabs';

export default {
  components: {
    DefaultBackend,
    ResourceTabs,
    SortableTable,
    Tab,
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
    ruleHeaders() {
      return [
        {
          name:      'path',
          label:     'Path',
          formatter: 'Link',
          value:     'pathLink'
        },
        {
          name:      'target',
          label:     'Target',
          formatter: 'Link',
          value:     'targetLink',
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

    ruleRows() {
      return this.value.spec.rules
        .filter(rule => rule?.http?.paths)
        .map((rule) => {
          return {
            ...rule,
            http: { paths: this.withUrl(rule.host, rule.http.paths) }
          };
        });
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
  },

  methods: {
    withUrl(host, paths = []) {
      const rows = paths.map((path) => {
        const serviceName = path?.backend?.serviceName;

        const targetsWorkload = !serviceName.startsWith('ingress-');
        let name; let params;

        if (targetsWorkload) {
          name = 'c-cluster-resource';
          params = {
            namespace: this.value?.metadata?.namespace, resource:  'workload', id:        serviceName
          };
        } else {
          name = 'c-cluster-resource-namespace-id';
          params = {
            resource:  SERVICE,
            id:        serviceName,
            namespace: this.value?.metadata?.namespace
          };
        }

        const targetUrl = this.$router.resolve({ name, params }).href;
        const pathUrl = `https://${ host }${ path?.path }`;

        path.targetLink = {
          url:     targetUrl,
          text:    path?.backend?.serviceName
        };
        path.pathLink = {
          url:     pathUrl,
          text:    path?.path,
          options: {
            rel:    'nofollow noopener noreferrer',
            target: '_blank'
          }
        };

        return path;
      });

      return rows;
    },
  }
};
</script>

<template>
  <div>
    <div>
      <h3 class="mb-20">
        Rules
      </h3>
      <div v-if="ruleRows">
        <div v-for="(rule, i) in ruleRows" :key="i" class="rule mb-20">
          <label>Hostname</label>
          <div class="mb-20">
            {{ rule.host }}
          </div>
          <SortableTable
            :rows="rule.http.paths"
            :headers="ruleHeaders"
            key-field="_key"
            :search="false"
            :table-actions="false"
            :row-actions="false"
          />
        </div>
      </div>
      <div v-else>
        No rules found
      </div>
      <ResourceTabs v-model="value" :mode="mode">
        <template #before>
          <Tab label="Certificates" name="certificates">
            <SortableTable
              :rows="certRows"
              :headers="certHeaders"
              key-field="_key"
              :search="false"
              :table-actions="false"
              :row-actions="false"
            />
          </Tab>
          <Tab label="Default Backend" name="default-backend">
            <DefaultBackend v-model="value.spec.backend" :targets="[]" :mode="mode" />
          </Tab>
        </template>
      </ResourceTabs>
    </div>
  </div>
</template>

<style scoped lang='scss'>
  .rule {
    background: var(--tabbed-container-bg);
    border: 1px solid var(--tabbed-border);
    border-radius: var(--border-radius);
    padding: 20px;

    label {
      color: var(--input-placeholder);
    }
  }

  .label-col {
      display: flex;
      flex-direction: column;
      &>:first-child{
          color: var(--input-label)
      }
  }
</style>
