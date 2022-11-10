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
        const metricValue = get(metric, camelCase(metric.type));
        const targetType = metricValue?.target?.type;
        const currentMatch = findBy(currentMetrics, 'type', metric.type);
        const current = currentMatch ? get(currentMatch, `${ camelCase(metric.type) }.current`) : null;
        const currentMetricsKVs = [];

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
            resourceName:     metricValue?.name ?? null,
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
    v-model="value"
    :mode="mode"
  >
    <Tab
      name="metrics"
      :label="t('hpa.tabs.metrics')"
      class="bordered-table hpa-metrics-table"
      :weight="3"
    >
      <div
        v-for="(metric, index) in mappedMetrics"
        :key="`${index}${metric.metricName}`"
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
                <span>{{ metric.targetValue }}</span>
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
                  <span>{{ metric.subRowContent.resourceName }}</span>
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
                    <span>{{ current.targetValue }}</span>
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
  </ResourceTabs>
</template>

<style lang="scss" scoped>
.hpa-metrics-table {
  .info-box ::v-deep {
    background-color: var(--simple-box-bg);
  }
  .row {
    .over-hr {
      padding-right: 30px;
    }
  }
}
</style>
