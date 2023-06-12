import IframeComponentPo from '@/cypress/e2e/po/components/embedded-ember/iframe-component.po';

export default class EmberNewSelectPo extends IframeComponentPo {
  // TODO nb why are these defined with index starting at 1??
  clickOption(idx: number) {
    // this.open();
    // this.getOptions().eq(idx).click();
    this.self().find('select').select(idx);
  }

  // clickOptionWithLabel(label: string) {
  //   return this.getOptions().contains(label).invoke('index').then((index) => {
  //     return this.clickOption(index);
  //   });
  // }

  // open() {
  //   this.input().click();
  // }

  // getOptions(): Cypress.Chainable {
  //   return this.self().find('option');
  // }
}
