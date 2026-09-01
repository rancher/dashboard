import SteveModel from '@shell/plugins/steve/steve-class';

export default class HPA extends SteveModel {
  get customValidationRules() {
    return [
      {
        nullable:       false,
        path:           'metadata.name',
        required:       true,
        translationKey: 'generic.name',
        type:           'dnsLabel',
      },
    ];
  }

  get details() {
    const { spec = {}, status } = this;
    const out = [
      {
        label:   spec?.scaleTargetRef?.kind ?? this.t('hpa.tabs.workload'),
        content: spec?.scaleTargetRef?.name,
      },
      {
        label:   this.t('hpa.workloadTab.min'),
        content: spec?.minReplicas,
      },
      {
        label:   this.t('hpa.workloadTab.max'),
        content: spec?.maxReplicas,
      },
      {
        label:   this.t('hpa.workloadTab.current'),
        content: status?.currentReplicas ?? 0,
      },
      {
        label:     this.t('hpa.workloadTab.last'),
        content:   status?.lastScaleTime,
        formatter: 'LiveDate',
      }
    ];

    return out;
  }
}
