import { VERRAZZANO_PRODUCT_NAME } from '../types';

export const rootVerrazzanoRoute = () => ({
  name:    VERRAZZANO_PRODUCT_NAME,
  params: { product: VERRAZZANO_PRODUCT_NAME }
});

export const createVerrazzanoRoute = (name: string, params: Object) => ({
  name:   `${ rootVerrazzanoRoute().name }-${ name }`,
  params: {
    ...rootVerrazzanoRoute().params,
    ...params
  }
});
