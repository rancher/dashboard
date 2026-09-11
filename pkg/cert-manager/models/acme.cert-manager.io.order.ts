import SteveModel from '@shell/plugins/steve/steve-class';
import { CERT_MANAGER } from '../types';
import { issuerRefLocation } from '../utils/issuer-ref';
import { acmeState } from '../utils/acme-state';
import { resourceLocation } from '../utils/locations';
import { stateObjFor } from '../utils/state';
import { RancherKubeMetadata } from '@shell/types/rancher/steve.api';
import { OrderSpec, OrderStatus } from '../schema';

export interface AuthorizationSummary {
  identifier?: string;
  wildcard: boolean;
  url?: string;
  challengeTypes: string[];
}

export default class Order extends SteveModel {
  declare spec: OrderSpec;

  declare status: OrderStatus;

  declare metadata: RancherKubeMetadata;

  get state(): string {
    return acmeState(this.status?.state);
  }

  /** Keeps the badge colour in step with the state this model computes - see stateObjFor. */
  get stateObj(): any {
    return stateObjFor(this, this.state);
  }

  get stateDescription(): string {
    return this.status?.reason || '';
  }

  get issuerLocation() {
    return issuerRefLocation(this, this.spec?.issuerRef);
  }

  get dnsNamesDisplay(): string[] {
    const { commonName, dnsNames = [] } = this.spec || {};
    const rest = dnsNames.filter((n: string) => n !== commonName);

    return commonName ? [commonName, ...rest] : rest;
  }

  /** Rendered by DetailTop in the masthead. The long ACME URLs stay in the tabs below. */
  get details(): any[] {
    return [
      ...super.details,
      {
        label:         this.t('certManager.certificateRequest.label'),
        content:       this.ownerCertificateRequestName,
        formatter:     'Link',
        formatterOpts: {
          to: this.ownerCertificateRequestLocation, row: {}, options: { internal: true }
        },
      },
      {
        label:         this.t('certManager.tableHeaders.issuer'),
        content:       this.spec?.issuerRef?.name,
        formatter:     'Link',
        formatterOpts: {
          to: this.issuerLocation, row: {}, options: { internal: true }
        },
      },
      { label: this.t('certManager.certificate.commonName'), content: this.spec?.commonName },
    ];
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
    return resourceLocation(this, CERT_MANAGER.CERTIFICATE_REQUEST, this.ownerCertificateRequestName, this.metadata?.namespace);
  }
}
