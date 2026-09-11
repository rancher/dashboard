/**
 * Cypress intercept handler shared by the workload list blueprints (generate*DataSmall).
 *
 * The workload overview requests a per-type summary from the same collection URL (…&summaryonly).
 * These mocks are list-shaped (have `data`, no `summary`), so answering the summary request would make
 * the overview treat it as an invalid response and redirect to the deployments list. Only mock the
 * list request; let the summary request reach the real backend so the overview renders normally.
 */
export function reply(statusCode: number, body: any) {
  return (req: any) => {
    if (req.url.includes('summaryonly')) {
      req.continue();

      return;
    }

    req.reply({
      statusCode,
      body
    });
  };
}
