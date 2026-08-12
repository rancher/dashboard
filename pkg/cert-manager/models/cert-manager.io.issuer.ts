import SteveModel from '@shell/plugins/steve/steve-class';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { SECRET } from '@shell/config/types';
import { CERT_MANAGER } from '../types';
import { Condition, conditionOf } from '../utils/conditions';
import { issuerRefMatches } from '../utils/issuer-ref';
import { IssuerSpec, IssuerStatus, ObjectMeta } from '../schema';

/** Exactly one of these is set on an Issuer/ClusterIssuer spec. */
export const ISSUER_CONFIG_TYPES = ['acme', 'ca', 'selfSigned', 'vault', 'venafi'] as const;

export type IssuerConfigType = typeof ISSUER_CONFIG_TYPES[number];

const WELL_KNOWN_ACME_SERVERS: Record<string, string> = {
  'https://acme-v02.api.letsencrypt.org/directory':         'Let\'s Encrypt',
  'https://acme-staging-v02.api.letsencrypt.org/directory': 'Let\'s Encrypt (Staging)',
  'https://acme.zerossl.com/v2/DV90':                       'ZeroSSL',
  'https://api.buypass.com/acme/directory':                 'Buypass',
  'https://api.test4.buypass.no/acme/directory':            'Buypass (Test)',
};

export interface SolverSummary {
  type: 'HTTP-01' | 'DNS-01';
  provider?: string;
  selector: string[];
}

export default class Issuer extends SteveModel {
  declare spec: IssuerSpec;

  declare status: IssuerStatus;

  declare metadata: ObjectMeta;

  get readyCondition(): Condition | undefined {
    return conditionOf(this, 'Ready');
  }

  get configType(): IssuerConfigType | undefined {
    return ISSUER_CONFIG_TYPES.find((type) => !!this.spec?.[type]);
  }

  get configTypeDisplay(): string {
    return this.configType ? this.t(`certManager.issuer.type.${ this.configType }`) : '';
  }

  get state(): string {
    if (this.readyCondition?.status === 'False') {
      return STATES_ENUM.ERROR;
    }

    if (this.readyCondition?.status === 'True') {
      return STATES_ENUM.ACTIVE;
    }

    return STATES_ENUM.PENDING;
  }

  get stateDescription(): string {
    const { reason, message } = this.readyCondition || {};

    // `AuthFailed` means bad credentials rather than a transient error, so keep the reason visible.
    return reason && reason !== 'Ready' ? [reason, message].filter(Boolean).join(': ') : (message || '');
  }

  get acmeServer(): string | undefined {
    return this.spec?.acme?.server;
  }

  get acmeServerDisplay(): string | undefined {
    if (!this.acmeServer) {
      return undefined;
    }

    if (WELL_KNOWN_ACME_SERVERS[this.acmeServer]) {
      return WELL_KNOWN_ACME_SERVERS[this.acmeServer];
    }

    try {
      return new URL(this.acmeServer).host;
    } catch {
      return this.acmeServer;
    }
  }

  get acmeAccountUri(): string | undefined {
    return this.status?.acme?.uri;
  }

  get acmeRegisteredEmail(): string | undefined {
    return this.status?.acme?.lastRegisteredEmail;
  }

  get solverSummaries(): SolverSummary[] {
    return (this.spec?.acme?.solvers || []).map((solver: any) => {
      const { dnsZones = [], dnsNames = [], matchLabels = {} } = solver.selector || {};

      return {
        type:     solver.dns01 ? 'DNS-01' : 'HTTP-01',
        provider: solver.dns01 ? Object.keys(solver.dns01)[0] : solver.http01?.ingress?.ingressClassName || solver.http01?.ingress?.class,
        selector: [
          ...dnsZones,
          ...dnsNames,
          ...Object.entries(matchLabels).map(([k, v]) => `${ k }=${ v }`),
        ],
      };
    });
  }

  get caSecretLocation() {
    if (!this.spec?.ca?.secretName) {
      return null;
    }

    return {
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        resource: SECRET, namespace: this.metadata?.namespace, id: this.spec.ca.secretName
      },
    };
  }

  get certificates() {
    const all = this.$rootGetters['cluster/all'](CERT_MANAGER.CERTIFICATE) || [];

    return all.filter((cert: any) => issuerRefMatches(cert.spec?.issuerRef, cert.metadata?.namespace, this));
  }
}
