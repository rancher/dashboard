import SteveModel from '@shell/plugins/steve/steve-class';
import { CERT_MANAGER } from '../types';
import { issuerRefLocation } from '../utils/issuer-ref';
import { acmeState } from '../utils/acme-state';
import { OrderSpec, OrderStatus, ObjectMeta } from '../schema';

export interface AuthorizationSummary {
  identifier?: string;
  wildcard: boolean;
  url?: string;
  challengeTypes: string[];
}

export default class Order extends SteveModel {
  declare spec: OrderSpec;

  declare status: OrderStatus;

  declare metadata: ObjectMeta;

  get state(): string {
    return acmeState(this.status?.state);
  }

  get stateDescription(): string {
    return this.status?.reason || '';
  }

  get issuerLocation() {
    return issuerRefLocation(this.spec?.issuerRef, this.metadata?.namespace);
  }

  get dnsNamesDisplay(): string[] {
    const { commonName, dnsNames = [] } = this.spec || {};
    const rest = dnsNames.filter((n: string) => n !== commonName);

    return commonName ? [commonName, ...rest] : rest;
  }

  get authorizationSummaries(): AuthorizationSummary[] {
    return (this.status?.authorizations || []).map((auth: any) => ({
      identifier:     auth.identifier,
      wildcard:       !!auth.wildcard,
      url:            auth.url,
      challengeTypes: (auth.challenges || []).map((c: any) => c.type).filter(Boolean),
    }));
  }

  get challenges() {
    const all = this.$rootGetters['cluster/all'](CERT_MANAGER.CHALLENGE) || [];

    return all.filter((challenge: any) => (challenge.metadata?.ownerReferences || []).some((o: any) => o.uid === this.metadata?.uid));
  }

  get ownerCertificateRequestName(): string | undefined {
    return (this.metadata?.ownerReferences || []).find((o: any) => o.kind === 'CertificateRequest')?.name;
  }

  get ownerCertificateRequestLocation() {
    if (!this.ownerCertificateRequestName) {
      return null;
    }

    return {
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        resource:  CERT_MANAGER.CERTIFICATE_REQUEST,
        namespace: this.metadata?.namespace,
        id:        this.ownerCertificateRequestName,
      },
    };
  }
}
