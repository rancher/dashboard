import { NAME } from '@shell/config/product/settings';

export const PRODUCT_NAME = 'prime';
export const CUSTOM_PAGE_NAME = 'registration';
export const CRD = 'registration';
export const BLANK_CLUSTER = '_';
export const PRODUCT_SETTING_NAME = NAME;
export const SETTING_PAGE_NAME = `c-cluster-${ PRODUCT_SETTING_NAME }-${ CUSTOM_PAGE_NAME }`;
export const REGISTRATION_NAMESPACE = `cattle-scc-system`;
export const REGISTRATION_SECRET = `scc-registration`;
export const REGISTRATION_RESOURCE_NAME = 'scc.cattle.io.registration';
export const REGISTRATION_LABEL = `scc.cattle.io/scc-hash`;
export const REGISTRATION_REQUEST_PREFIX = `offline-request-`;
export const REGISTRATION_REQUEST_FILENAME = 'rancher-offline-registration-request.json';
export const REGISTRATION_NOTIFICATION_ID = 'rancher-prime-registration';
