import { CAPI, CLOUD_CREDENTIALS } from '@shell/config/labels-annotations';
import { fullFields, prefixFields, simplify, suffixFields } from '@shell/store/plugins';
import { isEmpty, set } from '@shell/utils/object';
import { MANAGEMENT, SECRET } from '@shell/config/types';
import { escapeHtml } from '@shell/utils/string';
import NormanModel from '@shell/plugins/steve/norman-class';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import day from 'dayjs';

const harvesterProvider = 'harvester';

const renew = {
  [harvesterProvider]: {
    renew: ({ cloudCredential, $ctx }) => {
      return renew[harvesterProvider].renewBulk(
        { cloudCredentials: [cloudCredential], $ctx }
      );
    },
    renewBulk: async({ cloudCredentials, $ctx }) => {
      // A harvester cloud credential (at the moment) is a kubeconfig complete with expiring token
      // So to renew we just need to generate a new kubeconfig and save it to the cc (similar to shell/cloud-credential/harvester.vue)
      await Promise.all(cloudCredentials.map(async(cc) => {
        try {
          if (!cc.harvestercredentialConfig?.clusterId) {
            throw new Error(`credential has no matching harvester cluster`);
          }
          const mgmtCluster = $ctx.rootGetters['management/byId'](MANAGEMENT.CLUSTER, cc.harvestercredentialConfig.clusterId);

          if (!mgmtCluster) {
            throw new Error(`cannot find harvester cluster`);
          }

          const kubeconfigContent = await mgmtCluster.generateKubeConfig();

          cc.setData('kubeconfigContent', kubeconfigContent);

          await cc.save();
        } catch (error) {
          console.error(`Unable to refresh harvester cloud credential '${ cc.id }'`, error); // eslint-disable-line no-console
        }
      }));
    }
  }
};

export default class CloudCredential extends NormanModel {
  get _availableActions() {
    const out = super._availableActions;

    out.splice(0, 0, { divider: true });
    out.splice(0, 0, {
      action:     'renew',
      enabled:    this.canRenew,
      bulkable:   this.canBulkRenew,
      bulkAction: 'renewBulk',
      icon:       'icon icon-fw icon-refresh',
      label:      this.t('manager.cloudCredentials.renew'),
    });

    return out;
  }

  get hasSensitiveData() {
    return true;
  }

  get canCustomEdit() {
    return true;
  }

  get _detailLocation() {
    return {
      name:   `c-cluster-manager-cloudCredential-id`,
      params: {
        product: this.$rootGetters['productId'],
        cluster: this.$rootGetters['clusterId'],
        id:      this.id,
      }
    };
  }

  get parentLocationOverride() {
    return {
      name:   `c-cluster-manager-cloudCredential`,
      params: { cluster: this.$rootGetters['clusterId'] }
    };
  }

  get secretName() {
    return this.id.replace(':', '/');
  }

  get secret() {
    return this.$rootGetters['management/byId'](SECRET, this.secretName);
  }

  async getSecret() {
    await this.$dispatch('management/find', { type: SECRET, id: this.secretName }, { root: true });
  }

  get configKey() {
    return Object.keys(this).find( (k) => k.endsWith('credentialConfig'));
  }

  get provider() {
    const annotation = this.annotations?.[CAPI.CREDENTIAL_DRIVER];

    if ( annotation ) {
      return annotation;
    }

    const configKey = this.configKey;

    // Call [amazoneks,amazonec2] -> aws
    if ( configKey ) {
      const out = this.$rootGetters['plugins/credentialDriverFor'](configKey.replace(/credentialConfig$/, ''));

      return out;
    }

    return null;
  }

  setProvider(neu) {
    this.setAnnotation(CAPI.CREDENTIAL_DRIVER, neu);

    Object.keys(this).forEach((k) => {
      k = k.toLowerCase();

      if ( k.endsWith('config') && k !== `${ neu }config` ) {
        set(this, k, null);
      }
    });

    if ( !this[`${ neu }credentialConfig`] ) {
      set(this, `${ neu }credentialConfig`, {});
    }
  }

  get decodedData() {
    const k = this.configKey;

    if ( k ) {
      return this[k];
    }

    return {};
  }

  setData(key, value) { // or (mapOfNewData)
    const isMap = key && typeof key === 'object';

    if ( !this[this.configKey] || isMap ) {
      set(this, this.configKey, {});
    }

    let neu;

    if ( isMap ) {
      neu = key;
    } else {
      neu = { [key]: value };
    }

    for ( const k in neu ) {
      // The key is quoted so that keys like '.dockerconfigjson' that contain dot don't get parsed into an object path
      set(this, `"${ this.configKey }"."${ k }"`, neu[k]);
    }
  }

  get providerDisplay() {
    const provider = (this.provider || '').toLowerCase();

    return this.$rootGetters['i18n/withFallback'](`cluster.provider."${ provider }"`, null, provider);
  }

  get publicData() {
    let { publicKey, publicMode } = this.$rootGetters['plugins/credentialOptions'](this.provider);

    const options = {
      full:   fullFields,
      prefix: prefixFields,
      suffix: suffixFields,
    };

    if ( !publicKey ) {
      for ( const k in this.decodedData || {} ) {
        if ( publicKey ) {
          break;
        }

        if ( isEmpty(this.decodedData[k]) ) {
          continue;
        }

        for ( const mode in options ) {
          if ( options[mode].includes( simplify(k) ) ) {
            publicKey = k;
            publicMode = mode;
            break;
          }
        }
      }
    }

    if ( !publicKey ) {
      return null;
    }

    let val = this.decodedData[publicKey];

    if ( !val ) {
      val = this.secret?.decodedData?.[`${ this.provider }credentialConfig-${ publicKey }`];
    }

    if ( !val ) {
      return null;
    }

    const maxLength = Math.min(8, Math.floor(val.length / 2));

    if ( publicMode === 'prefix' ) {
      return `${ escapeHtml(val.substr(0, maxLength)) }&hellip;`;
    } else if ( publicMode === 'suffix' ) {
      return `&hellip;${ escapeHtml(val.substr(-1 * maxLength)) }`;
    } else {
      return escapeHtml(val);
    }
  }

  get doneRoute() {
    return 'c-cluster-manager-secret';
  }

  get canRenew() {
    return !!renew[this.provider]?.renew && this.expires !== undefined && this.canUpdate;
  }

  get canBulkRenew() {
    return !!renew[this.provider]?.renewBulk;
  }

  get expiresForSort() {
    // Why not just `expires`? Ensures the correct sort order of expired --> expiring --> never expires
    // (instead of 'never expired' --> 'expired' --> 'expiring')
    return this.expires !== undefined ? this.expires : Number.MAX_SAFE_INTEGER;
  }

  get expires() {
    const expires = this.annotations[CLOUD_CREDENTIALS.EXPIRATION];

    if (typeof expires === 'string') {
      return parseInt(expires);
    } else if (typeof expires === 'number') {
      return expires;
    }

    return undefined; // Weird things happen if this isn't a number
  }

  get expireData() {
    if (typeof this.expiresIn !== 'number') {
      return null;
    }

    const sevenDays = 1000 * 60 * 60 * 24 * 7;

    if (this.expiresIn === 0) {
      return {
        expired:  true,
        expiring: false,
      };
    } else if (this.expiresIn < sevenDays) {
      return {
        expired:  false,
        expiring: true,
      };
    }

    return null;
  }

  get expiresString() {
    if (this.expires === undefined) {
      return '';
    }

    if (this.expireData.expired) {
      return this.t('manager.cloudCredentials.expired');
    }

    const dateFormat = escapeHtml( this.$rootGetters['prefs/get'](DATE_FORMAT));
    const timeFormat = escapeHtml( this.$rootGetters['prefs/get'](TIME_FORMAT));

    return day(this.expires).format(`${ dateFormat } ${ timeFormat }`);
  }

  get expiresIn() {
    if (this.expires === undefined) {
      return null;
    }

    const timeThen = this.expires;
    const timeNow = Date.now();

    const expiresIn = timeThen - timeNow;

    return expiresIn < 0 ? 0 : expiresIn;
  }

  renew() {
    const renewFn = renew[this.provider]?.renew;

    if (!renewFn) {
      console.error('No fn renew function for ', this.provider); // eslint-disable-line no-console
    }

    return renewFn({
      cloudCredential: this,
      $ctx:            this.$ctx
    });
  }

  async renewBulk(cloudCredentials = []) {
    const renewBulkFn = renew[this.provider]?.renewBulk;

    if (!renewBulkFn) {
      console.error('No fn renew bulk function for ', this.provider); // eslint-disable-line no-console
    }

    return renewBulkFn({
      cloudCredentials,
      $ctx: this.$ctx
    });
  }
}
