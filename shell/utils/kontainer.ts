import { isArray } from '@shell/utils/array';
import { set, get, isEmpty } from '@shell/utils/object';

/**
 * This function accepts a v3 cluster object and mutates its config field to sync values that were set outside Rancher (eg, when an imported cluster is created in its respective cloud provider).
 * Values configured outside of rancher are not automatically propagated to the config field that the UI edits; they are reflected in the aksStatus/eksStatus/gkeStatus.upstreamSpec field.
 * This function works in tandem with diffUpstreamSpec: the former runs when the edit form is initialized and the latter runs when the cluster is saved.
 * @param configPrefix one of aks, eks, gke
 * @param normanCluster v3 cluster object
 */
export function syncUpstreamConfig(configPrefix: string, normanCluster: {[key: string]: any}): void {
  const configKey = `${ configPrefix }Config`;
  const statusKey = `${ configPrefix }Status`;

  const rancherConfig = normanCluster[configKey] || {};
  const upstreamConfig = normanCluster?.[statusKey]?.upstreamSpec || {};

  if (!isEmpty(upstreamConfig)) {
    Object.keys(upstreamConfig).forEach((key) => {
      if (typeof upstreamConfig[key] === 'object') {
        if (isEmpty(rancherConfig[key]) && !isEmpty(upstreamConfig[key])) {
          set(rancherConfig, key, upstreamConfig[key]);
        }
      } else if ((rancherConfig[key] === null || rancherConfig[key] === undefined) && upstreamConfig[key] !== null && upstreamConfig[key] !== undefined) {
        set(rancherConfig, key, upstreamConfig[key]);
      }
    });
  }
}

/**
 * Hosted provider (aks gke eks) edit functionality differs from other k8s resources
 * see ui issue: https://github.com/rancher/rancher/issues/28541
 * backend issue: https://github.com/rancher/rancher/issues/28422
 * The below code is taken from the rancher/ui implementation https://github.com/rancher/ui/blob/master/app/models/cluster.js#L1368
 */

function isEmptyObject(object: any) {
  return Object.keys(object).length === 0;
}

function isObject(val: any) {
  return Object.prototype.toString.call(val) === '[object Object]';
}

function isEmptyStringOrArray(val: any) {
  return val === null || val === undefined || val === '' || (isArray(val) && val.length === 0);
}

/**
 * this is NOT a generic object diff.
 * It tries to be as generic as possible but it does make certain assumptions regarding nulls and emtpy arrays/objects
 * if upstream is null and local aks config is empty we do not count this as a change
 * additionally null values on the RHS will be ignored as null cant be sent in this case
 * nodeGroups, nodePools, tags, and labels are not diffed
 * @param upstream aksStatus.upstreamSpec
 * @param local aksConfig
 * @returns aksConfig containing only values which differ from upstream spec, excluding null values
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function diffUpstreamSpec(upstream: any, local: any): any {
  const delta = {};
  const localKeys = Object.keys(local);

  localKeys.forEach((key) => {
    if (key === 'type') {
      return;
    }

    const upstreamMatch = get(upstream, key);
    const localMatch = get(local, key);

    if (key !== 'nodeGroups' && key !== 'nodePools') {
      try {
        if (JSON.stringify(upstreamMatch) === JSON.stringify(localMatch)) {
          return;
        }
      } catch (e) {}
    }

    if (key === 'nodeGroups' || key === 'nodePools' || key === 'tags' || key === 'labels') {
      // Node Groups and Node Pools do not require a sync, we can safely send the entire object
      // Tags and Labels (maps) are also included by default because what is present in the config is exactly what should be used on save and any equal maps would have been caught by the JSON isEqual comparison above
      if (!isEmptyStringOrArray(localMatch)) {
        // node groups need ALL data so short circut and send it all
        set(delta, key, localMatch);
      } else {
        // all node groups were deleted
        set(delta, key, []);
      }

      return;
    }

    if (isEmptyStringOrArray(upstreamMatch) || isEmptyObject(upstreamMatch)) {
      if (isEmptyStringOrArray(localMatch) || isEmptyObject(localMatch)) {
        if (upstreamMatch !== null && (isArray(localMatch) || isObject(localMatch))) {
          // Empty Arrays and Empty Maps must be sent as such unless the upstream value is null, then the empty array or obj is just an init value
          set(delta, key, localMatch);
        }
      } else {
        // upstream is empty, local is not, just set
        set(delta, key, localMatch);
      }
    } else {
      if (localMatch !== null) {
        // entry in og obj
        if (isArray(upstreamMatch)) {
          if (isArray(localMatch)) {
            if (!isEmptyStringOrArray(localMatch) && localMatch.every((m: any) => isObject(m))) {
              // You have more diffing to do
              localMatch.forEach((match: any) => {
                // our most likely candiate for a match is node group name, but lets check the others just incase.
                const matchId = get(match, 'name') || get(match, 'id') || false;

                if (matchId) {
                  let lmatchIdx = 0;

                  // we have soime kind of identifier to find a match in the upstream, so we can diff and insert to new array
                  const lMatch = upstreamMatch.find((l: any, idx: number) => {
                    const lmatchId = get(l, 'name') || get(l, 'id');

                    if (lmatchId === matchId) {
                      lmatchIdx = idx;

                      return l;
                    }
                  });

                  if (lMatch) {
                    // we have a match in the upstream, meaning we've probably made updates to the object itself
                    const diffedMatch = diffUpstreamSpec(lMatch, match);

                    if (!isArray(get(delta, key))) {
                      set(delta, key, [diffedMatch]);
                    } else {
                      const target: any[] = delta[key as keyof typeof delta];

                      // diff and push into new array
                      target.splice(lmatchIdx, 0, diffedMatch);
                    }
                  } else {
                    // no match in upstream, new entry
                    if (!isArray(get(delta, key))) {
                      set(delta, key, [match]);
                    } else {
                      const target: any = delta[key as keyof typeof delta];

                      target.push(match);
                    }
                  }
                } else {
                  // no match id, all we can do is dumb add
                  if (!isArray(get(delta, key))) {
                    set(delta, key, [match]);
                  } else {
                    const target: any = delta[key as keyof typeof delta];

                    target.push(match);
                  }
                }
              });
            } else {
              set(delta, key, localMatch);
            }
          } else {
            set(delta, key, localMatch);
          }
        } else if (isObject(upstreamMatch)) {
          if (!isEmptyStringOrArray(localMatch) && !isEmptyObject(localMatch)) {
            if ((Object.keys(upstreamMatch) || []).length > 0) {
              // You have more diffing to do
              set(delta, key, diffUpstreamSpec(upstreamMatch, localMatch));
            } else if (isEmptyObject(upstreamMatch)) {
              // we had a map now we have an empty map
              set(delta, key, {});
            }
          } else if (!isEmptyObject(upstreamMatch) && isEmptyObject(localMatch)) {
            // we had a map now we have an empty map
            set(delta, key, {});
          }
        } else { // upstreamMatch not an array or object
          set(delta, key, localMatch);
        }
      }
    }
  });

  return delta;
}
