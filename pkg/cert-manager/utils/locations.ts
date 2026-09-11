/**
 * Route locations for links between resources.
 *
 * `product` and `cluster` are required path params on the explorer routes. RouterLink throws when
 * a named route is missing a required param, which renders the whole cell or card as nothing, so
 * they must always be supplied - see `_detailLocation` in the shell's resource class.
 */
export function resourceLocation(model: any, resource: string, id?: string, namespace?: string) {
  if (!id) {
    return null;
  }

  return {
    name:   `c-cluster-product-resource${ namespace ? '-namespace' : '' }-id`,
    params: {
      product: model.$rootGetters['productId'],
      cluster: model.$rootGetters['clusterId'],
      resource,
      namespace,
      id,
    },
  };
}
