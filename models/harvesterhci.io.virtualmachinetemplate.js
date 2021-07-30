import { HCI } from '@/config/types';
import { MODE, _CREATE } from '@/config/query-params';

export default {
  availableActions() {
    const toFilter = ['goToEdit', 'cloneYaml', 'goToClone', 'goToEditYaml', 'download'];

    const out = this._standardActions.filter((action) => {
      if (action.altAction === 'remove') {
        action.bulkable = false;
      }

      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    return [
      {
        action:     'createFromTemplate',
        enabled:    true,
        icon:       'icons icon-h-display',
        label:      this.t('harvester.action.createVM'),
      },
      {
        action:     'addVersion',
        enabled:    true,
        icon:       'icon icon-fw icon-circle-plus',
        label:      this.t('harvester.action.addTemplateVersion'),
      },
      ...out
    ];
  },

  createFromTemplate() {
    return () => {
      const router = this.currentRouter();

      router.push({
        name:   `c-cluster-product-resource-create`,
        params: { resource: HCI.VM },
        // query:  { templateId: this.id, version: this.spec.defaultVersionId }
        query:  { templateId: this.id, versionId: this.spec.defaultVersionId }
      });
    };
  },

  addVersion() {
    return (moreQuery = {}) => {
      const router = this.currentRouter();

      router.push({
        name:   `c-cluster-product-resource-create`,
        params: { resource: HCI.VM_VERSION },
        query:  {
          [MODE]:     _CREATE,
          templateId: this.id
        }
      });
    };
  },

  defaultVersionId() {
    return this.spec?.defaultVersionId;
  },

  defaultVersion() {
    return this.status?.defaultVersion;
  },
};
