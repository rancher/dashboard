import { KUBEWARDEN_PRODUCT_NAME } from '../types';

export const rootKubewardenRoute = () => ({
  name:    KUBEWARDEN_PRODUCT_NAME,
  params: { product: KUBEWARDEN_PRODUCT_NAME }
});

export const createKubewardenRoute = (name: string, params: Object) => ({
  name:   `${ rootKubewardenRoute().name }-${ name }`,
  params: {
    ...rootKubewardenRoute().params,
    ...params
  }
});
