import { ActionLocation, CardLocation, ExtensionPoint } from '@shell/core/types';
import { isMac } from '@shell/utils/platform';
import { ucFirst, randomStr } from '@shell/utils/string';
import { _EDIT, _CONFIG, _DETAIL, _LIST } from '@shell/config/query-params';
import { getProductFromRoute } from '@shell/middleware/authenticated';

function checkRouteProduct({ name, params, query }, locationConfigParam) {
  const product = getProductFromRoute({
    name, params, query
  });

  // alias for the homepage
  if (locationConfigParam === 'home' && name === 'home') {
    return true;
  } else if (locationConfigParam === product) {
    return true;
  }

  return false;
}

function checkRouteMode({ name, query }, locationConfigParam) {
  if (locationConfigParam === _EDIT && query.mode && query.mode === _EDIT) {
    return true;
  } else if (locationConfigParam === _CONFIG && query.as && query.as === _CONFIG) {
    return true;
  } else if (locationConfigParam === _DETAIL && name.includes('-id')) {
    return true;
    // alias to target all list views
  } else if (locationConfigParam === _LIST && !name.includes('-id') && name.includes('-resource')) {
    return true;
  }

  return false;
}

function checkExtensionRouteBinding($route, locationConfig) {
  // if no configuration is passed, consider it as global
  if (!Object.keys(locationConfig).length) {
    return true;
  }

  const { params } = $route;

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
      for (let x = 0; x < locationConfig[param].length; x++) {
        const locationConfigParam = locationConfig[param][x];

        if (locationConfigParam) {
          // handle "product" in a separate way...
          if (param === 'product') {
            res = checkRouteProduct($route, locationConfigParam);
          // also handle "mode" in a separate way because it mainly depends on query params
          } else if (param === 'mode') {
            res = checkRouteMode($route, locationConfigParam);
          } else if (locationConfigParam === params[param]) {
            res = true;
          } else {
            res = false;
          }
        }

        // If a single location config param is good then this is an param (aka ['pods', 'configmap'] = pods or configmaps)
        if (res) {
          break;
        }
      }

      // If a single param (set of location config params) is bad then this is not an acceptable location
      if (!res) {
        break;
      }
    }
  }

  return res;
}

export function getApplicableExtensionEnhancements(pluginCtx, actionType, uiArea, currRoute, translationCtx = pluginCtx) {
  const extensionEnhancements = [];

  // gate it so that we prevent errors on older versions of dashboard
  if (pluginCtx.$plugin?.getUIConfig) {
    const actions = pluginCtx.$plugin.getUIConfig(actionType, uiArea);

    actions.forEach((action, i) => {
      if (checkExtensionRouteBinding(currRoute, action.locationConfig)) {
        // ADD CARD PLUGIN UI ENHANCEMENT
        if (actionType === ExtensionPoint.CARD) {
          // intercept to apply translation
          if (uiArea === CardLocation.CLUSTER_DASHBOARD_CARD && action.labelKey) {
            actions[i].label = translationCtx.t(action.labelKey);
          }

        // ADD ACTION PLUGIN UI ENHANCEMENT
        } else if (actionType === ExtensionPoint.ACTION) {
          // TABLE ACTION
          if (uiArea === ActionLocation.TABLE) {
            // intercept to apply translation
            if (action.labelKey) {
              actions[i].label = translationCtx.t(action.labelKey);
            }

            // sets the enabled flag to true if omitted on the config
            if (!Object.keys(action).includes('enabled')) {
              actions[i].enabled = true;
            }

            // bulkable flag
            actions[i].bulkable = actions[i].multiple || actions[i].bulkable;

            // populate action identifier to prevent errors
            if (!actions[i].action) {
              actions[i].action = `custom-table-action-${ randomStr(10).toLowerCase() }`;
            }
          }

          // extract simplified shortcut definition on plugin - HEADER ACTION
          if (uiArea === ActionLocation.HEADER && action.shortcut) {
            // if it's a string, then assume CTRL for windows and META for mac
            if (typeof action.shortcut === 'string') {
              actions[i].shortcutLabel = () => {
                return isMac ? `(\u2318-${ action.shortcut.toUpperCase() })` : `(Ctrl-${ action.shortcut.toUpperCase() })`;
              };
              actions[i].shortcutKey = { windows: ['ctrl', action.shortcut], mac: ['meta', action.shortcut] };
            // correct check for an Object type in JS... handle the object passed
            } else if (typeof action.shortcut === 'object' && !Array.isArray(action.shortcut) && action.shortcut !== null) {
              actions[i].shortcutKey = action.shortcut;
              const keyboardCombo = isMac ? actions[i].shortcut.mac : actions[i].shortcut.windows ? actions[i].shortcut.windows : [];
              let scLabel = '';

              keyboardCombo.forEach((key, i) => {
                if (i < keyboardCombo.length - 1) {
                  if (key === 'meta') {
                    key = '\u2318';
                  } else {
                    key = ucFirst(key);
                  }
                  scLabel += `${ key }`;
                  scLabel += '-';
                } else {
                  scLabel += `${ key.toUpperCase() }`;
                }
              });

              actions[i].shortcutLabel = () => {
                return `(${ scLabel })`;
              };
            }
          }
        }

        extensionEnhancements.push(actions[i]);
      }
    });
  }

  return extensionEnhancements;
}
