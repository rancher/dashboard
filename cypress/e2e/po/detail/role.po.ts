import PagePo from '@/cypress/e2e/po/pages/page.po';

export default abstract class RoleDetailPo extends PagePo {
  private static createPath(clusterId: string, resource: string, roleId: string) {
    return `/c/${ clusterId }/auth/roles/${ resource }/${ roleId }`;
  }

  static goTo(path: string): Cypress.Chainable<Cypress.AUTWindow> {
    throw new Error('invalid');
  }

  constructor(clusterId = '_', resource: string, roleId: string) {
    super(RoleDetailPo.createPath(clusterId, resource, roleId));
  }
}
