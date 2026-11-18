import Issuer from './cert-manager.io.issuer';

/**
 * A ClusterIssuer has the same spec and status as an Issuer, it is just cluster scoped.
 * Namespace-dependent getters on the base model resolve to undefined, which is correct here:
 * a ClusterIssuer's secret refs are read from the cert-manager namespace, not from a spec field.
 */
export default class ClusterIssuer extends Issuer {}
