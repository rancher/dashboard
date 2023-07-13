import NotFoundPagePo from '@/cypress/e2e/po/pages/not-found-page.po';

describe('Not found page display', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Will show a 404 if we do not have a valid Product id on the route path', () => {
    const notFound = new NotFoundPagePo('/c/local/bogus-product-id');

    notFound.goTo();
    notFound.waitForPage();

    notFound.errorTitle().contains('Error');
    notFound.errorMessage().contains('Product bogus-product-id not found');
  });

  it('Will show a 404 if we do not have a valid Resource type on the route path', () => {
    const notFound = new NotFoundPagePo('/c/local/explorer/bogus-resource-type');

    notFound.goTo();
    notFound.waitForPage();

    notFound.errorTitle().contains('Error');
    notFound.errorMessage().contains('Resource type bogus-resource-type not found');
  });

  it('Will show a 404 if we do not have a valid Resource id on the route path', () => {
    const notFound = new NotFoundPagePo('/c/local/explorer/node/bogus-resource-id');

    notFound.goTo();
    notFound.waitForPage();

    notFound.errorTitle().contains('Error');
    notFound.errorMessage().contains('Resource node with id bogus-resource-id not found, unable to display resource details');
  });

  it('Will show a 404 if we do not have a valid product + resource + resource id', () => {
    const notFound = new NotFoundPagePo('/c/local/bogus-product-id/bogus-resource/bogus-resource-id');

    notFound.goTo();
    notFound.waitForPage();

    notFound.errorTitle().contains('Error');
    notFound.errorMessage().contains('Product bogus-product-id not found');
  });
});
