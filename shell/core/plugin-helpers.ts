import { RouteLocation } from 'vue-router';
import { ComponentOptionsMixin } from 'vue';

import { ActionLocation, CardLocation, ExtensionPoint } from '@shell/core/types';
import { isMac } from '@shell/utils/platform';
import { ucFirst, randomStr } from '@shell/utils/string';
import {
  _EDIT, _CONFIG, _DETAIL, _LIST, _CREATE
} from '@shell/config/query-params';
import { getProductFromRoute } from '@shell/utils/router';
import { isEqual } from '@shell/utils/object';

/* eslint-disable no-unused-vars */
enum LocationConfigParams {
  _CONFIG = 'config',
  _CREATE = 'create',
  _DETAIL = 'detail',
  _EDIT = 'edit',
  _LIST = 'list',
}

function checkRouteProduct($route: RouteLocation, locationConfigParam: string) {
  const product = getProductFromRoute($route);

  // alias for the homepage
  if (locationConfigParam === 'home' && $route.name === 'home') {
    return true;
  } else if (locationConfigParam === product) {
    return true;
  }

  return false;
}

function checkRouteMode({ name, query }: {name: string, query: any}, locationConfigParam: LocationConfigParams) {
  if (locationConfigParam === _EDIT && query.mode && query.mode === _EDIT && !query.as) {
    return true;
  } else if (locationConfigParam === _CONFIG && query.as && query.as === _CONFIG) {
    return true;
  } else if (locationConfigParam === _DETAIL && !query.as && name.includes('-id') && (!query.mode || query?.mode !== _EDIT)) {
    return true;
    // alias to target all list views
  } else if (locationConfigParam === _LIST && !name.includes('-id') && name.includes('-resource')) {
    return true;
    // alias to target create views
  } else if (locationConfigParam === _CREATE && name.endsWith('-create')) {
    return true;
  }

  return false;
}

function checkExtensionRouteBinding($route: any, locationConfig: any, context: any) {
  // if no configuration is passed, consider it as global
  if (!Object.keys(locationConfig).length) {
    return true;
  }

  const { params } = $route;

  // "params" to be checked based on the locationConfig
  // This has become overloaded with mode and context
  const paramsToCheck = [
    'product',
    'resource',
    'namespace',
    'cluster',
    'id',
    'mode',
    'path',
    'hash',
    // url query params
    'queryParam',
    // Custom context specific params provided by the extension, not to be confused with location params
    'context',
  ];

  let res = true;

  for (let i = 0; i < paramsToCheck.length; i++) {
    const param = paramsToCheck[i];

    if (locationConfig[param]) {
      const asArray = Array.isArray(locationConfig[param]) ? locationConfig[param] : [locationConfig[param]];

      for (let x = 0; x < asArray.length; x++) {
        const locationConfigParam = asArray[x];

        if (locationConfigParam) {
          if (param === 'hash') {
            res = $route.hash ? $route.hash.includes(locationConfigParam) : false;
          // handle "product" in a separate way...
          } else if (param === 'product') {
            res = checkRouteProduct($route, locationConfigParam);
          // also handle "mode" in a separate way because it mainly depends on query params
          } else if (param === 'mode') {
            res = checkRouteMode($route, locationConfigParam);
          } else if (param === 'resource') {
            // Match exact resource but also allow resource of '*' to match any resource
            res = (params[param] && locationConfigParam === '*') || locationConfigParam === params[param];
          } else if (param === 'context') {
            // Need all keys and values to match
            res = isEqual(locationConfigParam, context);
            // evaluate queryParam in route
          } else if (param === 'queryParam') {
            res = isEqual(locationConfigParam, $route.query);
            // evaluate path in route
          } else if (param === 'path' && locationConfigParam.urlPath) {
            if (locationConfigParam.endsWith) {
              res = $route.path.endsWith(locationConfigParam.urlPath);
            } else if (!Object.keys(locationConfigParam).includes('exact') || locationConfigParam.exact) {
              res = locationConfigParam.urlPath === $route.path;
            } else {
              res = $route.path.includes(locationConfigParam.urlPath);
            }
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

export function getApplicableExtensionEnhancements<T>(
  pluginCtx: ComponentOptionsMixin,
  actionType: ExtensionPoint,
  uiArea: CardLocation | ActionLocation,
  currRoute: RouteLocation,
  translationCtx = pluginCtx,
  context?: ComponentOptionsMixin): T[] {
  const extensionEnhancements: T[] = [];

  // gate it so that we prevent errors on older versions of dashboard
  if (pluginCtx.$plugin?.getUIConfig) {
    const actions = pluginCtx.$plugin.getUIConfig(actionType, uiArea);

    actions.forEach((action: any, i: number) => {
      if (checkExtensionRouteBinding(currRoute, action.locationConfig, context || {})) {
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

              keyboardCombo.forEach((key: string, i: number) => {
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
