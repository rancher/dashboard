/**
 * Caches the OpenAPI for a given cluster ID
 *
 * Fetches the required data if it is not cached, otherwise returns
 * the cached data
 */
export class OpenAPI {
  private cluster = '';
  private data: any;

  /**
   * Get the Open API data for a cluster
   * Currently, data is cached for a single cluster at a time
   *
   * @param cluster Cluster name
   * @param dispatch Function to dispatch fetch to the store
   * @returns Open API data
   */
  public get(cluster: string, dispatch: Function): Promise<any> {
    if (this.data && this.cluster && this.cluster === cluster) {
      return Promise.resolve(this.data);
    }

    this.cluster = cluster;
    this.data = undefined;

    return dispatch(
      `cluster/request`,
      { url: `/k8s/clusters/${ this.cluster }/openapi/v2?timeout=32s` }
    ).then((response: any) => {
      this.data = response.data || response;

      return this.data;
    });
  }
}
