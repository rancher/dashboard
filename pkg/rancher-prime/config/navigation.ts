import { IPlugin } from '@shell/core/types';
import {
  PRODUCT_NAME, CUSTOM_PAGE_NAME, SETTING_PAGE_NAME,
  SETTING_PRODUCT
} from './constants';

export function init($plugin: IPlugin, store: any) {
  const {
    virtualType,
    basicType
  } = $plugin.DSL(store, PRODUCT_NAME);

  // Add navigation page
  virtualType({
    label: SETTING_PAGE_NAME,
    name:  CUSTOM_PAGE_NAME,
    route: {
      name:   SETTING_PAGE_NAME,
      params: { product: SETTING_PRODUCT }
    }
  });

  // registering the defined pages as side-menu entries
  basicType([CUSTOM_PAGE_NAME]);
}
