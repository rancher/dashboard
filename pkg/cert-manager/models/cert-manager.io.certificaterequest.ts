import SteveModel from '@shell/plugins/steve/steve-class';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { CERT_MANAGER } from '../types';
import { Condition, conditionOf } from '../utils/conditions';
import { issuerRefLocation } from '../utils/issuer-ref';
import { resourceLocation } from '../utils/locations';
import { parseCsr, CsrInfo } from '../utils/csr';
import { CertificateRequestSpec, CertificateRequestStatus, ObjectMeta } from '../schema';

const REVISION_ANNOTATION = 'cert-manager.io/certificate-revision';

export default class CertificateRequest extends SteveModel {
  declare spec: CertificateRequestSpec;

  declare status: CertificateRequestStatus;

  declare metadata: ObjectMeta;

  get readyCondition(): Condition | undefined {
    return conditionOf(this, 'Ready');
  }

  get approvedCondition(): Condition | undefined {
    return conditionOf(this, 'Approved');
  }

  get deniedCondition(): Condition | undefined {
    return conditionOf(this, 'Denied');
  }

  get invalidRequestCondition(): Condition | undefined {
    return conditionOf(this, 'InvalidRequest');
  }

  get isApproved(): boolean {
    return this.approvedCondition?.status === 'True';
  }

  get isDenied(): boolean {
    return this.deniedCondition?.status === 'True';
  }

  get isReady(): boolean {
    return this.readyCondition?.status === 'True';
  }

  get state(): string {
    if (this.isDenied) {
      return STATES_ENUM.DENIED;
    }

    if (this.invalidRequestCondition?.status === 'True' || this.readyCondition?.reason === 'Failed') {
      return STATES_ENUM.ERROR;
    }

    if (this.isReady) {
      return STATES_ENUM.ACTIVE;
    }

    return this.isApproved ? STATES_ENUM.IN_PROGRESS : STATES_ENUM.PENDING;
  }

  get stateDescription(): string {
    return this.deniedCondition?.message || this.invalidRequestCondition?.message || this.readyCondition?.message || '';
  }

  get revision(): string | undefined {
    return this.metadata?.annotations?.[REVISION_ANNOTATION];
  }

  get issuerLocation() {
    return issuerRefLocation(this, this.spec?.issuerRef);
  }

  get ownerCertificateName(): string | undefined {
    return (this.metadata?.ownerReferences || []).find((o: any) => o.kind === 'Certificate')?.name;
  }

  get ownerCertificateLocation() {
    return resourceLocation(this, CERT_MANAGER.CERTIFICATE, this.ownerCertificateName, this.metadata?.namespace);
  }

  /** Decoded PKCS#10 request. Null when `spec.request` is absent or unparseable. */
  get csrInfo(): CsrInfo | null {
    return parseCsr(this.spec?.request);
  }

  get orders() {
    const all = this.$rootGetters['cluster/all'](CERT_MANAGER.ORDER) || [];

    return all.filter((order: any) => (order.metadata?.ownerReferences || []).some((o: any) => o.uid === this.metadata?.uid));
  }
}
