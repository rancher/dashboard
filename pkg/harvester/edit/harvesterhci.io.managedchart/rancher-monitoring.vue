<script>
import isEmpty from 'lodash/isEmpty';
import { allHash } from '@shell/utils/promise';
import { findBy } from '@shell/utils/array';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import LazyImage from '@shell/components/LazyImage';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import CreateEditView from '@shell/mixins/create-edit-view';
import { ENDPOINTS } from '@shell/config/types';

const CATTLE_MONITORING_NAMESPACE = 'cattle-monitoring-system';

export default {
  name:       'EditHarvesterMonitoring',
  components: {
    LabeledInput, RadioGroup, LazyImage, Tabbed, Tab
  },

  mixins: [CreateEditView],

  async fetch() {
    const { $store, externalLinks } = this;

    if (!$store.getters['harvester/schemaFor'](ENDPOINTS)) {
      return;
    }

    const hash = await allHash({ endpoints: $store.dispatch('harvester/findAll', { type: ENDPOINTS }) });

    if (!isEmpty(hash.endpoints)) {
      const amMatch = externalLinks.alertmanager;
      const grafanaMatch = externalLinks.grafana;
      const promeMatch = externalLinks.prometheus;
      const alertmanager = findBy(
        hash.endpoints,
        'id',
        `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-alertmanager`
      );
      const grafana = findBy(
        hash.endpoints,
        'id',
        `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-grafana`
      );
      const prometheus = findBy(
        hash.endpoints,
        'id',
        `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-prometheus`
      );

      if (!isEmpty(alertmanager) && !isEmpty(alertmanager.subsets)) {
        amMatch.enabled = true;
      }
      if (!isEmpty(grafana) && !isEmpty(grafana.subsets)) {
        grafanaMatch.enabled = true;
      }
      if (!isEmpty(prometheus) && !isEmpty(prometheus.subsets)) {
        promeMatch.enabled = true;
      }
    }
  },

  props:  {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    const grafanaSrc = require('~shell/assets/images/vendor/grafana.svg');
    const prometheusSrc = require('~shell/assets/images/vendor/prometheus.svg');
    const currentCluster = this.$store.getters['currentCluster'];

    return {
      externalLinks: {
        alertmanager: {
          enabled:     false,
          iconSrc:     prometheusSrc,
          label:       'monitoring.overview.linkedList.alertManager.label',
          description:
            'monitoring.overview.linkedList.alertManager.description',
          link: `/k8s/clusters/${ currentCluster.id }/api/v1/namespaces/${ CATTLE_MONITORING_NAMESPACE }/services/http:rancher-monitoring-alertmanager:9093/proxy`,
        },
        grafana: {
          enabled:     false,
          iconSrc:     grafanaSrc,
          label:       'monitoring.overview.linkedList.grafana.label',
          description: 'monitoring.overview.linkedList.grafana.description',
          link:        `/k8s/clusters/${ currentCluster.id }/api/v1/namespaces/${ CATTLE_MONITORING_NAMESPACE }/services/http:rancher-monitoring-grafana:80/proxy`,
        },
        prometheus: {
          enabled:     false,
          iconSrc:     prometheusSrc,
          label:       'monitoring.overview.linkedList.prometheusPromQl.label',
          description:
            'monitoring.overview.linkedList.prometheusPromQl.description',
          link: `/k8s/clusters/${ currentCluster.id }/api/v1/namespaces/${ CATTLE_MONITORING_NAMESPACE }/services/http:rancher-monitoring-prometheus:9090/proxy`,
        },
      }
    };
  },

  created() {
    const resources = this.value.spec.values.prometheus.prometheusSpec.resources;

    if (!resources?.limits) {
      this.$set(resources, 'limits', {});
    }

    this.$set(resources.requests, 'cpu', resources?.requests?.cpu || '');
    this.$set(resources.requests, 'memory', resources?.requests?.memory || '');
    this.$set(resources.limits, 'cpu', resources?.limits?.cpu || '');
    this.$set(resources.limits, 'memory', resources?.limits?.memory || '');

    const { resources: grafanaResources } = this.value.spec.values.grafana;

    if (!grafanaResources) {
      this.$set(this.value.spec.values.grafana, 'resources', {
        limits: {
          cpu:    '200m',
          memory: '500Mi'
        },
        requests: {
          cpu:    '100m',
          memory: '200Mi'
        }
      });
    }

    const { alertmanagerSpec } = this.value.spec.values.alertmanager;

    if (!alertmanagerSpec) {
      this.$set(this.value.spec.values.alertmanager, 'alertmanagerSpec', {
        retention: '120h',
        resources: {
          limits: {
            cpu:    '1000m',
            memory: '600Mi'
          },
          requests: {
            cpu:    '100m',
            memory: '100Mi'
          }
        }
      });
    }
  },

  computed: {
    prometheusNodeExporter() {
      return this.value.spec.values['prometheus-node-exporter'];
    },
  },
};
</script>

<template>
  <Tabbed :side-tabs="true">
    <Tab name="prometheus" :label="t('harvester.setting.harvesterMonitoring.section.prometheus')" :weight="-1">
      <a
        v-tooltip="!externalLinks.prometheus.enabled ? t('monitoring.overview.linkedList.na') : undefined"
        :disabled="!externalLinks.prometheus.enabled"
        :href="externalLinks.prometheus.link"
        target="_blank"
        rel="noopener noreferrer"
        class="subtype-banner m-0 mt-10 mb-10"
      >
        <div class="subtype-content">
          <div class="title">
            <div class="subtype-logo round-image">
              <LazyImage :src="externalLinks.prometheus.iconSrc" />
            </div>
            <h5>
              <span>
                <t :k="externalLinks.prometheus.label" />
              </span>
            </h5>
            <div class="flex-right">
              <i class="icon icon-external-link mr-10" />
            </div>
          </div>
        </div>
      </a>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.prometheus.prometheusSpec.scrapeInterval"
            :label="t('monitoring.prometheus.config.scrape')"
            :tooltip="t('harvester.setting.harvesterMonitoring.tips.scrape')"
            :required="true"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.prometheus.prometheusSpec.evaluationInterval"
            :label="t('monitoring.prometheus.config.evaluation')"
            :tooltip="t('harvester.setting.harvesterMonitoring.tips.evaluation')"
            :required="true"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row mt-10">
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.prometheus.prometheusSpec.retention"
            :label="t('monitoring.prometheus.config.retention')"
            :tooltip="t('harvester.setting.harvesterMonitoring.tips.retention')"
            :required="true"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.prometheus.prometheusSpec.retentionSize"
            :label="t('monitoring.prometheus.config.retentionSize')"
            :tooltip="t('harvester.setting.harvesterMonitoring.tips.retentionSize')"
            :required="true"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row mt-10">
        <div class="col span-12 mt-5">
          <h4 class="mb-0">
            {{ t('monitoring.prometheus.config.resourceLimits') }}
          </h4>
        </div>
      </div>
      <div class="row mt-10">
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.prometheus.prometheusSpec.resources.requests.cpu"
            :label="t('monitoring.prometheus.config.requests.cpu')"
            :required="true"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.prometheus.prometheusSpec.resources.requests.memory"
            :label="t('monitoring.prometheus.config.requests.memory')"
            :required="true"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row mt-10">
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.prometheus.prometheusSpec.resources.limits.cpu"
            :label="t('monitoring.prometheus.config.limits.cpu')"
            :required="true"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.prometheus.prometheusSpec.resources.limits.memory"
            :label="t('monitoring.prometheus.config.limits.memory')"
            :required="true"
            :mode="mode"
          />
        </div>
      </div>
    </Tab>
    <Tab name="nodeExporter" :label="t('harvester.setting.harvesterMonitoring.section.prometheusNodeExporter')" :weight="-2">
      <div class="row mt-10">
        <div class="col span-6">
          <LabeledInput
            v-model="prometheusNodeExporter.resources.limits.cpu"
            :label="t('monitoring.prometheus.config.limits.cpu')"
            :required="true"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="prometheusNodeExporter.resources.limits.memory"
            :label="t('monitoring.prometheus.config.limits.memory')"
            :required="true"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row mt-10">
        <div class="col span-6">
          <LabeledInput
            v-model="prometheusNodeExporter.resources.requests.cpu"
            :label="t('monitoring.prometheus.config.requests.cpu')"
            :required="true"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="prometheusNodeExporter.resources.requests.memory"
            :label="t('monitoring.prometheus.config.requests.memory')"
            :required="true"
            :mode="mode"
          />
        </div>
      </div>
    </Tab>
    <Tab v-if="value.spec.values.grafana.resources" name="grafana" :label="t('harvester.setting.harvesterMonitoring.section.grafana')" :weight="-3">
      <a
        v-tooltip="!externalLinks.grafana.enabled ? t('monitoring.overview.linkedList.na') : undefined"
        :disabled="!externalLinks.grafana.enabled"
        :href="externalLinks.grafana.link"
        target="_blank"
        rel="noopener noreferrer"
        class="subtype-banner m-0 mt-10 mb-10"
      >
        <div class="subtype-content">
          <div class="title">
            <div class="subtype-logo round-image">
              <LazyImage :src="externalLinks.grafana.iconSrc" />
            </div>
            <h5>
              <span>
                <t :k="externalLinks.grafana.label" />
              </span>
            </h5>
            <div class="flex-right">
              <i class="icon icon-external-link mr-10" />
            </div>
          </div>
        </div>
      </a>
      <div class="row mt-10">
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.grafana.resources.requests.cpu"
            :label="t('monitoring.prometheus.config.requests.cpu')"
            :required="true"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.grafana.resources.requests.memory"
            :label="t('monitoring.prometheus.config.requests.memory')"
            :required="true"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row mt-10">
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.grafana.resources.limits.cpu"
            :label="t('monitoring.prometheus.config.limits.cpu')"
            :required="true"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.grafana.resources.limits.memory"
            :label="t('monitoring.prometheus.config.limits.memory')"
            :required="true"
            :mode="mode"
          />
        </div>
      </div>
    </Tab>
    <Tab name="alertmanager" :label="t('harvester.setting.harvesterMonitoring.section.alertmanager')" :weight="-4">
      <RadioGroup
        v-model="value.spec.values.alertmanager.enabled"
        class="mb-20"
        name="model"
        :options="[true,false]"
        :labels="[t('generic.enabled'), t('generic.disabled')]"
      />

      <a
        v-if="value.spec.values.alertmanager.enabled"
        v-tooltip="!externalLinks.alertmanager.enabled ? t('monitoring.overview.linkedList.na') : undefined"
        :disabled="!externalLinks.alertmanager.enabled"
        :href="externalLinks.alertmanager.link"
        target="_blank"
        rel="noopener noreferrer"
        class="subtype-banner m-0 mt-10 mb-10"
      >
        <div class="subtype-content">
          <div class="title">
            <div class="subtype-logo round-image">
              <LazyImage :src="externalLinks.alertmanager.iconSrc" />
            </div>
            <h5>
              <span>
                <t :k="externalLinks.alertmanager.label" />
              </span>
            </h5>
            <div class="flex-right">
              <i class="icon icon-external-link mr-10" />
            </div>
          </div>
        </div>
      </a>

      <div v-if="value.spec.values.alertmanager.enabled">
        <div class="row mt-10">
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.values.alertmanager.alertmanagerSpec.retention"
              :label="t('monitoring.prometheus.config.retention')"
              :required="true"
              :mode="mode"
            />
          </div>
        </div>
        <div class="row mt-10">
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.values.alertmanager.alertmanagerSpec.resources.limits.cpu"
              :label="t('monitoring.prometheus.config.limits.cpu')"
              :required="true"
              :mode="mode"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.values.alertmanager.alertmanagerSpec.resources.limits.memory"
              :label="t('monitoring.prometheus.config.limits.memory')"
              :required="true"
              :mode="mode"
            />
          </div>
        </div>
        <div class="row mt-10">
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.values.alertmanager.alertmanagerSpec.resources.requests.cpu"
              :label="t('monitoring.prometheus.config.requests.cpu')"
              :required="true"
              :mode="mode"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.values.alertmanager.alertmanagerSpec.resources.requests.memory"
              :label="t('monitoring.prometheus.config.requests.memory')"
              :required="true"
              :mode="mode"
            />
          </div>
        </div>
      </div>
    </Tab>
  </Tabbed>
</template>

<style lang="scss" scoped>
  ::v-deep .radio-group {
    display: flex;
    .radio-container {
      margin-right: 30px;
    }
  }
</style>
