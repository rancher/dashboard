<script>
import { mapGetters } from 'vuex';
import { RadioGroup } from '@components/Form/Radio';
import { set, get } from '@shell/utils/object';
import { isEqual } from 'lodash';

export default {
  components: { RadioGroup },
  props:      {
    accessModes: {
      type:     Array,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },
  },
  data() {
    const thanos = {
      version:             'v0.17.2',
      grpcServerTlsConfig: {
        caFile:   '/etc/tls/grpc/tls.ca',
        certFile: '/etc/tls/grpc/tls.cert',
        keyFile:  '/etc/tls/grpc/tls.key',
      }
    };
    const containers = '- name: thanos-sidecar\n  volumeMounts:\n  - mountPath: /etc/tls/grpc\n    name: thanos-sidecar-tls\n';
    const volumes = [{
      name:   'thanos-sidecar-tls',
      secret: {
        defaultMode: 420,
        secretName:  'thanos-sidecar-tls'
      }
    }];
    const nodeExporterRelabelings = [{
      sourceLabels: ['__meta_kubernetes_pod_host_ip'],
      targetLabel:  'hostip',
      action:       'replace',
      regex:        '(.+)',
      replacement:  '$1',
    }, {
      sourceLabels: ['__meta_kubernetes_pod_node_name'],
      targetLabel:  'node',
      action:       'replace',
      regex:        '(.+)',
      replacement:  '$1',
    }];

    const hardenedKubeletEndpointsRelabelings = [{
      sourceLabels: ['__meta_kubernetes_pod_name'],
      targetLabel:  'pod',
      action:       'replace',
      regex:        '(.+)',
      replacement:  '$1',
    }, {
      sourceLabels: ['__meta_kubernetes_namespace'],
      targetLabel:  'namespace',
      action:       'replace',
      regex:        '(.+)',
      replacement:  '$',
    }];
    const k3sServerEndpointsRelabelings = [{
      sourceLabels: ['__meta_kubernetes_pod_name'],
      targetLabel:  'pod',
      action:       'replace',
      regex:        '(.+)',
      replacement:  '$1',
    }, {
      sourceLabels: ['__meta_kubernetes_namespace'],
      targetLabel:  'namespace',
      action:       'replace',
      regex:        '(.+)',
      replacement:  '$',
    }];
    const kubeletCAdvisorRelabelings = [{
      sourceLabels: ['__metrics_path__'],
      targetLabel:  'metrics_path',
    }, {
      sourceLabels: ['__meta_kubernetes_pod_name'],
      targetLabel:  'pod',
      action:       'replace',
      regex:        '(.+)',
      replacement:  '$1',
    }, {
      sourceLabels: ['__meta_kubernetes_namespace'],
      targetLabel:  'namespace',
      action:       'replace',
      regex:        '(.+)',
      replacement:  '$',
    }];

    const sidecarEnabled = !!this.value.prometheus.prometheusSpec.thanos?.version;
    const tlsEnabeled = (this.mode === 'create' && !this.value.prometheus.prometheusSpec.externalLabels.prometheus_from) ? true : !!this.value.prometheus.prometheusSpec.thanos?.grpcServerTlsConfig;

    return {
      sidecar: sidecarEnabled,
      tls:     sidecarEnabled && tlsEnabeled,
      nodeExporterRelabelings,
      hardenedKubeletEndpointsRelabelings,
      k3sServerEndpointsRelabelings,
      kubeletCAdvisorRelabelings,
      volumes,
      thanos,
      containers,
    };
  },
  computed: {
    ...mapGetters(['currentCluster']),
    nodeExporterMetricRelabelings() {
      return [{
        sourceLabels: ['node'],
        targetLabel:  'node_id',
        action:       'replace',
        regex:        '(.+)',
        replacement:  `${ this.currentCluster.spec.displayName }:$1`,
      }];
    },
    hardenedKubeletMetricEndpointsRelabelings() {
      return [{
        sourceLabels: ['namespace', 'pod'],
        targetLabel:  'pod_id',
        action:       'replace',
        separator:    ':',
        regex:        '(.+)',
        replacement:  `${ this.currentCluster.spec.displayName }:$1`,
      }];
    },
    k3sServerMetricEndpointsRelabelings() {
      return [{
        sourceLabels: ['namespace', 'pod'],
        targetLabel:  'pod_id',
        action:       'replace',
        separator:    ':',
        regex:        '(.+)',
        replacement:  `${ this.currentCluster.spec.displayName }:$1`,
      }];
    },
    kubeletCAdvisorMetricRelabelings() {
      return [{
        sourceLabels: ['namespace', 'pod'],
        targetLabel:  'pod_id',
        action:       'replace',
        separator:    ':',
        regex:        '(.+)',
        replacement:  `${ this.currentCluster.spec.displayName }:$1`,
      }];
    },

    tlsYaml() {
      return {
        on: {
          'prometheus.prometheusSpec.thanos.grpcServerTlsConfig': this.thanos.grpcServerTlsConfig,
          'prometheus.prometheusSpec.containers':                 `${ !this.value.prometheus.prometheusSpec.containers.includes(this.containers) ? this.containers : '' }${ this.value.prometheus.prometheusSpec.containers }`,
          'prometheus.prometheusSpec.volumes':                    [
            ...(this.value.prometheus.prometheusSpec.volumes || []),
            ...this.volumes,
          ]
        },
        off: {
          'prometheus.prometheusSpec.thanos.grpcServerTlsConfig': undefined,
          'prometheus.prometheusSpec.containers':                 this.value.prometheus.prometheusSpec.containers.replace(this.containers, ''),
          'prometheus.prometheusSpec.volumes':                    this.value.prometheus.prometheusSpec.volumes.filter(item => item.name !== 'thanos-sidecar-tls'),
        }
      };
    },

    sidecarYaml() {
      return {
        on: {
          'prometheus.prometheusSpec.thanos': {
            ...this.value.prometheus.prometheusSpec.thanos,
            image:   this.thanos.image,
            version: this.thanos.version,
          },
          'prometheus.thanosService': {
            ...this.value.prometheus.thanosService,
            enabled:   true,
            type:      'NodePort',
            clusterIP: '',
          }
        },
        off: {
          'prometheus.prometheusSpec.thanos': {
            ...this.value.prometheus.prometheusSpec.thanos,
            image:   undefined,
            version: undefined,
          },
          'prometheus.thanosService': {
            ...this.value.prometheus.thanosService,
            enabled:   false,
            type:      'ClusterIP',
            clusterIP: 'None',
          },
        }
      };
    },

    initYaml() {
      return {
        on: {
          'prometheus.prometheusSpec.externalLabels.prometheus_from': this.currentCluster.spec.displayName,
          'nodeExporter.serviceMonitor.metricRelabelings':            this.getInitYaml('nodeExporter.serviceMonitor.metricRelabelings', this.nodeExporterMetricRelabelings),
          'nodeExporter.serviceMonitor.relabelings':                  this.getInitYaml('nodeExporter.serviceMonitor.relabelings', this.nodeExporterRelabelings),
          'k3sServer.serviceMonitor.endpoints':                       this.getEndpoints('k3sServer.serviceMonitor.endpoints', this.k3sServerEndpointsRelabelings, this.k3sServerMetricEndpointsRelabelings),
          'hardenedKubelet.serviceMonitor.endpoints':                 this.getEndpoints('hardenedKubelet.serviceMonitor.endpoints', this.hardenedKubeletEndpointsRelabelings, this.hardenedKubeletMetricEndpointsRelabelings),
          'kubelet.serviceMonitor.cAdvisorMetricRelabelings':         this.kubeletCAdvisorMetricRelabelings,
          'kubelet.serviceMonitor.cAdvisorRelabelings':               this.kubeletCAdvisorRelabelings,
        },
        off: {}
      };
    }
  },
  watch: {
    sidecar: 'changeSidecar',
    tls:     'changeTls',
  },
  methods: {
    set,
    changeSidecar() {
      this.updateThanos('sidecar');
      this.$set(this, 'tls', this.sidecar);
    },
    changeTls() {
      this.updateThanos('tls');
    },
    initThanos() {
      this.updateThanos('init');
      if (this.tls && !this.value.prometheus.prometheusSpec.thanos.grpcServerTlsConfig) {
        this.updateThanos('tls');
      }
    },
    updateThanos(option) {
      Object.keys(this[`${ option }Yaml`][this[option] === false ? 'off' : 'on']).forEach((item) => {
        set(this.value, item, this[`${ option }Yaml`][this[option] === false ? 'off' : 'on'][item]);
      });
    },
    getInitYaml(key, value) {
      const origin = get(this.value, key) || [];

      return this.insertUniqueObject(origin, value);
    },
    getEndpoints(key, iRelabelings, iMetricRelabelings) {
      const group = get(this.value, key);

      return group.map((e) => {
        if (e.path === '/metrics/cadvisor') {
          let relabelings = e.relabelings || [];
          let metricRelabelings = e.metricRelabelings || [];

          relabelings = this.insertUniqueObject(relabelings, iRelabelings);
          metricRelabelings = this.insertUniqueObject(metricRelabelings, iMetricRelabelings);

          return {
            ...e,
            relabelings,
            metricRelabelings,
          };
        }

        return e;
      });
    },

    insertUniqueObject(arr1, arr2) {
      const out = arr1;

      arr2.forEach((obj2) => {
        if (arr1.find(obj1 => isEqual(obj1, obj2))) {
          return;
        }

        out.push(obj2);
      });

      return out;
    }
  },
  mounted() {
    this.initThanos();
  }
};
</script>

<template>
  <div>
    <div class="title">
      <h3>{{ t('monitoring.thanos.title') }}</h3>
    </div>
    <div class="grafana-config">
      <div class="row pt-10 pb-10">
        <div class="col span-6">
          <RadioGroup
            v-model="sidecar"
            name="sidecar"
            :label="t('monitoring.thanos.sidecar.label')"
            :labels="[t('generic.yes'), t('generic.no')]"
            :mode="mode"
            :options="[true, false]"
          />
        </div>
        <div
          v-if="sidecar"
          class="col span-6"
        >
          <RadioGroup
            v-model="tls"
            name="tls"
            :label="t('monitoring.thanos.tls.label')"
            :labels="[t('generic.yes'), t('generic.no')]"
            :mode="mode"
            :options="[true, false]"
          />
        </div>
      </div>
    </div>
  </div>
</template>
