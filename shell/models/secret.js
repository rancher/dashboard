import r from 'jsrsasign';
import { CERTMANAGER, KUBERNETES, UI_PROJECT_SECRET, UI_PROJECT_SECRET_COPY } from '@shell/config/labels-annotations';
import { base64Decode, base64Encode } from '@shell/utils/crypto';
import { removeObjects } from '@shell/utils/array';
import { MANAGEMENT, SERVICE_ACCOUNT, VIRTUAL_TYPES } from '@shell/config/types';
import { set } from '@shell/utils/object';
import { NAME as MANAGER } from '@shell/config/product/manager';
import SteveModel from '@shell/plugins/steve/steve-class';
import { colorForState, stateDisplay, STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { diffFrom } from '@shell/utils/time';
import day from 'dayjs';
import { steveCleanForDownload } from '@shell/plugins/steve/resource-utils';
import { STORE } from '@shell/store/store-types';
import { escapeHtml } from '@shell/utils/string';

export const TYPES = {
  OPAQUE:           'Opaque',
  SERVICE_ACCT:     'kubernetes.io/service-account-token',
  DOCKER:           'kubernetes.io/dockercfg',
  DOCKER_JSON:      'kubernetes.io/dockerconfigjson',
  BASIC:            'kubernetes.io/basic-auth',
  SSH:              'kubernetes.io/ssh-auth',
  TLS:              'kubernetes.io/tls',
  BOOTSTRAP:        'bootstrap.kubernetes.io/token',
  ISTIO_TLS:        'istio.io/key-and-cert',
  HELM_RELEASE:     'helm.sh/release.v1',
  FLEET_CLUSTER:    'fleet.cattle.io/cluster-registration-values',
  CLOUD_CREDENTIAL: 'provisioning.cattle.io/cloud-credential',
  RKE_AUTH_CONFIG:  'rke.cattle.io/auth-config'
};

/** Class a cert as expiring if in eight days */
const certExpiringPeriod = 1000 * 60 * 60 * 24 * 8;

export default class Secret extends SteveModel {
  _cachedCertInfo;

  get hasSensitiveData() {
    return true;
  }

  get isCertificate() {
    return this._type === TYPES.TLS;
  }

  get isRegistry() {
    return this._type === TYPES.DOCKER_JSON;
  }

  get isCloudCredential() {
    return this._type === TYPES.CLOUD_CREDENTIAL || (this.metadata.namespace === 'cattle-global-data' && this.metadata.generateName === 'cc-');
  }

  // For Fleet SSH secrets - does the secret have the 'known_hosts' data key?
  get supportsSshKnownHosts() {
    return this._type === TYPES.SSH && !!this.data && 'known_hosts' in this.data;
  }

  get issuer() {
    const { metadata:{ annotations = {} } } = this;

    if (annotations[CERTMANAGER.ISSUER]) {
      return annotations[CERTMANAGER.ISSUER];
    } else if (this.isCertificate) {
      return this.cachedCertInfo?.issuer;
    } else {
      return null;
    }
  }

  get notAfter() {
    if (this.isCertificate) {
      return this.cachedCertInfo?.notAfter;
    } else {
      return null;
    }
  }

  get cn() {
    if (this.isCertificate) {
      return this.cachedCertInfo?.cn;
    }

    return null;
  }

  // show plus n more for cert names
  get plusMoreNames() {
    if (this.isCertificate) {
      return this.unrepeatedSans.length;
    }

    return null;
  }

  // use text-warning' or 'text-error' if cert is expiring within 8 days or is expired
  get dateClass() {
    if (this.isCertificate) {
      switch (this.certState) {
      case STATES_ENUM.EXPIRING:
        return 'text-warning';
      case STATES_ENUM.EXPIRED:
        return 'text-error';
      default:
        return '';
      }
    }

    return null;
  }

  get details() {
    const out = [
      {
        label:   this.t('secret.type'),
        content: this.typeDisplay
      }
    ];

    if ( this._type === TYPES.SERVICE_ACCT ) {
      const name = this.metadata?.annotations?.[KUBERNETES.SERVICE_ACCOUNT_NAME];

      if ( name ) {
        out.push({
          label:         'Service Account',
          formatter:     'LinkName',
          formatterOpts: {
            value:     name,
            type:      SERVICE_ACCOUNT,
            namespace: this.namespace,
          },
          content: name,
        });
      }
    }

    if (this.cn) {
      out.push({
        label:   this.t('secret.certificate.cn'),
        content: this.plusMoreNames ? `${ this.cn } ${ this.t('secret.certificate.plusMore', { n: this.plusMoreNames }) }` : this.cn
      });
    }

    if (this.issuer) {
      out.push({
        label:   this.t('secret.certificate.issuer'),
        content: this.issuer
      });
    }

    if (this.notAfter) {
      out.push({
        label:         'Expires',
        formatter:     'Date',
        formatterOpts: { class: this.dateClass },
        content:       this.notAfter
      });
    }

    return out;
  }

  get canUpdate() {
    if (this.isProjectSecretCopy) {
      return false;
    }

    if ( !this.hasLink('update') ) {
      return false;
    }

    if ( this._type === TYPES.SERVICE_ACCT ) {
      return false;
    }

    return this.$rootGetters['type-map/optionsFor'](this.type).isEditable;
  }

  get canDelete() {
    // Deleting a copy / synced secret that was created in a namespace in a project that has a project scoped secret
    // will only be temporary (the parent project scoped secret will recreate it)
    return this.isProjectSecretCopy ? false : super.canDelete;
  }

  get canCreate() {
    return this.isProjectSecretCopy ? false : super.canCreate;
  }

  get canEditYaml() {
    return this.isProjectSecretCopy ? false : super.canEditYaml;
  }

  get keysDisplay() {
    const keys = [
      ...Object.keys(this.data || []),
      ...Object.keys(this.binaryData || [])
    ];

    if ( !keys.length ) {
      return '(none)';
    }

    // if ( keys.length >= 4 ) {
    //   return `${keys[0]}, ${keys[1]}, ${keys[2]} and ${keys.length - 3} more`;
    // }

    return keys.join(', ');
  }

  // decode some secret data to show in list view
  get dataPreview() {
    if (this._type === TYPES.DOCKER_JSON) {
      const encodedJSON = this.data['.dockerconfigjson'];

      if (encodedJSON) {
        const decodedJSON = base64Decode(encodedJSON);

        try {
          const auths = JSON.parse(decodedJSON).auths;
          const out = [];

          for (const domain in auths) {
            out.push(domain);
          }

          return out.join(', ');
        } catch (e) {
          return decodedJSON;
        }
      }
    } else if (this._type === TYPES.TLS) {
      return this.certInfo || this.keysDisplay;
    } else if ( this._type === TYPES.BASIC ) {
      return base64Decode(this.data.username);
    } else if ( this._type === TYPES.SSH ) {
      return this.sshUser;
    } else if ( this._type === TYPES.SERVICE_ACCT ) {
      return this.metadata?.annotations?.['kubernetes.io/service-account.name'];
    }

    return this.keysDisplay;
  }

  get sshUser() {
    if ( this._type !== TYPES.SSH ) {
      return null;
    }

    const pub = base64Decode(this.data['ssh-publickey']);

    if ( !pub ) {
      return null;
    }

    if ( pub.startsWith('----') ) {
      // PEM format
      const match = pub.match(/from OpenSSH by ([^"]+)"/);

      if ( match ) {
        return match[1];
      }
    } else if ( pub.startsWith('ssh-') ) {
      // OpenSSH format
      const parts = pub.replace(/\n/g, '').split(/\s+/);

      if ( parts && parts.length === 3 ) {
        return parts[2];
      }
    }

    return null;
  }

  get subTypeDisplay() {
    const type = this._type || '';
    const fallback = type.replace(/^kubernetes.io\//, '');

    return this.$rootGetters['i18n/withFallback'](`secret.types."${ type }"`, null, fallback);
  }

  // parse TLS certs and return issuer, notAfter, cn, sans
  get certInfo() {
    const pem = base64Decode(this.data['tls.crt']);
    let issuer, notBefore, notAfter, cn, sans, x;
    const END_MARKER = '-----END CERTIFICATE-----';

    if (pem) {
      const certs = pem.split(END_MARKER);
      let first = pem;

      if (certs.length > 1) {
        first = `${ certs[0] }${ END_MARKER }`;
      }

      try {
        x = new r.X509();

        x.readCertPEM(first);
        const issuerString = x.getIssuerString();

        issuer = issuerString.slice(issuerString.indexOf('CN=') + 3);
        notBefore = r.zulutodate(x.getNotBefore());
        notAfter = r.zulutodate(x.getNotAfter());

        const cnString = x.getSubjectString();

        cn = cnString.slice(cnString.indexOf('CN=') + 3);
      } catch {
        return null;
      }

      try {
        sans = x.getExtSubjectAltName();
      } catch (e) {
        sans = [];
      }

      const certInfo = {
        issuer, notBefore, notAfter, cn, sans
      };

      return certInfo;
    }

    return null;
  }

  get cachedCertInfo() {
    if (!this._cachedCertInfo) {
      this._cachedCertInfo = this.certInfo;
    }

    return this._cachedCertInfo;
  }

  // use for + n more name display
  get unrepeatedSans() {
    if (this._type === TYPES.TLS ) {
      const certInfo = this.cachedCertInfo;

      if (certInfo?.sans?.filter) {
        const commonBases = certInfo?.sans
          .filter((name) => name.indexOf('*.') === 0 || name.indexOf('www.') === 0)
          .map((name) => name.substr(name.indexOf('.')));
        const displaySans = removeObjects(certInfo?.sans, commonBases);

        return displaySans;
      }

      return certInfo?.sans?.array || certInfo?.sans || [];
    }

    return null;
  }

  get timeTilExpiration() {
    if (this._type === TYPES.TLS) {
      const certInfo = this.cachedCertInfo;

      if (!certInfo?.notAfter) {
        return null;
      }

      const expiration = certInfo.notAfter;
      const timeThen = expiration.valueOf();
      const timeNow = Date.now();

      const timeTilExpiration = timeThen - timeNow;

      return timeTilExpiration < 0 ? 0 : timeTilExpiration;
    }

    return null;
  }

  get timeTilExpirationDate() {
    return this.timeTilExpiration > 0 ? this.cachedCertInfo?.notAfter?.valueOf() : null;
  }

  get decodedData() {
    const out = {};

    for ( const k in this.data || {} ) {
      out[k] = base64Decode(this.data[k]);
    }

    return out;
  }

  get setData() {
    return (key, value) => { // or (mapOfNewData)
      const isMap = key && typeof key === 'object';

      if ( !this.data || isMap ) {
        set(this, 'data', {});
      }

      let neu;

      if ( isMap ) {
        neu = key;
      } else {
        neu = { [key]: value };
      }

      for ( const k in neu ) {
        // The key is quoted so that keys like '.dockerconfigjson' that contain dot don't get parsed into an object path
        set(this.data, `"${ k }"`, base64Encode(neu[k]));
      }
    };
  }

  get doneRoute() {
    if ( this.$rootGetters['currentProduct'].name === MANAGER ) {
      return 'c-cluster-manager-secret';
    } else {
      return 'c-cluster-product-resource';
    }
  }

  get certLifetime() {
    if (this._type === TYPES.TLS) {
      const certInfo = this.cachedCertInfo;

      if (certInfo) {
        return diffFrom(day(certInfo.notBefore), day(certInfo.notAfter), (key, args) => this.t(key, args)).string;
      }
    }

    return null;
  }

  /**
   * Get the model `state` for secrets of type cert
   */
  get certState() {
    if (this._type !== TYPES.TLS) {
      return undefined;
    }

    if (typeof this.timeTilExpiration !== 'number' || this.timeTilExpiration > certExpiringPeriod ) {
      return '';
    } else if (this.timeTilExpiration > 0) {
      return STATES_ENUM.EXPIRING;
    } else {
      return STATES_ENUM.EXPIRED;
    }
  }

  /**
   * Get the model `state display` for secrets of type cert
   */
  get certStateDisplay() {
    if (this._type !== TYPES.TLS) {
      return undefined;
    }

    return stateDisplay(this.certState);
  }

  /**
   * Get the model `state background` for secrets of type cert
   */
  get certStateBackground() {
    if (this._type !== TYPES.TLS) {
      return undefined;
    }

    const color = colorForState(this.certState);

    return color.replace('text-', 'bg-');
  }

  cleanForSave(data, forNew) {
    const val = super.cleanForSave(data, forNew);

    // Secrets on create with _type will return validation error
    // Secrets on edit without _type will return http error
    if (forNew) {
      delete val._type;
    }

    return val;
  }

  async cleanForDownload(yaml) {
    // secret resource contains the type attribute
    // ref: https://kubernetes.io/docs/reference/kubernetes-api/config-and-storage-resources/secret-v1/
    // ref: https://kubernetes.io/docs/concepts/configuration/secret/#secret-types

    return steveCleanForDownload(yaml, { rootKeys: ['id', 'links', 'actions'] });
  }

  /**
   * Is this a project scoped secret?
   */
  get isProjectScoped() {
    return !!this.projectScopedProjectName && !this.isProjectSecretCopy && this.$rootGetters['isRancher'];
  }

  /**
   * If this is a project scoped secret, return the cluster id the project is in
   */
  get projectScopedClusterId() {
    if (!this.projectScopedProjectName || this.isProjectSecretCopy) {
      return undefined;
    }

    // The easiest way to determine the cluster this secret is in is via it's namespace, however the format does not work on legacy systems or for default/system projects
    // metadata.namespace in legacy systems (2.9?) and current `System` + `Default` projects = `<project metadata.name>`. e.g `p-5ndcp`
    // metadata.namespace in current systems (from 2.12?) = `<cluster-id>-<project metadata.name>`. e.g `c-n22rm-p-5ndcp` or `c-n22rm-my-custom-metadata-name`

    // First try the easy way, clusterId from the secret's namespace
    if (this.metadata.namespace.length > this.projectScopedProjectName.length) {
      const clusterId = this.metadata.namespace.replace(`-${ this.projectScopedProjectName }`, '');

      if (clusterId.length) {
        return clusterId;
      }
    }

    // Second try to find the cluster id from the project itself
    if (this.project?.spec.clusterName) {
      return this.project?.spec.clusterName;
    }

    return '';
  }

  /**
   * If this is a project scoped secret, return the Project's metadata.name
   *
   * It's metadata.name as that's what the backend supplies. If can be anything the user wants if the project was created outside the UI
   */
  get projectScopedProjectName() {
    return this.metadata.labels?.[UI_PROJECT_SECRET];
  }

  /**
   * Is this a secret created by a project scoped secret?
   */
  get isProjectSecretCopy() {
    return this.metadata?.annotations?.[UI_PROJECT_SECRET_COPY] === 'true';
  }

  /**
   * If this is a project scoped secret, return the cluster the project is in
   */
  get projectCluster() {
    if (!this.isProjectScoped) {
      return undefined;
    }

    return this.$rootGetters[`${ STORE.MANAGEMENT }/byId`](MANAGEMENT.CLUSTER, this.projectScopedClusterId);
  }

  _projectScopedProjectId = null;
  /**
   * If this is a project scoped secret, return it's project
   *
   * (this should be called projectSecretsProject)
   */
  get project() {
    if (!this.isProjectScoped ) {
      return undefined;
    }

    // A secret's project id won't change, so once we have it don't determine again
    if (this._projectScopedProjectId === null) {
      // The below process kinda matches projectScopedClusterId, but to avoid chicken and egg scenario part is duplicated here
      // See comment in projectScopedClusterId why we do it this way

      // First try to construct the id via the cluster and project's metadata.name
      if (this.metadata.namespace.length > this.projectScopedProjectName.length) {
        const clusterId = this.metadata.namespace.replace(`-${ this.projectScopedProjectName }`, '');

        if (clusterId.length) {
          this._projectScopedProjectId = `${ clusterId }/${ this.projectScopedProjectName }`;
        }
      }

      // Second try to find the project from the current cluster's project list
      if (this._projectScopedProjectId === null) {
        const projects = this.$rootGetters[`${ STORE.MANAGEMENT }/all`](MANAGEMENT.PROJECT); // Only the projects in the current cluster, which helps when multiple clusters have projects with the same metadata.name
        const project = projects?.find((project) => project.metadata.name === this.projectScopedProjectName);

        this._projectScopedProjectId = project?.id;
      }
    }

    return this.$rootGetters[`${ STORE.MANAGEMENT }/byId`](MANAGEMENT.PROJECT, this._projectScopedProjectId);
  }

  get clusterAndProjectLabel() {
    if (!this.isProjectScoped) {
      return '';
    }

    // Cluster could be empty if not fetched
    const clusterName = this.projectCluster?.nameDisplay || this.projectScopedClusterId;
    // project is going to be empty if upstream and trying to show pss from downstream clusters
    // we only ever have the current clusters projects. if we change this (fetch them in the list)
    // we wipe out the header ns filter projects
    const projectName = this.project?.nameDisplay || this.projectScopedProjectName;

    if (clusterName && projectName) {
      return `${ projectName } (Cluster: ${ clusterName })`;
    }

    return '';
  }

  get detailLocation() {
    if (this.isProjectScoped) {
      const id = this.id?.replace(/.*\//, '');

      return {
        name:   `c-cluster-product-${ VIRTUAL_TYPES.PROJECT_SECRETS }-namespace-id`,
        params: {
          product:   this.$rootGetters['productId'],
          cluster:   this.$rootGetters['clusterId'],
          namespace: this.metadata?.namespace,
          resource:  VIRTUAL_TYPES.PROJECT_SECRETS,
          id,
        }
      };
    }

    return this._detailLocation;
  }

  get listLocation() {
    if (!this.isProjectScoped) {
      return super.listLocation;
    }

    return {
      name:   'c-cluster-product-resource',
      params: {
        product:  this.$rootGetters['productId'],
        cluster:  this.$rootGetters['clusterId'],
        resource: VIRTUAL_TYPES.PROJECT_SECRETS,
      }
    };
  }

  get parentNameOverride() {
    if (!this.isProjectScoped) {
      return super.parentNameOverride;
    }

    return this.$rootGetters['i18n/t'](`typeLabel."${ VIRTUAL_TYPES.PROJECT_SECRETS }"`, { count: 1 })?.trim();
  }

  get parentLocationOverride() {
    if (!this.isProjectScoped) {
      return super.parentNameOverride;
    }

    return this.listLocation;
  }

  get groupByProject() {
    if (!this.isProjectScoped) {
      return undefined;
    }

    return this.t('resourceTable.groupLabel.project', { name: escapeHtml(this?.project?.nameDisplay || '') }, true);
  }

  get fullDetailPageOverride() {
    return true;
  }
}
