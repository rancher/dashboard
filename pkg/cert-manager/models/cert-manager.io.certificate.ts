import day from 'dayjs';
import SteveModel from '@shell/plugins/steve/steve-class';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { SECRET } from '@shell/config/types';
import { CERT_MANAGER } from '../types';
import { Condition, conditionOf } from '../utils/conditions';
import { issuerRefLocation } from '../utils/issuer-ref';
import { resourceLocation } from '../utils/locations';
import { relatedTo } from '../utils/issuance';
import { CertificateSpec, CertificateStatus, ObjectMeta } from '../schema';

/** Matches cert-manager's own default `renewBefore` of two thirds of the certificate lifetime. */
const EXPIRING_SOON_DAYS = 30;

export default class Certificate extends SteveModel {
  declare spec: CertificateSpec;

  declare status: CertificateStatus;

  declare metadata: ObjectMeta;

  declare type: string;

  /**
   * The edit form has to create `spec.privateKey` and `spec.secretTemplate` before its inputs can
   * bind to them. Drop whichever the user left untouched so an unused form field does not end up
   * as an empty object in the saved resource.
   */
  cleanForSave(data: any, forNew: boolean): any {
    const val = super.cleanForSave(data, forNew);

    ['privateKey', 'secretTemplate'].forEach((key) => {
      if (val?.spec?.[key] && !Object.keys(val.spec[key]).length) {
        delete val.spec[key];
      }
    });

    return val;
  }

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
    return issuerRefLocation(this, this.spec?.issuerRef);
  }

  get secretLocation() {
    return resourceLocation(this, SECRET, this.spec?.secretName, this.metadata?.namespace);
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
    return relatedTo(this.$rootGetters['cluster/all'](CERT_MANAGER.CERTIFICATE_REQUEST) || [], this);
  }

  /**
   * Rendered by DetailTop in the masthead, alongside labels and annotations. Entries with empty
   * content are dropped there, so optional fields need no guarding here.
   */
  get details(): any[] {
    return [
      ...super.details,
      {
        label:         this.t('certManager.tableHeaders.issuer'),
        content:       this.spec?.issuerRef?.name,
        formatter:     'Link',
        formatterOpts: {
          to: this.issuerLocation, row: {}, options: { internal: true }
        },
      },
      {
        label:         this.t('certManager.tableHeaders.secret'),
        content:       this.spec?.secretName,
        formatter:     'Link',
        formatterOpts: {
          to: this.secretLocation, row: {}, options: { internal: true }
        },
      },
      { label: this.t('certManager.certificate.commonName'), content: this.spec?.commonName },
      { label: this.t('certManager.certificate.revision'), content: this.status?.revision },
      { separator: true },
      {
        label:         this.t('certManager.certificate.notBefore'),
        content:       this.status?.notBefore,
        formatter:     'LiveDate',
        formatterOpts: { addSuffix: true },
      },
      {
        label:         this.t('certManager.certificate.notAfter'),
        content:       this.expiresAt,
        // LiveDate always appends "ago", so a future expiry reads as though it already lapsed.
        // LiveExpiryDate keys off the row state and only says "ago" once actually expired.
        formatter:     'LiveExpiryDate',
        formatterOpts: { row: this },
      },
      {
        label:     this.t('certManager.certificate.renewalTime'),
        content:   this.renewalTime,
        // No suffix, matching the Renews column in the list - it is normally a future date.
        formatter: 'LiveDate',
      },
      { label: this.t('certManager.certificate.duration'), content: this.spec?.duration },
    ];
  }

  /**
   * Renewal is driven by the `Issuing` condition on the status subresource, which Steve cannot
   * write - the API server drops `status` on the main resource for CRDs that declare one. So this
   * goes through Rancher's raw Kubernetes proxy, the same escape hatch `shell/models/workload.js`
   * uses for rollbacks.
   */
  get statusSubresourceUrl(): string {
    const clusterId = this.$rootGetters['clusterId'];
    const { namespace, name } = this.metadata || {};

    return `/k8s/clusters/${ clusterId }/apis/cert-manager.io/v1/namespaces/${ namespace }/certificates/${ name }/status`;
  }

  get canRenew(): boolean {
    // The real gate is `update` on `certificates/status`, which Steve does not report, so this is
    // optimistic and a 403 is handled in `renew`. A certificate that has never issued has nothing
    // to renew.
    return !!this.status?.notAfter && !!this.hasLink?.('update');
  }

  get _availableActions(): any[] {
    const out = super._availableActions;

    out.unshift({
      action:  'renew',
      label:   this.t('certManager.action.renew.label'),
      icon:    'icon icon-refresh',
      enabled: this.canRenew,
    }, { divider: true });

    return out;
  }

  async renew(): Promise<void> {
    const url = this.statusSubresourceUrl;

    try {
      // Read through the proxy rather than reusing the Steve model: that carries id/type/links,
      // which the Kubernetes API server rejects on a PUT.
      const live = await this.$dispatch('request', { opt: { url, method: 'get' }, type: this.type });

      // Replace any existing Issuing condition rather than appending a second one, and keep
      // Ready intact - a merge patch on `conditions` would drop it.
      const conditions = (live.status?.conditions || []).filter((c: Condition) => c.type !== 'Issuing');

      conditions.push({
        type:               'Issuing',
        status:             'True',
        reason:             'ManuallyTriggered',
        message:            'Certificate re-issuance manually triggered',
        lastTransitionTime: new Date().toISOString(),
      });

      live.status = { ...(live.status || {}), conditions };

      await this.$dispatch('request', {
        opt: {
          url,
          method:  'put',
          data:    live,
          headers: { 'content-type': 'application/json', accept: 'application/json' },
        },
        type: this.type,
      });

      this.$dispatch('growl/success', {
        title:   this.t('certManager.action.renew.success.title'),
        message: this.t('certManager.action.renew.success.message', { name: this.nameDisplay }),
      }, { root: true });
    } catch (e: any) {
      const status = e?._status || e?.status;
      const isForbidden = status === 403;

      this.$dispatch('growl/error', {
        title:   this.t('certManager.action.renew.error.title'),
        // Editing a Certificate does not imply permission on `certificates/status`, so point at
        // the CLI rather than surfacing a bare Kubernetes error.
        message: isForbidden ? this.t('certManager.action.renew.error.forbidden', {
          name:      this.metadata?.name,
          namespace: this.metadata?.namespace,
        }) : (e?.message || e?._statusText || String(e)),
        timeout: 8000,
      }, { root: true });
    }
  }
}
