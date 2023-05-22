import PagePo from '@/cypress/e2e/po/pages/page.po';

export default class NotFoundPagePo extends PagePo {
  errorTitle() {
    return this.self().get('.text-center h1');
  }

  errorMessage() {
    return this.self().get('.text-center h2');
  }
}
