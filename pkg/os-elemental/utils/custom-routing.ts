import { ELEMENTAL_PRODUCT_NAME } from '../types';
import { BLANK_CLUSTER } from '@shell/store';

export const rootElementalRoute = () => ({
  name:    `${ ELEMENTAL_PRODUCT_NAME }-c-cluster`,
  params: { product: ELEMENTAL_PRODUCT_NAME, cluster: BLANK_CLUSTER }
});

export const createElementalRoute = (name: string, params: Object) => ({
  name:   `${ rootElementalRoute().name }-${ name }`,
  params: {
    ...rootElementalRoute().params,
    ...params
  }
});
