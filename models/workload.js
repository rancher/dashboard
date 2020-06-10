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
};
