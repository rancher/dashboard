import { IPlugin } from '@shell/core/types';
import { PRODUCT_SETTING_NAME, SETTING_PAGE_NAME } from './constants';

// Product configuration
export function init($plugin: IPlugin, store: any) {
  const {
    virtualType,
    basicType
  } = $plugin.DSL(store, PRODUCT_SETTING_NAME);

  virtualType({
    labelKey: 'registration.navigation.label',
    name:     SETTING_PAGE_NAME,
    route:    { name: SETTING_PAGE_NAME },
  });

  basicType([SETTING_PAGE_NAME]);
}
