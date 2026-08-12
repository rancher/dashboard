import day from 'dayjs';
import SteveModel from '@shell/plugins/steve/steve-class';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { SECRET } from '@shell/config/types';
import { CERT_MANAGER } from '../types';
import { Condition, conditionOf } from '../utils/conditions';
import { issuerRefLocation } from '../utils/issuer-ref';
import { CertificateSpec, CertificateStatus, ObjectMeta } from '../schema';

/** Matches cert-manager's own default `renewBefore` of two thirds of the certificate lifetime. */
const EXPIRING_SOON_DAYS = 30;

export default class Certificate extends SteveModel {
  declare spec: CertificateSpec;

  declare status: CertificateStatus;

  declare metadata: ObjectMeta;

  get readyCondition(): Condition | undefined {
    return conditionOf(this, 'Ready');
  }

  get issuingCondition(): Condition | undefined {
    return conditionOf(this, 'Issuing');
  }

  get expiresAt(): string | undefined {
    return this.status?.notAfter;
  }

  get renewalTime(): string | undefined {
    return this.status?.renewalTime;
  }

  get isExpired(): boolean {
    return !!this.expiresAt && day(this.expiresAt).isBefore(day());
  }

  get isExpiringSoon(): boolean {
    if (this.isExpired) {
      return false;
    }

    if (this.renewalTime && day(this.renewalTime).isBefore(day())) {
      return true;
    }

    return !!this.expiresAt && day(this.expiresAt).isBefore(day().add(EXPIRING_SOON_DAYS, 'day'));
  }

  get state(): string {
    // Expiry beats everything: a certificate can report Ready while its stored material is stale.
    if (this.isExpired) {
      return STATES_ENUM.EXPIRED;
    }

    if (this.isExpiringSoon) {
      return STATES_ENUM.EXPIRING;
    }

    if (this.issuingCondition?.status === 'True') {
      return STATES_ENUM.IN_PROGRESS;
    }

    if (this.readyCondition?.status === 'False' || (this.status?.failedIssuanceAttempts || 0) > 0) {
      return STATES_ENUM.ERROR;
    }

    if (this.readyCondition?.status === 'True') {
      return STATES_ENUM.ACTIVE;
    }

    return STATES_ENUM.PENDING;
  }

  get stateDescription(): string {
    return this.readyCondition?.message || this.issuingCondition?.message || '';
  }

  get issuerLocation() {
    return issuerRefLocation(this.spec?.issuerRef, this.metadata?.namespace);
  }

  get secretLocation() {
    if (!this.spec?.secretName) {
      return null;
    }

    return {
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        resource: SECRET, namespace: this.metadata?.namespace, id: this.spec.secretName
      },
    };
  }

  /** Common name first, then every other subject alternative name, for the list view. */
  get dnsNamesDisplay(): string[] {
    const {
      commonName, dnsNames = [], ipAddresses = [], uris = []
    } = this.spec || {};
    const rest = [...dnsNames, ...ipAddresses, ...uris].filter((n: string) => n !== commonName);

    return commonName ? [commonName, ...rest] : rest;
  }

  get certificateRequests() {
    const all = this.$rootGetters['cluster/all'](CERT_MANAGER.CERTIFICATE_REQUEST) || [];

    return all.filter((cr: any) => (cr.metadata?.ownerReferences || []).some((o: any) => o.uid === this.metadata?.uid));
  }
}
