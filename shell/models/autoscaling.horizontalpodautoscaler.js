import SteveModel from '@shell/plugins/steve/steve-class';
import { apiGroupOf, findIfExists, relatedEntry, typeForKind } from '@shell/utils/editable-related-resources';

export default class HPA extends SteveModel {
  /**
   * The resources related to this autoscaler, to edit by YAML alongside it
   *
   * Dependencies: the workload named by `spec.scaleTargetRef`, which is in its own namespace
   *
   * @param {import('@shell/core/types').EditableRelatedResourcesFetchOptions} [options]
   * @returns {Promise<import('@shell/core/types').EditableRelatedResource[]>}
   */
  async fetchOwnEditableRelatedResources({ dependencies = true } = {}) {
    const target = this.spec?.scaleTargetRef;

    if (!this.metadata?.uid || !dependencies || !target?.name) {
      return [];
    }

    const workload = await findIfExists(this, typeForKind(apiGroupOf(target.apiVersion), target.kind), `${ this.metadata.namespace }/${ target.name }`);

    return workload ? [relatedEntry(workload)] : [];
  }

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
