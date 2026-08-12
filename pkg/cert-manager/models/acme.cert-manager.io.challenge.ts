import SteveModel from '@shell/plugins/steve/steve-class';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { CERT_MANAGER } from '../types';
import { issuerRefLocation } from '../utils/issuer-ref';
import { acmeState } from '../utils/acme-state';
import { resourceLocation } from '../utils/locations';
import { ChallengeSpec, ChallengeStatus, ObjectMeta } from '../schema';

export default class Challenge extends SteveModel {
  declare spec: ChallengeSpec;

  declare status: ChallengeStatus;

  declare metadata: ObjectMeta;

  get state(): string {
    const state = acmeState(this.status?.state);

    // `pending` covers both "waiting to be picked up" and "solver deployed, waiting on the ACME
    // server". Distinguish them so a stuck challenge is visible at a glance.
    if (state === STATES_ENUM.PENDING && this.status?.processing) {
      return STATES_ENUM.IN_PROGRESS;
    }

    return state;
  }

  get stateDescription(): string {
    return this.status?.reason || '';
  }

  get isPresented(): boolean {
    return !!this.status?.presented;
  }

  get isProcessing(): boolean {
    return !!this.status?.processing;
  }

  get dnsNameDisplay(): string {
    return this.spec?.wildcard ? `*.${ this.spec?.dnsName }` : this.spec?.dnsName || '';
  }

  get challengeType(): string | undefined {
    return this.spec?.type;
  }

  get solverSummary(): string | undefined {
    const solver = this.spec?.solver;

    if (solver?.dns01) {
      return Object.keys(solver.dns01)[0];
    }

    return solver?.http01?.ingress?.ingressClassName || solver?.http01?.ingress?.class;
  }

  get issuerLocation() {
    return issuerRefLocation(this, this.spec?.issuerRef);
  }

  get ownerOrderName(): string | undefined {
    return (this.metadata?.ownerReferences || []).find((o: any) => o.kind === 'Order')?.name;
  }

  get ownerOrderLocation() {
    return resourceLocation(this, CERT_MANAGER.ORDER, this.ownerOrderName, this.metadata?.namespace);
  }
}
