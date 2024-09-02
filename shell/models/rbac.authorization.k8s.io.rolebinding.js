import HybridModel from '@shell/plugins/steve/hybrid-class';
import { GROUP, SERVICE_ACCOUNT, USER } from '@shell/config/types';

export default class RoleBinding extends HybridModel {
  get users() {
    return this.subjects.filter(({ kind }) => kind?.toLowerCase() === USER);
  }

  get serviceAccounts() {
    return this.subjects.filter(({ kind }) => kind?.toLowerCase() === SERVICE_ACCOUNT);
  }

  get groups() {
    return this.subjects.filter(({ kind }) => kind?.toLowerCase() === GROUP);
  }
}
