import { UI_CONFIG_CLUSTER_DASHBOARD_CARD, UI_CONFIG_TABLE_ACTION } from '@shell/core/types';

function checkExtensionRouteBinding({ name, params, query }, locationConfig) {
  // console.log('name && params', name, params);

  // if no configuration is passed, consider it as global
  if (!Object.keys(locationConfig).length) {
    return true;
  }

  // "params" to be checked based on the locationConfig
  const paramsToCheck = [
    'product',
    'resource',
    'namespace',
    'cluster',
    'id',
    'mode'
  ];

  let res = false;

  for (let i = 0; i < paramsToCheck.length; i++) {
    const param = paramsToCheck[i];

    if (locationConfig[param]) {
      // handle "product" in a separate way...
      if (param === 'product') {
        if (locationConfig[param] === 'home' && !name.startsWith('c-')) {
          res = true;
        } else if (locationConfig[param] === 'explorer' && name.startsWith('c-')) {
          res = true;
        } else if (locationConfig[param] === params[param]) {
          res = true;
        } else {
          res = false;
          break;
        }
        // also handle "mode" in a separate way because it mainly depends on query params
      } else if (param === 'mode') {
        if (locationConfig[param] === 'edit' && query.mode && query.mode === 'edit') {
          res = true;
        } else if (locationConfig[param] === 'config' && query.as && query.as === 'config') {
          res = true;
        } else if (locationConfig[param] === 'detail' && name.includes('-id')) {
          res = true;
        } else if (locationConfig[param] === 'list' && !name.includes('-id')) {
          res = true;
        } else {
          res = false;
          break;
        }
      } else if (locationConfig[param] === params[param]) {
        res = true;
      } else {
        res = false;
        break;
      }
    } else {
      continue;
    }
  }

  return res;
}

export function getApplicableExtensionEnhancements(pluginCtx, uiArea, currRoute, translationCtx = pluginCtx) {
  const extensionEnhancements = [];
  const actions = pluginCtx.$plugin.getUIConfig(uiArea);

  actions.forEach((action, i) => {
    if (checkExtensionRouteBinding(currRoute, action.locationConfig)) {
      // intercept to apply translation when dealing with adding a card to cluster dashboard view
      if ((uiArea === UI_CONFIG_CLUSTER_DASHBOARD_CARD || uiArea === UI_CONFIG_TABLE_ACTION) && action.labelKey) {
        actions[i].label = translationCtx.t(action.labelKey);
      }

      extensionEnhancements.push(action);
    }
  });

  return extensionEnhancements;
}
