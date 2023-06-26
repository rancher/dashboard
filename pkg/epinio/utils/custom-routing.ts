import { EPINIO_PRODUCT_NAME } from '../types';

export const rootEpinioRoute = () => ({
  name:   EPINIO_PRODUCT_NAME,
  params: { product: EPINIO_PRODUCT_NAME }
});

export const createEpinioRoute = (name: string, params: Object, query?: Object) => ({
  name:   `${ rootEpinioRoute().name }-${ name }`,
  params: {
    ...rootEpinioRoute().params,
    ...params
  },
  ...query
});
