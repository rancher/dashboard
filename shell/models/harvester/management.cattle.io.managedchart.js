import { HCI } from '@shell/config/types';
import { clone } from '@shell/utils/object';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class HciManagedChart extends SteveModel {
  get availableActions() {
    let out = super._availableActions;
    const toFilter = ['goToClone', 'cloneYaml', 'goToViewYaml', 'goToViewConfig', 'promptRemove', 'goToEditYaml', 'download'];

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    const editAction = out.find(action => action.action === 'goToEdit');

    if (editAction) {
      editAction.label = this.t('advancedSettings.edit.label');
    }

    return out;
  }

  get canCustomEdit() {
    return true;
  }

  get hasCustomized() {
    const clonedValue = clone(this.spec.values.prometheus.prometheusSpec);

    delete clonedValue.storageSpec;
    const sort = Object.keys(clonedValue).sort();

    return JSON.stringify(clonedValue, sort) !== JSON.stringify(this.defaultValue, sort);
  }

  get displayName() {
    return this.$rootGetters['i18n/t']('harvester.setting.harvesterMonitoring.label');
  }

  get doneOverride() {
    const detailLocation = clone(this.listLocation);

    detailLocation.params.resource = HCI.SETTING;

    return detailLocation;
  }

  get parentLocationOverride() {
    return {
      ...this.listLocation,
      params: {
        ...this.listLocation.params,
        resource: HCI.SETTING
      }
    };
  }

  get detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = HCI.MANAGED_CHART;

    return detailLocation;
  }

  get customValue() {
    const spec = this.spec.values.prometheus.prometheusSpec;

    return spec ? JSON.stringify(spec, null, 2) : '';
  }

  get defaultValue() {
    return {
      evaluationInterval: '1m',
      scrapeInterval:     '1m',
      retention:          '5d',
      retentionSize:      '50GiB',
      resources:          {
        limits: {
          cpu:    '1000m',
          memory: '3000Mi'
        },
        requests: {
          cpu:    '750m',
          memory: '750Mi'
        }
      }
    };
  }

  get customValidationRules() {
    const rules = [
      {
        nullable:       false,
        path:           'spec.values.prometheus.prometheusSpec.scrapeInterval',
        required:       true,
        translationKey: 'monitoring.prometheus.config.scrape'
      },
      {
        nullable:       false,
        path:           'spec.values.prometheus.prometheusSpec.evaluationInterval',
        required:       true,
        translationKey: 'monitoring.prometheus.config.evaluation'
      },
      {
        nullable:       false,
        path:           'spec.values.prometheus.prometheusSpec.retention',
        required:       true,
        translationKey: 'monitoring.prometheus.config.retention'
      },
      {
        nullable:       false,
        path:           'spec.values.prometheus.prometheusSpec.retentionSize',
        required:       true,
        translationKey: 'monitoring.prometheus.config.retentionSize'
      },
      {
        nullable:       false,
        path:           'spec.values.prometheus.prometheusSpec.resources.requests.cpu',
        required:       true,
        translationKey: 'monitoring.prometheus.config.requests.cpu'
      },
      {
        nullable:       false,
        path:           'spec.values.prometheus.prometheusSpec.resources.requests.memory',
        required:       true,
        translationKey: 'monitoring.prometheus.config.requests.memory'
      },
      {
        nullable:       false,
        path:           'spec.values.prometheus.prometheusSpec.resources.limits.cpu',
        required:       true,
        translationKey: 'monitoring.prometheus.config.limits.cpu'
      },
      {
        nullable:       false,
        path:           'spec.values.prometheus.prometheusSpec.resources.limits.memory',
        required:       true,
        translationKey: 'monitoring.prometheus.config.limits.memory'
      },
    ];

    return rules;
  }
}
