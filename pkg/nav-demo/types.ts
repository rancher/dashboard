/**
 * Product name. Dashes are stripped from product names during registration
 * (see `normalizeProductName`), so this is already dash-free to keep the
 * registered name and the generated route paths identical.
 */
export const PRODUCT_NAME = 'navdemo';

/** Prefix of every route name this product generates, e.g. `navdemo-c-cluster-l1-overview` */
export const ROUTE_PREFIX = `${ PRODUCT_NAME }-c-cluster-`;
