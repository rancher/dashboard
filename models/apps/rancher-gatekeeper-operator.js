import { MODE, _CREATE } from '@/config/query-params';
import { addParams } from '@/utils/url';
import { GATEKEEPER_CONSTRAINT_TEMPLATE } from '@/config/types';

export default {
  availableActions() {
    let out = this._availableActions;

    const toFilter = ['cloneYaml'];

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    const removeMatch = out.find(a => a.action === 'promptRemove');

    if (removeMatch) {
      removeMatch.label = 'Disable';
    }

    return [
      {
        action:  'goToAddConstraint',
        label:   'Add Constraint',
      },
      {
        action:  'goToAddTemplate',
        label:   'Add Template',
      },
      ...out
    ];
  },

  appEditUrl() {
    const router = this.currentRouter();

    return router.resolve({ name: router.currentRoute.name }).href;
  },

  goToAddConstraint() {
    return (moreQuery = {}) => {
      const constraintUrl = this.currentRouter().resolve({ name: 'c-cluster-gatekeeper-constraints-create' }).href;
      const url = addParams(constraintUrl, {
        [MODE]:   _CREATE,
        ...moreQuery
      });

      this.currentRouter().push({ path: url });
    };
  },

  goToAddTemplate() {
    return (moreQuery = {}) => {
      const constraintUrl = this.currentRouter().resolve({ name: 'c-cluster-resource-create', params: { resource: GATEKEEPER_CONSTRAINT_TEMPLATE } }).href;
      const url = addParams(constraintUrl, {
        [MODE]:   _CREATE,
        ...moreQuery
      });

      this.currentRouter().push({ path: url });
    };
  },
};
