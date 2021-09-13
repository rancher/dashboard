import { CAPI } from '@/config/labels-annotations';
import { fullFields, prefixFields, simplify, suffixFields } from '@/store/plugins';
import { isEmpty, set } from '@/utils/object';
import { SECRET } from '@/config/types';
import { escapeHtml } from '@/utils/string';

export default {
  hasSensitiveData: () => true,
  canCustomEdit:    () => true,

  _detailLocation() {
    return {
      name:   `c-cluster-manager-cloudCredential-id`,
      params: {
        product: this.$rootGetters['productId'],
        cluster: this.$rootGetters['clusterId'],
        id:      this.id,
      }
    };
  },

  parentLocationOverride() {
    return {
      name:   `c-cluster-manager-cloudCredential`,
      params: { cluster: this.$rootGetters['clusterId'] }
    };
  },

  secret() {
    return this.$rootGetters['management/byId'](SECRET, this.id.replace(':', '/'));
  },

  configKey() {
    return Object.keys(this).find( k => k.endsWith('credentialConfig'));
  },

  provider() {
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
  },

  setProvider() {
    return (neu) => {
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
    };
  },

  decodedData() {
    const k = this.configKey;

    if ( k ) {
      return this[k];
    }

    return {};
  },

  setData() {
    return (key, value) => { // or (mapOfNewData)
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
    };
  },

  providerDisplay() {
    const provider = (this.provider || '').toLowerCase();

    return this.$rootGetters['i18n/withFallback'](`cluster.provider."${ provider }"`, null, provider);
  },

  publicData() {
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
      return;
    }

    let val = this.decodedData[publicKey];

    if ( !val ) {
      val = this.secret?.decodedData?.[`${ this.provider }credentialConfig-${ publicKey }`];
    }

    if ( !val ) {
      return;
    }

    const maxLength = Math.min(8, Math.floor(val.length / 2));

    if ( publicMode === 'prefix' ) {
      return `${ escapeHtml(val.substr(0, maxLength)) }&hellip;`;
    } else if ( publicMode === 'suffix' ) {
      return `&hellip;${ escapeHtml(val.substr(-1 * maxLength)) }`;
    } else {
      return escapeHtml(val);
    }
  },

  doneRoute() {
    return 'c-cluster-manager-secret';
  },
};
