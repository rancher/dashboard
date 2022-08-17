import { EXAMPLE_PRODUCT_NAME } from '../types';

export const rootExampleRoute = () => ({
  name:    EXAMPLE_PRODUCT_NAME,
  params: { product: EXAMPLE_PRODUCT_NAME }
});

export const createExampleRoute = (name: string, params: Object) => ({
  name:   `${ rootExampleRoute().name }-${ name }`,
  params: {
    ...rootExampleRoute().params,
    ...params
  }
});
