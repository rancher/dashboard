import { MANAGEMENT } from '@shell/config/types';
import NormanModel from '@shell/plugins/steve/norman-class';

export default class PRTB extends NormanModel {
  get canCustomEdit() {
    return true;
  }

  get canClone() {
    return false;
  }

  get principalId() {
    return this.userPrincipalId || this.groupPrincipalId;
  }

  get roleDisplay() {
    return this.roleTemplate?.nameDisplay;
  }

  get roleDescription() {
    return this.roleTemplate?.description;
  }

  get roleTemplate() {
    return this.$rootGetters['management/byId'](MANAGEMENT.ROLE_TEMPLATE, this.roleTemplateId);
  }

  get steve() {
    return this.$dispatch(`management/find`, {
      type: MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING,
      id:   this.id?.replace(':', '/')
    }, { root: true });
  }

  goToEdit() {
    this.$dispatch('promptModal', {
      component:      'EditProjectMemberDialog',
      componentProps: { value: this, saveInModal: true },
      modalSticky:    true
    });
  }
}
