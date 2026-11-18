/**
 * Media types that can be sent as the `content-type` of a PATCH request.
 */
export const PATCH_CONTENT_TYPE = {
  STRATEGIC_MERGE: 'application/strategic-merge-patch+json',
  MERGE:           'application/merge-patch+json',
} as const;

/**
 * Status returned by the Kubernetes API when a resource doesn't accept the patch media type sent.
 */
const UNSUPPORTED_MEDIA_TYPE = 415;

/**
 * Phrases the Kubernetes API uses when rejecting a patch media type, in case the status doesn't
 * survive the trip through Steve.
 */
const UNSUPPORTED_MEDIA_TYPE_MESSAGE = /unsupported media type|unknown format|accepted media types/i;

/**
 * Resource types known to reject `strategic-merge-patch`, keyed by `<store>::<type>`.
 *
 * Whether a type supports strategic merge patch is a property of the type (CRDs don't, built in
 * Kubernetes resources do), so the store and type are enough to identify it - the cluster isn't
 * part of the key. In the unlikely event the same type differs between two clusters the worst
 * case is a merge patch where a strategic merge would have worked, which is the safe direction.
 *
 * Lives for the lifetime of the page and is shared by every caller.
 */
let strategicMergeRejected: Record<string, boolean> = {};

const cacheKey = (storeName: string, resourceType: string) => `${ storeName }::${ resourceType }`;

/**
 * Forget which resource types have rejected strategic merge patch.
 *
 * Only used by tests - the cache is keyed by store and type, neither of which change while the
 * page is up.
 */
export function clearPatchStrategyCache(): void {
  strategicMergeRejected = {};
}

/**
 * Has this resource type already told us it won't accept a strategic merge patch?
 *
 * @param storeName Name of the store the resource came from, e.g. `cluster`
 * @param resourceType Rancher resource type, e.g. `management.cattle.io.user`
 */
export function hasRejectedStrategicMerge(storeName: string, resourceType: string): boolean {
  return !!strategicMergeRejected[cacheKey(storeName, resourceType)];
}

/**
 * Does this error mean the server rejected the patch media type, rather than the patch itself?
 *
 * Anything else - not found, forbidden, a conflict, a validation failure - is a real error and
 * must not be retried.
 *
 * @param e The rejection from the patch request
 */
export function isUnsupportedPatchMediaType(e: any): boolean {
  // A Steve error is the response body with the status attached, an axios error keeps its response
  const status = e?._status ?? e?.status ?? e?.response?.status;

  if (status === UNSUPPORTED_MEDIA_TYPE) {
    return true;
  }

  return UNSUPPORTED_MEDIA_TYPE_MESSAGE.test(`${ e?.message ?? '' }`);
}

interface PatchWithFallbackOptions<T> {
  /**
   * Name of the store the resource came from, e.g. `cluster`
   */
  storeName: string;

  /**
   * Rancher resource type, e.g. `management.cattle.io.user`
   */
  resourceType: string;

  /**
   * Send the PATCH with the given media type. Called once, or twice if the first is rejected
   */
  send: (contentType: string) => Promise<T>;

  /**
   * Called when the strategic merge attempt was rejected and the merge patch is about to go out
   */
  onFallback?: (message: string, e: any) => void;
}

/**
 * Send a PATCH request, preferring strategic merge patch and falling back to merge patch for the
 * resources that reject it.
 *
 * Strategic merge patch is preferred because it merges list fields by key rather than replacing
 * them, but only built in Kubernetes resources support it - CRDs, which is most of Rancher, reject
 * it outright. There's no way to ask Steve which a resource supports, so the first patch for a type
 * finds out by trying. The rejection is remembered, so a type only pays for the extra request once.
 *
 * The two attempts are deliberately handled separately. A rejected media type is ours to recover
 * from and is logged as a warning, anything else is the caller's error and is left to propagate.
 *
 * @returns The response to whichever patch was accepted
 */
export async function patchWithFallback<T = any>({
  storeName,
  resourceType,
  send,
  onFallback = (message: string, e: any) => console.warn(message, e), // eslint-disable-line no-console
}: PatchWithFallbackOptions<T>): Promise<T> {
  if (hasRejectedStrategicMerge(storeName, resourceType)) {
    // Already know it won't be accepted, don't waste a request finding out again
    return send(PATCH_CONTENT_TYPE.MERGE);
  }

  try {
    return await send(PATCH_CONTENT_TYPE.STRATEGIC_MERGE);
  } catch (e) {
    if (!isUnsupportedPatchMediaType(e)) {
      // A genuine failure - permissions, a conflict, a bad patch. Not something a retry will fix
      throw e;
    }

    strategicMergeRejected[cacheKey(storeName, resourceType)] = true;

    onFallback(`"${ resourceType }" does not accept "${ PATCH_CONTENT_TYPE.STRATEGIC_MERGE }", retrying with "${ PATCH_CONTENT_TYPE.MERGE }". List fields will be replaced rather than merged by key.`, e);
  }

  // Outside the block above on purpose - a failure here is a real one and belongs to the caller
  return send(PATCH_CONTENT_TYPE.MERGE);
}
