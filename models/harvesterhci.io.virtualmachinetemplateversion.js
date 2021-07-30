import Vue from 'vue';
import find from 'lodash/find';
import { HCI } from '@/config/types';
import {
  AS, MODE, _VIEW, _CONFIG, _UNFLAG, _EDIT
} from '@/config/query-params';

export default {
  availableActions() {
    let out = this._standardActions;
    const toFilter = ['goToClone', 'cloneYaml', 'goToViewConfig', 'goToEditYaml', 'goToViewYaml'];

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    return [
      {
        action:     'launchFromTemplate',
        icon:       'icons icon-h-display',
        label:      this.t('harvester.action.launchFormTemplate'),
      },
      {
        action:     'cloneTemplate',
        icon:       'icon icon-fw icon-edit',
        label:      this.t('harvester.action.modifyTemplate'),
      },
      {
        action:     'setDefaultVersion',
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
  },

  applyDefaults() {
    return () => {
      const spec = {
        vm: {
          dataVolumeTemplates: [],
          running:             true,
          template:            {
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
                  requests: {
                    memory: null,
                    // cpu:    ''
                  },
                  // limits: {
                  //   memory: null,
                  //   cpu:    ''
                  // }
                }
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
      };

      Vue.set(this, 'spec', spec);
    };
  },

  template() {
    return this.$rootGetters['virtual/all'](HCI.VM_TEMPLATE).find((T) => {
      return T.id === this.spec.templateId;
    });
  },

  version() {
    return this?.status?.version;
  },

  templates() {
    return this.$rootGetters['virtual/all'](HCI.VM_TEMPLATE);
  },

  machineType() {
    return this.vm?.spec?.template?.spec?.domain?.machine?.type || '';
  },

  templateId() {
    return this.spec.templateId;
  },

  launchFromTemplate() {
    return () => {
      const templateResource = this.currentTemplate;
      const templateId = templateResource.id;
      const launchVersion = this.id;
      const router = this.currentRouter();

      router.push({
        name:   `c-cluster-product-resource-create`,
        params: { resource: HCI.VM },
        query:  { templateId, versionId: launchVersion }
      });
    };
  },

  // cloneTemplate() {
  //   return (moreQuery = {}) => {
  //     const router = this.currentRouter();

  //     router.push({
  //       name:   `c-cluster-product-resource-create`,
  //       params: { resource: HCI.VM_VERSION },
  //       query:  {
  //         [MODE]:     _CREATE,
  //         templateId: this.templateId,
  //         versionId:  this.id,
  //       }
  //     });
  //   };
  // },

  cloneTemplate() {
    return (moreQuery = {}) => {
      const location = this.detailLocation;

      location.query = {
        ...location.query,
        [MODE]: _EDIT,
        [AS]:   _UNFLAG,
        ...moreQuery
      };

      this.currentRouter().push(location);
    };
  },

  goToViewConfig() {
    return (moreQuery = {}) => {
      const location = this.detailLocation;

      location.query = {
        ...location.query,
        [MODE]:     _VIEW,
        [AS]:       _CONFIG,
        templateId: this.templateId,
        ...moreQuery
      };

      this.currentRouter().push(location);
    };
  },

  currentTemplate() {
    return find(this.templates, T => T.id === this.templateId);
  },

  setDefaultVersion() {
    return async(moreQuery = {}) => {
      const templateResource = this.currentTemplate;

      templateResource.spec.defaultVersionId = this.id;
      await templateResource.save();
    };
  },

  defaultVersion() {
    const templates = this.$rootGetters['virtual/all'](HCI.VM_TEMPLATE);
    const template = templates.find(T => this.templateId === T.id);

    return template?.status?.defaultVersion;
  },

  customValidationRules() {
    const rules = [
      {
        nullable:       false,
        path:           'spec.vm.template.spec.domain.cpu.cores',
        min:            1,
        max:            100,
        required:       true,
        translationKey: 'harvester.fields.cpu',
      },
      {
        nullable:       false,
        path:           'spec.vm.template.spec.domain.resources.requests.memory',
        required:       false,
        translationKey: 'harvester.fields.memory',
        validators:     ['vmMemoryUnit'],
      },
      {
        nullable:       false,
        path:           'spec.vm.template.spec',
        validators:     ['vmNetworks'],
      },
      {
        nullable:       false,
        path:           'spec.vm',
        validators:     ['vmDisks:isVMTemplate'],
      },
    ];

    return rules;
  },
};
