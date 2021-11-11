import { HCI } from '@/config/types';
import { MODE, _CREATE } from '@/config/query-params';
import SteveModel from '@/plugins/steve/steve-class';

export default class HciVmTemplate extends SteveModel {
  get availableActions() {
    const toFilter = ['goToEdit', 'cloneYaml', 'goToClone', 'goToEditYaml', 'download'];

    const out = super._availableActions.filter((action) => {
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
        icon:       'icon plus',
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
  }

  createFromTemplate() {
    const router = this.currentRouter();

    router.push({
      name:   `c-cluster-product-resource-create`,
      params: { resource: HCI.VM },
      query:  { templateId: this.id, versionId: this.spec.defaultVersionId }
    });
  }

  addVersion(moreQuery = {}) {
    const router = this.currentRouter();

    router.push({
      name:   `c-cluster-product-resource-create`,
      params: { resource: HCI.VM_VERSION },
      query:  {
        [MODE]:     _CREATE,
        templateId: this.id
      }
    });
  }

  get defaultVersionId() {
    return this.spec?.defaultVersionId;
  }

  get defaultVersion() {
    return this.status?.defaultVersion;
  }
}
