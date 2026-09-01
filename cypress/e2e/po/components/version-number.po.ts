import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class VersionNumberPo extends ComponentPo {
  checkVersion(version: string) {
    return this.self().should('contain.text', version);
  }

  checkNormalText() {
    return this.self().should('not.have.class', 'version-small');
  }

  checkSmallText() {
    return this.self().should('have.class', 'version-small');
  }
}
