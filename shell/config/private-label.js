import { SETTING } from './settings';

export const ANY = 0;
export const STANDARD = 1;
export const CUSTOM = 2;
export const DOCS_BASE = 'https://rancher.com/docs/rancher/v2.6/en';

const STANDARD_VENDOR = 'Rancher';
const STANDARD_PRODUCT = 'Explorer';
const CUSTOM_VENDOR = { suse: 'SUSE Rancher' };

let mode = STANDARD;
let vendor = STANDARD_VENDOR;
let product = STANDARD_PRODUCT;
let brand = null;

export function setMode(m) {
  mode = m;
}

export function setVendor(v) {
  vendor = v;
}

export function setProduct(p) {
  product = p;
}

export function setBrand(b) {
  brand = b;
}

// -------------------------------------

export function getMode() {
  return mode;
}

export function getBrand() {
  return brand;
}

export function isStandard() {
  return mode === STANDARD;
}

export function matches(pl) {
  if ( pl === ANY ) {
    return true;
  }

  return pl === mode;
}

export function getVendor() {
  if ( vendor === SETTING.PL_RANCHER_VALUE ) {
    // Custom vendor override based on brand
    if (brand && CUSTOM_VENDOR[brand]) {
      return CUSTOM_VENDOR[brand];
    }

    return STANDARD_VENDOR;
  }

  return vendor;
}

export function getProduct() {
  return product;
}
