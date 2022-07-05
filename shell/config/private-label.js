const { SETTING } = require('./settings');

const ANY = 0;
const STANDARD = 1;
const CUSTOM = 2;
const DOCS_BASE = 'https://rancher.com/docs/rancher/v2.6/en';

const STANDARD_VENDOR = 'Rancher';
const STANDARD_PRODUCT = 'Explorer';
const CUSTOM_VENDOR = { suse: 'SUSE Rancher' };

let mode = STANDARD;
let vendor = STANDARD_VENDOR;
let product = STANDARD_PRODUCT;
let brand = null;

module.exports = {
  ANY,
  STANDARD,
  CUSTOM,
  DOCS_BASE,

  setMode(m) {
    mode = m;
  },

  setVendor(v) {
    vendor = v;
  },

  setProduct(p) {
    product = p;
  },

  setBrand(b) {
    brand = b;
  },

  // -------------------------------------

  getMode() {
    return mode;
  },

  getBrand() {
    return brand;
  },

  isStandard() {
    return mode === STANDARD;
  },

  matches(pl) {
    if ( pl === ANY ) {
      return true;
    }

    return pl === mode;
  },

  getVendor() {
    if ( vendor === SETTING.PL_RANCHER_VALUE ) {
      // Custom vendor override based on brand
      if (brand && CUSTOM_VENDOR[brand]) {
        return CUSTOM_VENDOR[brand];
      }

      return STANDARD_VENDOR;
    }

    return vendor;
  },

  getProduct() {
    return product;
  }
};
