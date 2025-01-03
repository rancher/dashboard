import { SETTING } from './settings';
import { CURRENT_RANCHER_VERSION } from './version';

export const ANY = 0;
export const STANDARD = 1;
export const CUSTOM = 2;
export const DOCS_BASE = `https://ranchermanager.docs.rancher.com/v${ CURRENT_RANCHER_VERSION }`;

const STANDARD_VENDOR = 'Rancher';
const STANDARD_PRODUCT = 'Explorer';
const CUSTOM_VENDOR = {
  suse: 'Rancher Prime',
  csp:  'SUSE Rancher'
};

let mode = STANDARD;
let vendor = STANDARD_VENDOR;
let product = STANDARD_PRODUCT;
let brand = null;

export function setMode(m) {
  mode = m;
}

export function setVendor(v) {
  vendor = v;
  setTitle();
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

export function setTitle() {
  const v = getVendor();

  if (v === 'Harvester') {
    const ico = require(`~shell/assets/images/pl/harvester.png`);

    document.title = 'Harvester';
    const link = document.createElement('link');

    link.hid = 'icon';
    link.rel = 'icon';
    link.type = 'image/x-icon';
    link.hrefv = ico;
    const head = document.getElementsByTagName('head')[0];

    head.appendChild(link);
  }
}
