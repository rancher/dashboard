import { LOCAL } from '@shell/config/query-params';
import { ELEMENTAL_PRODUCT_NAME } from '@shell/config/elemental-types';

export const rootElementalRoute = () => ({
  name:    `${ ELEMENTAL_PRODUCT_NAME }-c-cluster`,
  params: { product: ELEMENTAL_PRODUCT_NAME, cluster: LOCAL }
});

export const createElementalRoute = (name: string, params: Object) => ({
  name:   `${ rootElementalRoute().name }-${ name }`,
  params: {
    ...rootElementalRoute().params,
    ...params
  }
});
