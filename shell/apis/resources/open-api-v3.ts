import { STORE } from '@shell/store/store-types.js';
import { LOCAL_CLUSTER } from '@shell/config/types';

/**
 * Media types that Kubernetes can accept for a PATCH request.
 */
export const PATCH_CONTENT_TYPE = {
  STRATEGIC_MERGE: 'application/strategic-merge-patch+json',
  MERGE:           'application/merge-patch+json',
  JSON_PATCH:      'application/json-patch+json',
  APPLY_YAML:      'application/apply-patch+yaml',
} as const;

/**
 * Preference order used when picking the media type for a PATCH request.
 *
 * `json-patch` and `apply-patch` are never candidates, they require a body shape
 * (an array of operations / YAML) that the Resources API `update` methods don't produce.
 */
const PATCH_CONTENT_TYPE_PREFERENCE = [PATCH_CONTENT_TYPE.STRATEGIC_MERGE, PATCH_CONTENT_TYPE.MERGE];

/**
 * Media type used when the OpenAPI spec can't be reached or doesn't describe the resource.
 *
 * Every Kubernetes resource accepts merge-patch, including CRDs, so a request made with it
 * won't be rejected. The trade off is that list fields are replaced rather than merged by key.
 */
const FALLBACK_PATCH_CONTENT_TYPE = PATCH_CONTENT_TYPE.MERGE;

/**
 * The parts of a store that {@link OpenApiV3} needs. Supplied by the caller so that both the
 * Resources API (which has the root store) and Steve models (which only have their own
 * namespaced store context) can use this class.
 */
export interface OpenApiV3Ctx {
  /**
   * Resolve the Steve schema for a Rancher resource type, e.g. `management.cattle.io.user`
   */
  schemaFor: (resourceType: string) => any;

  /**
   * Make a request to the backend
   */
  request: (opt: { url: string }) => Promise<any>;
}

/**
 * Determine the cluster whose OpenAPI spec describes the resources of a given store.
 *
 * The management store talks to Steve's `/v1` endpoint, which is backed by the local cluster,
 * so that's where its resource definitions (`management.cattle.io` and friends) live.
 *
 * @param storeName Name of the store the resource came from
 * @param currentClusterId Id of the cluster currently being viewed
 * @returns Cluster id, or undefined if it can't be determined
 */
export function openApiClusterId(storeName: string, currentClusterId?: string): string | undefined {
  return storeName === STORE.MANAGEMENT ? LOCAL_CLUSTER : currentClusterId;
}

/**
 * The PATCH media types accepted by each path of an API group, keyed by path
 */
type GroupPatchContent = Record<string, string[]>;

/**
 * Where a resource lives in the OpenAPI v3 spec, derived from its Rancher schema
 */
interface OpenApiV3Group {
  group: string;
  version: string;
  resource: string;
  namespaced: boolean;
}

/**
 * Reads the OpenAPI v3 spec of a cluster to find out how a resource can be interacted with.
 *
 * Kubernetes publishes the spec one API group at a time, so a group is fetched on first use and
 * then cached for the lifetime of the page. The cache is static and keyed by URL, which means it's
 * shared by every instance of this class - resource models are created per resource, so a per
 * instance cache would be thrown away almost immediately.
 */
export class OpenApiV3 {
  private static cache: Record<string, Promise<GroupPatchContent>> = {};

  private ctx: OpenApiV3Ctx;

  constructor(ctx: OpenApiV3Ctx) {
    this.ctx = ctx;
  }

  /**
   * Discard everything read from the OpenAPI spec so far
   */
  static clearCache(): void {
    OpenApiV3.cache = {};
  }

  /**
   * Get the media types a resource accepts for a PATCH request.
   *
   * @param cluster Id of the cluster the resource lives in
   * @param resourceType Rancher resource type, e.g. `configmap`
   * @returns Media types, or an empty array if the resource isn't described by the spec
   */
  async get(cluster: string, resourceType: string): Promise<string[]> {
    const group = this.groupFor(resourceType);

    if (!group) {
      return [];
    }

    const paths = await this.fetchGroup(this.groupUrl(cluster, group));

    return paths[this.openApiType(group)] || [];
  }

  /**
   * Find the media type to use when sending a PATCH request for a resource.
   *
   * Strategic merge patch is preferred, as it merges list fields by key rather than replacing
   * them, but it's only supported by built in Kubernetes resources. CRDs (which includes most
   * Rancher resources) only support merge patch, and reject anything else.
   *
   * This never throws. If the spec can't be read the request shouldn't be blocked, so we fall
   * back to the media type that every resource accepts.
   *
   * @param cluster Id of the cluster the resource lives in
   * @param resourceType Rancher resource type, e.g. `configmap`
   * @returns Media type to send as the `content-type` header
   */
  async patchContentType(cluster?: string, resourceType?: string): Promise<string> {
    if (!cluster || !resourceType) {
      return FALLBACK_PATCH_CONTENT_TYPE;
    }

    let supported: string[] = [];

    try {
      supported = await this.get(cluster, resourceType);
    } catch (e) {
      // Reading the spec requires access to the cluster's `/openapi/v3` endpoint, which not every
      // user has. Warn, rather than fail, and let the request go out with the safe media type
      console.warn(`Unable to read the OpenAPI spec for "${ resourceType }", PATCH requests will use "${ FALLBACK_PATCH_CONTENT_TYPE }"`, e); // eslint-disable-line no-console

      return FALLBACK_PATCH_CONTENT_TYPE;
    }

    return PATCH_CONTENT_TYPE_PREFERENCE.find((contentType) => supported.includes(contentType)) || FALLBACK_PATCH_CONTENT_TYPE;
  }

  /**
   * Get the Rancher schema for a resource type and return the OpenAPI v3 group it belongs to.
   *
   * @param resourceType Rancher resource type, e.g. `configmap`
   * @returns The group, or undefined if the type has no schema or the schema can't locate it
   */
  private groupFor(resourceType: string): OpenApiV3Group | undefined {
    const attributes = this.ctx.schemaFor(resourceType)?.attributes;

    if (!attributes?.version || !attributes?.resource) {
      return undefined;
    }

    const {
      group, version, resource, namespaced
    } = attributes;

    return {
      group, version, resource, namespaced
    };
  }

  /**
   * Build the url of the OpenAPI v3 document for the API group a resource belongs to.
   *
   * Core resources (those with no group) are published under `api/<version>`, everything else
   * under `apis/<group>/<version>`.
   */
  private groupUrl(cluster: string, { group, version }: OpenApiV3Group): string {
    const groupPath = group ? `apis/${ group }/${ version }` : `api/${ version }`;

    return `/k8s/clusters/${ cluster }/openapi/v3/${ groupPath }`;
  }

  /**
   * Convert a resource's group into the OpenAPI v3 type that describes it - the key of the path
   * covering operations on a single resource, which is where Kubernetes documents what a PATCH
   * request can contain.
   */
  private openApiType({
    group, version, resource, namespaced
  }: OpenApiV3Group): string {
    const groupPath = group ? `/apis/${ group }/${ version }` : `/api/${ version }`;
    const namespacePath = namespaced ? '/namespaces/{namespace}' : '';

    return `${ groupPath }${ namespacePath }/${ resource }/{name}`;
  }

  /**
   * Fetch the OpenAPI v3 document for an API group, or return the cached copy.
   *
   * These documents are large, so only the part that's of interest here is kept - the rest is
   * left to be garbage collected. The in flight promise is cached rather than the result, so
   * concurrent callers share a single request. A failed request is evicted so that it can be
   * retried later.
   */
  private fetchGroup(url: string): Promise<GroupPatchContent> {
    if (!OpenApiV3.cache[url]) {
      OpenApiV3.cache[url] = this.ctx.request({ url })
        .then((group: any) => Object.entries(group?.paths || {}).reduce((res: GroupPatchContent, [path, definition]: [string, any]) => {
          const contentTypes = Object.keys(definition?.patch?.requestBody?.content || {});

          if (contentTypes.length) {
            res[path] = contentTypes;
          }

          return res;
        }, {}))
        .catch((e: Error) => {
          delete OpenApiV3.cache[url];

          throw e;
        });
    }

    return OpenApiV3.cache[url];
  }
}
