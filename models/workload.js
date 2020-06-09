import { POD } from '@/config/types';

export default {
  // remove clone as yaml/edit as yaml until API supported
  _availableActions() {
    let out = this._standardActions;

    const toFilter = ['cloneYaml'];

    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    }).map((action) => {
      if (action.action === 'viewEditYaml') {
        action.label = 'View as YAML';
      }

      return action;
    });

    return out;
  },

  findPods() {
    return (store) => {
    // use selector to find pods
      const { matchLabels } = this?.spec?.selector;
      let labelSelector = '';

      if (matchLabels) {
        Object.keys(matchLabels).forEach((key) => {
          labelSelector += `${ key }=${ matchLabels[key] },`;
        });
      }
      labelSelector = labelSelector.slice(0, -1);
      const opt = { filter: { labelSelector } };

      opt.url = store.getters['cluster/urlFor'](POD, null, opt);

      return store.dispatch('cluster/request', opt ).then(res => res.data);
    };
  }
};
