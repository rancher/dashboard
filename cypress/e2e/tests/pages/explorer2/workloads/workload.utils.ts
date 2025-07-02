import { CypressChainable } from '~/cypress/e2e/po/po.types';

/**
 * `container` (https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.26/#container-v1-core)
 * definition containing a reeeal small, low impact image
 */
export const SMALL_CONTAINER = {
  name:  'small-image',
  image: 'k8s.gcr.io/pause'
};

/**
 * Create many workloads in a new namespace, but don't flood
 *
 * There's nothing specific about workloads, so could be a command in future
 */
export const createManyWorkloads = ({ context, createWorkload, count = 22 }: {
  /**
   * Used to create the namespace
   */
  context: string,
  createWorkload: ({ ns, i }) => CypressChainable
  count?: number,
}): Cypress.Chainable<{ ns: string, workloadNames: string[]}> => {
  return cy.createE2EResourceName(context)
    .then((ns) => {
      // create namespace
      cy.createNamespace(ns);

      // create workloads
      const workloadNames: string[] = [];

      for (let i = 0; i < count; i++) {
        createWorkload({ ns, i }).then((resp) => {
          workloadNames.push(resp.body.metadata.name);
        });

        if (i % 5 === 0) {
          cy.wait(500); // eslint-disable-line cypress/no-unnecessary-waiting
        }
      }

      // finish off with result
      return cy.wrap({
        ns,
        workloadNames
      });
    });
};

/**
 * Delete namespaces containing many workloads, waiting for them to totally be gone before continueing
 *
 * There's nothing specific about workloads, so could be a command in future
 */
export const deleteManyWorkloadNamespaces = (namespaces: string[]) => {
  for (let i = 0; i < namespaces.length; i++) {
    const ns = namespaces[i];

    cy.deleteRancherResource('v1', 'namespaces', ns);
    cy.waitForRancherResource('v1', 'namespaces', ns, (resp) => {
      return resp.status === 404;
    }, 20, { failOnStatusCode: false });
  }
};
