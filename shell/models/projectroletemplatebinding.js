import { MANAGEMENT } from '@shell/config/types';
import NormanModel from '@shell/plugins/steve/norman-class';
import { _getPrincipalId, _getRoleDisplay, _getRoleDescription, _getRoleTemplate } from '~/shell/plugins/steve/resourceUtils/projectemplaterolebinding';

export default class PRTB extends NormanModel {
  get principalId() {
    return _getPrincipalId(this);
  }

  get roleDisplay() {
    return _getRoleDisplay(this);
  }

  get roleDescription() {
    return _getRoleDescription(this);
  }

  get roleTemplate() {
    return _getRoleTemplate(this, this.$getters, this.$rootGetters);
  }

  get steve() {
    return this.$dispatch(`management/find`, {
      type: MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING,
      id:   this.id?.replace(':', '/')
    }, { root: true });
  }
}
