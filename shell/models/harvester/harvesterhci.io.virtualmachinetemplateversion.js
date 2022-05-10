import Vue from 'vue';
import find from 'lodash/find';
import { HCI } from '@shell/config/types';
import {
  AS, MODE, _VIEW, _CONFIG, _UNFLAG, _EDIT
} from '@shell/config/query-params';
import { HCI as HCI_ANNOTATIONS } from '@shell/config/labels-annotations';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class HciVmTemplateVersion extends SteveModel {
  get availableActions() {
    let out = super._availableActions;
    const toFilter = ['goToClone', 'cloneYaml', 'goToViewConfig', 'goToEditYaml', 'goToViewYaml'];

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    const schema = this.$getters['schemaFor'](HCI.VM);
    let canCreateVM = true;

    if ( schema && !schema?.collectionMethods.find(x => ['post'].includes(x.toLowerCase())) ) {
      canCreateVM = false;
    }

    return [
      {
        action:     'launchFromTemplate',
        icon:       'icon icon-spinner',
        enabled:    canCreateVM,
        label:      this.t('harvester.action.launchFormTemplate'),
      },
      {
        action:     'cloneTemplate',
        enabled:    this.currentTemplate?.canCreate,
        icon:       'icon icon-fw icon-edit',
        label:      this.t('harvester.action.modifyTemplate'),
      },
      {
        action:     'setDefaultVersion',
        enabled:    this.currentTemplate?.canCreate,
        icon:       'icon icon-fw icon-checkmark',
        label:      this.t('harvester.action.setDefaultVersion'),
      },
      {
        action:     'goToViewConfig',
        label:       this.t('action.view'),
        icon:       'icon icon-edit',
      },
      ...out
    ];
  }

  applyDefaults() {
    const spec = {
      vm: {
        metadata:    { annotations: { [HCI_ANNOTATIONS.VOLUME_CLAIM_TEMPLATE]: '[]' } },
        spec:        {
          runStrategy: 'RerunOnFailure',
          template:             {
            metadata: { annotations: {} },
            spec:     {
              domain: {
                machine: { type: '' },
                cpu:     {
                  cores:   null,
                  sockets: 1,
                  threads: 1
                },
                devices: {
                  inputs: [{
                    bus:  'usb',
                    name: 'tablet',
                    type: 'tablet'
                  }],
                  interfaces: [{
                    masquerade: {},
                    model:      'virtio',
                    name:       'default'
                  }],
                  disks: [],
                },
                resources: {
                  limits: {
                    memory: null,
                    cpu:    ''
                  }
                },
                features: { acpi: { enabled: true } },
              },
              hostname: '',
              networks: [{
                name: 'default',
                pod:  {}
              }],
              volumes: []
            }
          }
        }
      }
    };

    Vue.set(this, 'spec', spec);
  }

  get template() {
    return this.$rootGetters['harvester/all'](HCI.VM_TEMPLATE).find((T) => {
      return T.id === this.spec.templateId;
    });
  }

  get version() {
    return this?.status?.version;
  }

  get templates() {
    return this.$rootGetters['harvester/all'](HCI.VM_TEMPLATE);
  }

  get machineType() {
    return this.vm?.spec?.template?.spec?.domain?.machine?.type || '';
  }

  get templateId() {
    return this.spec.templateId;
  }

  launchFromTemplate() {
    const templateResource = this.currentTemplate;
    const templateId = templateResource.id;
    const launchVersion = this.id;
    const router = this.currentRouter();

    router.push({
      name:   `c-cluster-product-resource-create`,
      params: { resource: HCI.VM },
      query:  { templateId, versionId: launchVersion }
    });
  }

  cloneTemplate(moreQuery = {}) {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]: _EDIT,
      [AS]:   _UNFLAG,
      ...moreQuery
    };

    this.currentRouter().push(location);
  }

  goToViewConfig(moreQuery = {}) {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]:     _VIEW,
      [AS]:       _CONFIG,
      templateId: this.templateId,
      ...moreQuery
    };

    this.currentRouter().push(location);
  }

  get currentTemplate() {
    return find(this.templates, T => T.id === this.templateId);
  }

  async setDefaultVersion(moreQuery = {}) {
    const templateResource = this.currentTemplate;

    templateResource.spec.defaultVersionId = this.id;
    await templateResource.save();
  }

  get defaultVersion() {
    const templates = this.$rootGetters['harvester/all'](HCI.VM_TEMPLATE);
    const template = templates.find(T => this.templateId === T.id);

    return template?.status?.defaultVersion;
  }

  get customValidationRules() {
    const rules = [
      // {
      //   nullable:       false,
      //   path:           'spec.vm.spec.template.spec.domain.cpu.cores',
      //   min:            1,
      //   max:            100,
      //   required:       true,
      //   translationKey: 'harvester.fields.cpu',
      // },
      // {
      //   nullable:       false,
      //   path:           'spec.vm.spec.template.spec.domain.resources.requests.memory',
      //   required:       false,
      //   translationKey: 'harvester.fields.memory',
      // },
      // {
      //   nullable:       false,
      //   path:           'spec.vm.spec.template.spec',
      //   validators:     ['vmNetworks'],
      // },
      // {
      //   nullable:       false,
      //   path:           'spec.vm.spec',
      //   validators:     ['vmDisks:isVMTemplate'],
      // },
    ];

    return rules;
  }
}
