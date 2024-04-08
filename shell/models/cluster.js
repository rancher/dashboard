import NormanModel from '@shell/plugins/steve/norman-class';

export const LABEL_CONTAINS_PROTECTED = [
  'io.cattle.lifecycle',
  'kubernetes.io',
  'cattle.io',
  'k3s.io',
];

export const ANNOTATIONS_CONTAINS_PROTECTED = [
  'coreos.com',
  'cattle.io',
  'k3s.io',
  'kubernetes.io',
  'k3s.io',
];
export default class NormanCluster extends NormanModel {
  get systemLabels() {
    return Object.keys(this.labels || {}).filter((key) => LABEL_CONTAINS_PROTECTED.find((label) => key.includes(label)));
  }

  get systemAnnotations() {
    return Object.keys(this.annotations || {}).filter((key) => ANNOTATIONS_CONTAINS_PROTECTED.find((annotation) => key.includes(annotation)));
  }

  get hasSystemLabels() {
    return !!(this.systemLabels || []).length;
  }

  get hasSystemAnnotations() {
    return !!(this.systemAnnotations || []).length;
  }
}
