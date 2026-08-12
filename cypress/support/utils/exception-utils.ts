
/**
 * Messages thrown by the third party scripts the suse.com pages load. Their own list because
 * generic/home-links.spec.ts has to match them in a primary context handler too, where matching the
 * whole `RANCHER_PAGE_EXCEPTIONS` list would be far broader than the evidence supports.
 *
 * Neither string appears anywhere in `shell/`, `pkg/` or `creators/`, so neither can hide a
 * dashboard error.
 */
export const SUSE_PAGE_EXCEPTIONS = [
  // Thrown asynchronously by the third party visitor pixel suse.com serves (every frame is in
  // cdn.vector.co/pixel.js), not by the dashboard. Without it the `Rancher Prime link` test in
  // generic/home-links.spec.ts fails whenever that script cannot resolve a visitor id, which is
  // entirely suse.com's business.
  'No visitor ID available',
  // `Cannot read properties of undefined (reading 'targetingResponse')`, thrown asynchronously by
  // the Qualtrics site intercept survey suse.com serves (every frame is in
  // siteintercept.qualtrics.com, Q_BRANDID=www.suse.com). It lands late, in the `after each` hook
  // of the `Rancher Prime link` test, which took out the rest of that spec in CI jobs 94098082984
  // and 94166365373. Matched on the property name alone so it survives Chrome rewording the
  // TypeError; `targetingResponse` is a Qualtrics API field.
  'targetingResponse'
];

export const RANCHER_PAGE_EXCEPTIONS = [
  'TenantFeatures',
  'DomainData',
  'ResizeObserver loop',
  'cross origin page',
  ...SUSE_PAGE_EXCEPTIONS
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
        //
        // `Cypress.on` rather than `cy.on` on purpose. `cy.on` is torn down when the test body
        // ends, and it only covers the `cy.origin` block it was registered in - so it misses a
        // rejection that arrives from a later block, which is what this spec's callers do (register
        // here, click, then assert inside a second `cy.origin`). Registered inside `cy.origin` this
        // handler is scoped to the third party origin and to `catchExceptions`, so it can never
        // see, let alone swallow, an error from a dashboard page. Note that guarantee is structural
        // and belongs to THIS handler only - the primary context handler in
        // generic/home-links.spec.ts does run on dashboard pages, which is why it checks the
        // throwing frame's host as well as the message.
        //
        // This covers rejections that arrive through the `cy.origin` bridge. Ones that arrive after
        // the test body, in a hook, do not come through it - see the primary context handler in
        // generic/home-links.spec.ts, which is needed as well.
        //
        // Note this handler lives for the rest of the spec, so calling `catchTargetPageException`
        // with the same origin in N tests registers N handlers on that origin.
        Cypress.on('uncaught:exception', (e) => {
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
