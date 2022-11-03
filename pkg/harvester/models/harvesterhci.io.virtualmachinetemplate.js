import { HCI } from '../types';
import { MODE, _CREATE } from '@shell/config/query-params';
import HarvesterResource from './harvester';
import { PRODUCT_NAME as HARVESTER_PRODUCT } from '../config/harvester';

export default class HciVmTemplate extends HarvesterResource {
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

    const schema = this.$getters['schemaFor'](HCI.VM);
    let canCreateVM = true;

    if ( schema && !schema?.collectionMethods.find(x => ['post'].includes(x.toLowerCase())) ) {
      canCreateVM = false;
    }

    return [
      {
        action:     'createFromTemplate',
        enabled:    canCreateVM,
        icon:       'icon icon-spinner',
        label:      this.t('harvester.action.createVM'),
      },
      {
        action:     'addVersion',
        enabled:    this.canCreate,
        icon:       'icon icon-fw icon-circle-plus',
        label:      this.t('harvester.action.addTemplateVersion'),
      },
      ...out
    ];
  }

  createFromTemplate() {
    const router = this.currentRouter();

    router.push({
      name:   `${ HARVESTER_PRODUCT }-c-cluster-resource-create`,
      params: { resource: HCI.VM },
      query:  { templateId: this.id, versionId: this.spec.defaultVersionId }
    });
  }

  addVersion(moreQuery = {}) {
    const router = this.currentRouter();

    router.push({
      name:   `${ HARVESTER_PRODUCT }-c-cluster-resource-create`,
      params: { resource: HCI.VM_VERSION },
      query:  {
        [MODE]:     _CREATE,
        templateId: this.id
      }
    });
  }

  get defaultVersion() {
    return this.status?.defaultVersion;
  }
}
