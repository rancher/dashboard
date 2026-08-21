import SteveModel from '@shell/plugins/steve/steve-class';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { CERT_MANAGER } from '../types';
import { Condition, conditionOf, isFailingCondition } from '../utils/conditions';
import { issuerRefLocation } from '../utils/issuer-ref';
import { resourceLocation } from '../utils/locations';
import { stateObjFor } from '../utils/state';
import { parseCsr, CsrInfo } from '../utils/csr';
import { certificateNameOf, CERTIFICATE_REVISION_ANNOTATION } from '../utils/issuance';
import { CertificateRequestSpec, CertificateRequestStatus, ObjectMeta } from '../schema';

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

  /** Conditions the shell should render as errors - see isFailingCondition. */
  get conditionsHaveIssues(): boolean {
    return (this.status?.conditions || []).some((c: Condition) => isFailingCondition(c, this.stateObj.error));
  }

  get resourceConditions(): any[] {
    const conditions = this.status?.conditions || [];

    return super.resourceConditions.map((row: any, i: number) => {
      const error = isFailingCondition(conditions[i], this.stateObj.error);

      return {
        ...row, error, stateSimpleColor: error ? 'error' : 'disabled'
      };
    });
  }

  /** Keeps the badge colour in step with the state this model computes - see stateObjFor. */
  get stateObj(): any {
    return stateObjFor(this, this.state);
  }

  get stateDescription(): string {
    return this.deniedCondition?.message || this.invalidRequestCondition?.message || this.readyCondition?.message || '';
  }

  get revision(): string | undefined {
    return this.metadata?.annotations?.[CERTIFICATE_REVISION_ANNOTATION];
  }

  get issuerLocation() {
    return issuerRefLocation(this, this.spec?.issuerRef);
  }

  get ownerCertificateName(): string | undefined {
    // Annotation first: Steve does not always include ownerReferences in list responses.
    return certificateNameOf(this);
  }

  get ownerCertificateLocation() {
    return resourceLocation(this, CERT_MANAGER.CERTIFICATE, this.ownerCertificateName, this.metadata?.namespace);
  }

  /** Rendered by DetailTop in the masthead. Empty entries are dropped there. */
  get details(): any[] {
    return [
      ...super.details,
      {
        label:         this.t('certManager.certificateRequest.certificate'),
        content:       this.ownerCertificateName,
        formatter:     'Link',
        formatterOpts: {
          to: this.ownerCertificateLocation, row: {}, options: { internal: true }
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
      { label: this.t('certManager.tableHeaders.revision'), content: this.revision },
      { label: this.t('certManager.certificate.duration'), content: this.spec?.duration },
    ];
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
