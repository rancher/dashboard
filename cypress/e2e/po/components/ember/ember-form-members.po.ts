import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';
import EmberModalAddCustomRolePo from '@/cypress/e2e/po/components/ember/ember-modal-add-custom-role.po';
import EmberSearchableSelectPo from '@/cypress/e2e/po/components/ember/ember-searchable-select.po';

export default class EmberFormMembersPo extends EmberComponentPo {
  addMember() {
    return cy.iFrame().find('button').contains('Add Member').click();
  }

  setNewMemberWithCustomRoles(principal: string, roles: { label: string, roleTemplateId: string }[]) {
    const name = new EmberSearchableSelectPo('[data-testid="form-members__pending__0"] .principal-search');

    name.setAndSelect(principal);

    const role = new EmberSearchableSelectPo('[data-testid="form-members__pending__0"] td:nth-of-type(2)');

    role.clickAndSelect('Custom');

    const modal = new EmberModalAddCustomRolePo();

    modal.checkExists();
    modal.accordion().checkExists();

    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];

      modal.checkOption(role.label);
    }
    modal.save();
  }
}
