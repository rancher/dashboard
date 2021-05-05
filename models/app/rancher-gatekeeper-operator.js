import { MODE, _CREATE } from '@/config/query-params';
import { GATEKEEPER } from '@/config/types';
import { downloadFile } from '@/utils/download';

export default {
  _availableActions() {
    const toFilter = ['cloneYaml'];
    let out = this._standardActions;
    const downloadAction = out.find(a => a?.action === 'download');
    const removeMatch = out.find(a => a.action === 'promptRemove');

    if (downloadAction) {
      downloadAction.enabled = true;
    }

    if (removeMatch) {
      removeMatch.label = 'Disable';
    }

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    return [
      {
        action:  'goToAddConstraint',
        label:   'Add Constraint',
      },
      {
        action:  'goToAddTemplate',
        label:   'Add Template',
      },
      ...out,
    ];
  },

  appEditUrl() {
    const router = this.currentRouter();

    return router.resolve({ name: router.currentRoute.name }).href;
  },

  goToAddConstraint() {
    return (moreQuery = {}) => {
      const location = {
        name:  'c-cluster-gatekeeper-constraints-create',
        query: {
          [MODE]: _CREATE,
          ...moreQuery
        }
      };

      this.currentRouter().push(location);
    };
  },

  goToAddTemplate() {
    return (moreQuery = {}) => {
      const location = {
        name:   'c-cluster-resource-create',
        params: { resource: GATEKEEPER.CONSTRAINT_TEMPLATE },
        query:  {
          [MODE]: _CREATE,
          ...moreQuery
        }
      };

      this.currentRouter().push(location);
    };
  },

  download() {
    downloadFile(`${ this.nameDisplay }.yaml`, this.spec.valuesYaml, 'application/yaml');
  },
};
