import { _EDIT, MODE } from '@shell/config/query-params';
import isEqual from 'lodash/isEqual';
import { HCI } from '../../types';
import { clone } from '@shell/utils/object';
import HarvesterResource from '../harvester';
import { PRODUCT_NAME as HARVESTER_PRODUCT } from '../../config/harvester';

export default class HciManagedChart extends HarvesterResource {
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

  get hasCustomized() {
    const clonedValue = clone({
      prometheus:                 this.spec.values.prometheus.prometheusSpec,
      'prometheus-node-exporter': this.spec.values['prometheus-node-exporter']
    });

    delete clonedValue.prometheus.storageSpec;

    return !isEqual(clonedValue.prometheus, this.defaultValue.prometheus) || !isEqual(clonedValue['prometheus-node-exporter'], this.defaultValue['prometheus-node-exporter']);
  }

  get doneOverride() {
    return this.detailLocation;
  }

  get parentLocationOverride() {
    return this.doneOverride;
  }

  get detailLocation() {
    return {
      name:      `${ HARVESTER_PRODUCT }-c-cluster-resource-namespace-id`,
      params:    {
        resource: HCI.MANAGED_CHART, namespace: 'fleet-local', id: this.metadata.name
      },
      query: { [MODE]: _EDIT }
    };
  }

  get customValue() {
    const out = {
      prometheus:                 this.spec.values.prometheus.prometheusSpec,
      'prometheus-node-exporter': this.spec.values['prometheus-node-exporter']
    };

    return out ? JSON.stringify(out, null, 2) : '';
  }

  get defaultValue() {
    return {
      prometheus: {
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
      },
      'prometheus-node-exporter': {
        resources: {
          limits: {
            cpu:    '200m',
            memory: '180Mi'
          },
          requests: {
            cpu:    '100m',
            memory: '30Mi'
          }
        }
      },
      grafana: {
        resources: {
          limits: {
            cpu:    '200m',
            memory: '500Mi'
          },
          requests: {
            cpu:    '100m',
            memory: '200Mi'
          }
        }
      },
      alertmanager: {
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
      }
    };
  }

  get customValidationRules() {
    let rules = [];

    if (this.metadata.name === 'rancher-monitoring') {
      rules = [
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
        {
          nullable:       false,
          path:           `spec.values.prometheus-node-exporter.resources.requests.cpu`,
          required:       true,
          translationKey: 'monitoring.prometheus.config.requests.cpu'
        },
        {
          nullable:       false,
          path:           `spec.values.prometheus-node-exporter.resources.requests.memory`,
          required:       true,
          translationKey: 'monitoring.prometheus.config.requests.memory'
        },
        {
          nullable:       false,
          path:           `spec.values.prometheus-node-exporter.resources.limits.cpu`,
          required:       true,
          translationKey: 'monitoring.prometheus.config.limits.cpu'
        },
        {
          nullable:       false,
          path:           `spec.values.prometheus-node-exporter.resources.limits.memory`,
          required:       true,
          translationKey: 'monitoring.prometheus.config.limits.memory'
        },
        {
          nullable:       false,
          path:           'spec.values.grafana.resources.requests.cpu',
          required:       true,
          translationKey: 'monitoring.prometheus.config.requests.cpu'
        },
        {
          nullable:       false,
          path:           'spec.values.grafana.resources.requests.memory',
          required:       true,
          translationKey: 'monitoring.prometheus.config.requests.memory'
        },
        {
          nullable:       false,
          path:           'spec.values.grafana.resources.limits.cpu',
          required:       true,
          translationKey: 'monitoring.prometheus.config.limits.cpu'
        },
        {
          nullable:       false,
          path:           'spec.values.grafana.resources.limits.memory',
          required:       true,
          translationKey: 'monitoring.prometheus.config.limits.memory'
        },
        {
          nullable:       false,
          path:           'spec.values.alertmanager.alertmanagerSpec.retention',
          required:       true,
          translationKey: 'monitoring.prometheus.config.retention'
        },
        {
          nullable:       false,
          path:           'spec.values.alertmanager.alertmanagerSpec.resources.requests.cpu',
          required:       true,
          translationKey: 'monitoring.prometheus.config.requests.cpu'
        },
        {
          nullable:       false,
          path:           'spec.values.alertmanager.alertmanagerSpec.resources.requests.memory',
          required:       true,
          translationKey: 'monitoring.prometheus.config.requests.memory'
        },
        {
          nullable:       false,
          path:           'spec.values.alertmanager.alertmanagerSpec.resources.limits.cpu',
          required:       true,
          translationKey: 'monitoring.prometheus.config.limits.cpu'
        },
        {
          nullable:       false,
          path:           'spec.values.alertmanager.alertmanagerSpec.resources.limits.memory',
          required:       true,
          translationKey: 'monitoring.prometheus.config.limits.memory'
        },
      ];
    }

    if (this.metadata.name === 'rancher-logging') {
      rules = [
        {
          nullable:       false,
          path:           'spec.values.additionalLoggingSources.fluentbit.resources.requests.cpu',
          required:       true,
          translationKey: 'monitoring.prometheus.config.requests.cpu'
        },
        {
          nullable:       false,
          path:           'spec.values.additionalLoggingSources.fluentbit.resources.requests.memory',
          required:       true,
          translationKey: 'monitoring.prometheus.config.requests.memory'
        },
        {
          nullable:       false,
          path:           'spec.values.additionalLoggingSources.fluentbit.resources.limits.cpu',
          required:       true,
          translationKey: 'monitoring.prometheus.config.limits.cpu'
        },
        {
          nullable:       false,
          path:           'spec.values.additionalLoggingSources.fluentbit.resources.limits.memory',
          required:       true,
          translationKey: 'monitoring.prometheus.config.limits.memory'
        },
        {
          nullable:       false,
          path:           'spec.values.additionalLoggingSources.fluentd.resources.requests.cpu',
          required:       true,
          translationKey: 'monitoring.prometheus.config.requests.cpu'
        },
        {
          nullable:       false,
          path:           'spec.values.additionalLoggingSources.fluentd.resources.requests.memory',
          required:       true,
          translationKey: 'monitoring.prometheus.config.requests.memory'
        },
        {
          nullable:       false,
          path:           'spec.values.additionalLoggingSources.fluentd.resources.limits.cpu',
          required:       true,
          translationKey: 'monitoring.prometheus.config.limits.cpu'
        },
        {
          nullable:       false,
          path:           'spec.values.additionalLoggingSources.fluentd.resources.limits.memory',
          required:       true,
          translationKey: 'monitoring.prometheus.config.limits.memory'
        },
      ];
    }

    return rules;
  }
}
