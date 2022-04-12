import { EPINIO_PRODUCT_NAME } from '../types';

export const rootEpinioRoute = () => ({
  name:    EPINIO_PRODUCT_NAME,
  params: {}
});

export const createEpinioRoute = (name: string, params: Object) => ({
  name:   `${ rootEpinioRoute().name }-${ name }`,
  params: {
    ...rootEpinioRoute().params,
    ...params
  }
});
