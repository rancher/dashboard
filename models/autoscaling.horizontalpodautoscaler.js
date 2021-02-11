import { get } from '@/utils/object';
import { camelCase } from 'lodash';

export default {
  // if not a function it does exist, why?
  customValidationRules() {
    return [
      {
        nullable:       false,
        path:           'metadata.name',
        required:       true,
        translationKey: 'generic.name',
        type:           'dnsLabel',
      },
    ];
  },

  details() {
    const { spec = {}, status } = this;
    const out = [
      {
        label:     this.t('hpa.tabs.workload'),
        content:   spec?.scaleTargetRef?.name,
      },
      {
        label:     this.t('hpa.workloadTab.min'),
        content: spec?.minReplicas,
      },
      {
        label:     this.t('hpa.workloadTab.max'),
        content: spec?.maxReplicas,
      },
      {
        label:     this.t('hpa.workloadTab.current'),
        content: status?.currentReplicas ?? 0,
      },
      {
        label:     this.t('hpa.workloadTab.last'),
        content:   status?.lastScaleTime,
        formatter: 'LiveDate',
      }
    ];

    return out;
  },

  mappedMetrics() {
    const { spec: { metrics = [] } } = this;

    return metrics.map((metric) => {
      const metricValue = get(metric, camelCase(metric.type));
      const targetType = metricValue?.target?.type;

      const out = {
        metricName:   metricValue?.metric?.name ?? null,
        metricSource: metric.type,
        objectKind:   metricValue?.describedObject?.kind ?? null,
        objectName:   metricValue?.describedObject?.name ?? null,
        resourceName: metricValue?.name ?? null,
        targetName:   targetType ?? null,
        targetValue:  null,
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

};
