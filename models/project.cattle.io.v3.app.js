import { addParams } from '@/utils/url';
import { MODE, _EDIT } from '@/config/query-params';

const GATEKEEPER_DEFAULT_ID = 'rancher-gatekeeper-operator';

export default {
  isGateKeeper() {
    return this.id.includes(GATEKEEPER_DEFAULT_ID);
  },
  availableActions() {
    const { isGateKeeper } = this;
    let out = this._standardActions.slice();

    if (isGateKeeper) {
      const toFilter = ['cloneYaml'];

      out = out.filter((action) => {
        if (!toFilter.includes(action.action)) {
          return action;
        }
      });
    }

    return out;
  },

  appEditUrl() {
    const { isGateKeeper } = this;
    const router = this.currentRouter();

    if (isGateKeeper) {
      const url = router.resolve({ name: router.currentRoute.name }).href;

      return url;
    } else {
      return this.detailUrl();
    }
  },

  goToEdit() {
    return (moreQuery = {}) => {
      const url = addParams(this.appEditUrl, { [MODE]: _EDIT, ...moreQuery });

      this.currentRouter().push({ path: url });
    };
  },
};
