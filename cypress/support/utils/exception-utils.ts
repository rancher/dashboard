
export const RANCHER_PAGE_EXCEPTIONS = [
  'TenantFeatures',
  'DomainData',
  'ResizeObserver loop',
  'cross origin page'
];

/**
 * Target page throws an error. Catch and ignore so test's generic afterAll doesn't fail
 */
export const catchTargetPageException = (
  exceptionMessage?: string | string[],
  originUrl?: string
): void => {
  const partialExceptionMessage = exceptionMessage || RANCHER_PAGE_EXCEPTIONS;
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
