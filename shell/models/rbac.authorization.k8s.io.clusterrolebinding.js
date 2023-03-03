import { CREATOR_ID } from '@shell/config/labels-annotations';
import { _CREATE } from '@shell/config/query-params';
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import HybridModel from '@shell/plugins/steve/hybrid-class';

export default class ClusterRoleBinding extends HybridModel {
  get users() {
    return this.subjects.filter(({ kind }) => kind?.toLowerCase() === 'user');
  }

  get serviceAccounts() {
    return this.subjects.filter(({ kind }) => kind?.toLowerCase() === 'serviceaccount');
  }

  get groups() {
    return this.subjects.filter(({ kind }) => kind?.toLowerCase() === 'group');
  }
}
