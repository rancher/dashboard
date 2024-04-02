import NormanModel from '@shell/plugins/steve/norman-class';
import { matchesSomeRegex } from '@shell/utils/string';
import omitBy from 'lodash/omitBy';

const LABEL_PREFIX_TO_IGNORE = [
  'io.cattle.lifecycle.',
  'beta.kubernetes.io/',
  'failure-domain.beta.kubernetes.io/',
  'node-role.kubernetes.io/',
  'kubernetes.io/',
  'cattle.io/',
  'authz.management.cattle.io',
  'rke.cattle.io',
  'field.cattle.io',
  'workload.user.cattle.io/',
  'k3s.io',
  'node.kubernetes.io',
];

export default class Cluster extends NormanModel {
  // get labels() {
  //   const all = this.labels || {};

  //   return omitBy(all, (value, key) => {
  //     // return matchesSomeRegex(key, LABELS_TO_IGNORE_REGEX);
  //     return matchesSomeRegex(key, `/^${ LABEL_PREFIX_TO_IGNORE }.*/`);
  //   });
  // }
}
