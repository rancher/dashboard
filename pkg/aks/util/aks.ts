import { isArray } from '@shell/utils/array';
import { set, get } from '@shell/utils/object';

// aksLocations

// aksVersions

// aksVMSizes

//

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
 *
 * @param lhs aksStatus.upstreamSpec
 * @param rhs aksConfig
 * @returns aksConfig containing only values which differ from upstream spec, excluding null values
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function diffUpstreamSpec(lhs: any, rhs: any): any {
  // this is NOT a generic object diff.
  // It tries to be as generic as possible but it does make certain assumptions regarding nulls and emtpy arrays/objects
  // if LHS (upstream) is null and RHS (aks config) is empty we do not count this as a change
  // additionally null values on the RHS will be ignored as null cant be sent in this case
  const delta = {};
  const rhsKeys = Object.keys(rhs);

  rhsKeys.forEach((k) => {
    if (k === 'type') {
      return;
    }

    const lhsMatch = get(lhs, k);
    const rhsMatch = get(rhs, k);

    if (k !== 'nodeGroups' && k !== 'nodePools') {
      try {
        if (JSON.stringify(lhsMatch) === JSON.stringify(rhsMatch)) {
          return;
        }
      } catch (e) {}
    }

    if (k === 'nodeGroups' || k === 'nodePools' || k === 'tags' || k === 'labels') {
      // Node Groups and Node Pools do not require a sync, we can safely send the entire object
      // Tags and Labels (maps) are also included by default because what is present in the config is exactly what should be used on save and any equal maps would have been caught by the JSON isEqual comparison above
      if (!isEmptyStringOrArray(rhsMatch)) {
        // node groups need ALL data so short circut and send it all
        set(delta, k, rhsMatch);
      } else {
        // all node groups were deleted
        set(delta, k, []);
      }

      return;
    }

    if (isEmptyStringOrArray(lhsMatch) || isEmptyObject(lhsMatch)) {
      if (isEmptyStringOrArray(rhsMatch) || isEmptyObject(rhsMatch)) {
        if (lhsMatch !== null && (isArray(rhsMatch) || isObject(rhsMatch))) {
          // Empty Arrays and Empty Maps must be sent as such unless the upstream value is null, then the empty array or obj is just a init value from ember
          set(delta, k, rhsMatch);
        }
      } else {
        // lhs is empty, rhs is not, just set
        set(delta, k, rhsMatch);
      }
    } else {
      if (rhsMatch !== null) {
        // entry in og obj
        if (isArray(lhsMatch)) {
          if (isArray(rhsMatch)) {
            if (!isEmptyStringOrArray(rhsMatch) && rhsMatch.every((m: any) => isObject(m))) {
              // You have more diffing to do
              rhsMatch.forEach((match: any) => {
                // our most likely candiate for a match is node group name, but lets check the others just incase.
                const matchId = get(match, 'name') || get(match, 'id') || false;

                if (matchId) {
                  let lmatchIdx = 0;

                  // we have soime kind of identifier to find a match in the upstream, so we can diff and insert to new array
                  const lMatch = lhsMatch.find((l: any, idx: number) => {
                    const lmatchId = get(l, 'name') || get(l, 'id');

                    if (lmatchId === matchId) {
                      lmatchIdx = idx;

                      return l;
                    }
                  });

                  if (lMatch) {
                    // we have a match in the upstream, meaning we've probably made updates to the object itself
                    const diffedMatch = diffUpstreamSpec(lMatch, match);

                    if (!isArray(get(delta, k))) {
                      set(delta, k, [diffedMatch]);
                    } else {
                      const target: any[] = delta[k as keyof typeof delta];

                      // diff and push into new array
                      target.splice(lmatchIdx, 0, diffedMatch);
                    }
                  } else {
                    // no match in upstream, new entry
                    if (!isArray(get(delta, k))) {
                      set(delta, k, [match]);
                    } else {
                      const target: any = delta[k as keyof typeof delta];

                      target.push(match);
                    }
                  }
                } else {
                  // no match id, all we can do is dumb add
                  if (!isArray(get(delta, k))) {
                    set(delta, k, [match]);
                  } else {
                    const target: any = delta[k as keyof typeof delta];

                    target.push(match);
                  }
                }
              });
            } else {
              set(delta, k, rhsMatch);
            }
          } else {
            set(delta, k, rhsMatch);
          }
        } else if (isObject(lhsMatch)) {
          if (!isEmptyStringOrArray(rhsMatch) && !isEmptyObject(rhsMatch)) {
            if ((Object.keys(lhsMatch) || []).length > 0) {
              // You have more diffing to do
              set(delta, k, diffUpstreamSpec(lhsMatch, rhsMatch));
            } else if (isEmptyObject(lhsMatch)) {
              // we had a map now we have an empty map
              set(delta, k, {});
            }
          } else if (!isEmptyObject(lhsMatch) && isEmptyObject(rhsMatch)) {
            // we had a map now we have an empty map
            set(delta, k, {});
          }
        } else { // lhsMatch not an array or object
          set(delta, k, rhsMatch);
        }
      }
    }
  });

  return delta;
}
