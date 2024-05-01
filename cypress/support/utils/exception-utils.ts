
export const RANCHER_PAGE_EXCEPTIONS = [
  'TenantFeatures',
  'DomainData'
];

/**
 * Target page throws an error. Catch and ignore so test's generic afterAll doesn't fail
 */
export const catchTargetPageException = (
  partialExceptionMessage: string | string[],
  originUrl?: string
): void => {
  const catchExceptions: string[] = typeof partialExceptionMessage === 'string' ? [partialExceptionMessage] : partialExceptionMessage;

  if (originUrl) {
    cy.origin(originUrl,
      { args: { catchExceptions } },
      ({ catchExceptions }) => {
        // This is a repeat of `below`... can't serialise and pass in to cy.origin
        cy.on('uncaught:exception', (e) => {
          if (catchExceptions.filter((m) => e.message.indexOf(m) >= 0).length) {
            return false;
          }
        });
      }
    );
  } else {
    cy.on('uncaught:exception', (e) => {
      if (catchExceptions.filter((m) => e.message.indexOf(m) >= 0).length) {
        return false;
      }
    });
  }
};
