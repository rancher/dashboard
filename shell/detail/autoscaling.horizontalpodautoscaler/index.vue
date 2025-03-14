<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import InfoBox from '@shell/components/InfoBox';
import camelCase from 'lodash/camelCase';
import keys from 'lodash/keys';
import startCase from 'lodash/startCase';
import { findBy } from '@shell/utils/array';
import { get } from '@shell/utils/object';

export default {
  emits: ['input'],

  components: {
    InfoBox,
    ResourceTabs,
    Tab,
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      default: 'view',
      type:    String,
    },
    value: {
      required: true,
      type:     Object,
    },
  },

  data() {
    return {};
  },

  computed: {
    mappedMetrics() {
      const {
        spec: { metrics = [] },
        status: { currentMetrics = [] },
      } = this.value;

      return metrics.map((metric) => {
        const currentMetricsKVs = [];
        let currentMatch;
        const metricType = camelCase(metric.type);
        const metricValue = get(metric, camelCase(metric.type));
        const targetType = metricValue?.target?.type;

        // The format is different between 'Resource' metrics and others.
        // See for examples: https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/#appendix-horizontal-pod-autoscaler-status-conditions
        if (metricType !== 'resource') {
          currentMatch = findBy(currentMetrics, `${ metricType }.metric.name`, metricValue.metric.name);
        } else {
          currentMatch = findBy(currentMetrics, 'resource.name', metric.resource.name);
        }

        const current = currentMatch ? get(currentMatch, `${ camelCase(metric.type) }.current`) : null;

        if (current) {
          keys(current).forEach((k) => {
            currentMetricsKVs.push({
              targetName:  startCase(k),
              targetValue: current[k],
            });
          });
        }

        const out = {
          metricName:    metricValue?.metric?.name ?? null,
          metricSource:  metric.type,
          targetName:    targetType ?? null,
          targetValue:   null,
          subRowContent: {
            objectApiVersion: metricValue?.describedObject?.apiVersion ?? null,
            objectKind:       metricValue?.describedObject?.kind ?? null,
            objectName:       metricValue?.describedObject?.name ?? null,
            resourceName:     metricValue?.name || metricValue?.metric?.name || null,
            currentMetrics:   currentMetricsKVs,
          },
        };

        if (targetType) {
          if (targetType === 'Utilization') {
            out.targetValue = metricValue.target.averageUtilization;
          } else {
            out.targetValue = get(metricValue.target, camelCase(targetType));
          }
        }

        return out;
      });
    },
  },
};
</script>

<template>
  <ResourceTabs
    :value="value"
    :mode="mode"
    @update:value="$emit('input', $event)"
  >
    <Tab
      name="metrics"
      :label="t('hpa.tabs.metrics')"
      class="bordered-table hpa-metrics-table"
      :weight="4"
    >
      <div
        v-for="(metric, index) in mappedMetrics"
        :key="index"
      >
        <InfoBox>
          <div class="row info-row">
            <div class="col span-6 info-column">
              <h4>
                <t
                  k="hpa.detail.metricHeader"
                  :source="metric.metricSource"
                />
              </h4>
              <div
                v-if="metric.metricName"
                class="mb-5"
              >
                <label class="text-label">
                  <t k="hpa.metrics.headers.metricName" />:
                </label>
                <span>{{ metric.metricName }}</span>
              </div>
              <div class="mb-5">
                <label class="text-label">
                  <t k="hpa.metrics.headers.targetName" />:
                </label>
                <span>{{ metric.targetName }}</span>
              </div>
              <div class="mb-5">
                <label class="text-label">
                  <t k="hpa.metrics.headers.value" />:
                </label>
                <span :data-testid="`resource-metrics-value-${metric.subRowContent.resourceName}`">{{ metric.targetValue }}</span>
              </div>
              <div v-if="metric.metricSource === 'Object'">
                <div class="mb-5">
                  <label class="text-label">
                    <t k="hpa.objectReference.api.label" />:
                  </label>
                  <span>{{ metric.subRowContent.objectApiVersion }}</span>
                </div>
                <div class="mb-5">
                  <label class="text-label">
                    <t k="hpa.objectReference.kind.label" />:
                  </label>
                  <span>{{ metric.subRowContent.objectKind }}</span>
                </div>
                <div class="mb-5">
                  <label class="text-label">
                    <t k="hpa.objectReference.name.label" />:
                  </label>
                  <span>{{ metric.subRowContent.objectName }}</span>
                </div>
              </div>
              <div v-if="metric.metricSource === 'Resource'">
                <div class="mb-5">
                  <label class="text-label">
                    <t k="hpa.metrics.headers.resource" />:
                  </label>
                  <span :data-testid="`resource-metrics-name-${metric.subRowContent.resourceName}`">{{ metric.subRowContent.resourceName }}</span>
                </div>
              </div>
            </div>
            <div class="col span-6">
              <h4><t k="hpa.detail.currentMetrics.header" /></h4>
              <div
                v-if="(metric.subRowContent.currentMetrics || []).length > 0"
              >
                <div
                  v-for="(current, currentIndex) in metric.subRowContent
                    .currentMetrics"
                  :key="`${currentIndex}${current.targetName}`"
                >
                  <div class="mb-5">
                    <label class="text-label">
                      {{ current.targetName }}:
                    </label>
                    <span :data-testid="`current-metrics-${current.targetName}-${metric.subRowContent.resourceName}`">{{ current.targetValue }}</span>
                  </div>
                </div>
              </div>
              <div v-else>
                <t k="hpa.detail.currentMetrics.noMetrics" />
              </div>
            </div>
          </div>
        </InfoBox>
      </div>
    </Tab>
    <Tab
      v-if="!!value.spec.behavior"
      name="behavior"
      :label="t('hpa.tabs.behavior')"
      class="bordered-table hpa-behavior-table"
      :weight="3"
    >
      <div
        v-for="(type, i) in ['scaleDown', 'scaleUp']"
        :key="i"
      >
        <InfoBox v-if="!!value.spec.behavior[type]">
          <div class="row info-row">
            <div class="col span-6 info-column">
              <h4>
                <t
                  :k="`hpa.${type}Rules.label`"
                />
              </h4>
            </div>
          </div>
          <div class="row">
            <div class="col span-6 info-column">
              <label class="text-label"><t k="hpa.scalingRule.policyHeader" /></label>
              <ul
                v-for="(current, currentIndex) in value.spec.behavior[type].policies"
                :key="currentIndex"
              >
                <li>
                  <span>{{ current.value }}</span>
                  <span>{{ current.type }}</span>
                  <span>(for {{ current.periodSeconds }}s)</span>
                </li>
              </ul>
            </div>
            <div class="col span-6">
              <div class="mb-5">
                <label class="text-label"><t k="hpa.scalingRule.selectPolicy" />: </label>
                <span>{{ value.spec.behavior[type].selectPolicy }}</span>
              </div>
              <div class="mb-5">
                <label class="text-label"><t k="hpa.scalingRule.stabilizationWindowSeconds" />: </label>
                <span>{{ value.spec.behavior[type].stabilizationWindowSeconds }}s</span>
              </div>
            </div>
          </div>
        </InfoBox>
      </div>
    </Tab>
  </ResourceTabs>
</template>

<style lang="scss" scoped>
.hpa-metrics-table {
  .info-box :deep() {
    background-color: var(--simple-box-bg);
  }
  .row {
    .over-hr {
      padding-right: 30px;
    }
  }
}
</style>
