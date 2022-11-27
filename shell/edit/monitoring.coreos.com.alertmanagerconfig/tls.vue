<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';
import SimpleSecretSelector from '@shell/components/form/SimpleSecretSelector';
import { _VIEW } from '@shell/config/query-params';

export default {
  components: {
    Banner, LabeledInput, SimpleSecretSelector
  },
  props: {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true
    },
    namespace: {
      type:     String,
      required: true
    }
  },
  data() {
    this.$set(this.value, 'tlsConfig', this.value.tlsConfig || {});

    return {
      initialCaSecretKey:          this.value.tlsConfig.ca?.secret?.key ? this.value.tlsConfig.ca.secret.key : '',
      initialCaSecretName:         this.value.tlsConfig.ca?.secret?.name ? this.value.tlsConfig.ca.secret.name : '',
      initialClientCertSecretKey:  this.value.tlsConfig.cert?.secret?.key ? this.value.tlsConfig.cert.secret.key : '',
      initialClientCertSecretName: this.value.tlsConfig.cert?.secret?.name ? this.value.tlsConfig.cert.secret.name : '',
      initialClientKeySecretKey:   this.value.tlsConfig.keySecret?.key ? this.value.tlsConfig.keySecret.key : '',
      initialClientKeySecretName:  this.value.tlsConfig.keySecret?.name ? this.value.tlsConfig.keySecret.name : '',
      view:                        _VIEW,
      none:                        '__[[NONE]]__'
    };
  },

  methods: {
    updateCaSecretName(name) {
      const existingKey = this.value.tlsConfig.ca?.secret?.key || '';

      if (!this.value.tlsConfig.ca) {
        this.value.tlsConfig['ca'] = {
          secret: {
            name,
            key: ''
          }
        };
      }

      if (this.value.tlsConfig.ca?.secret) {
        if (name === this.none) {
          // set the whole secret to blank if no secret is selected
          this.value.tlsConfig.ca = {};
        } else {
          this.value.tlsConfig.ca.secret = {

            key: existingKey,
            name
          };
        }
      } else {
        this.value.tlsConfig.ca['secret'] = {
          key: existingKey,
          name
        };
      }
    },
    updateCaSecretKey(key) {
      const existingName = this.value.tlsConfig.ca?.secret?.name || '';

      if (!this.value.tlsConfig.ca) {
        this.value.tlsConfig['ca'] = {
          secret: {
            name: '',
            key
          }
        };
      }

      if (this.value.tlsConfig.ca?.secret) {
        this.value.tlsConfig.ca.secret = {
          name: existingName,
          key
        };
      } else {
        this.value.tlsConfig.ca['secret'] = {
          key:  '',
          name: existingName
        };
      }
    },
    updateClientCertSecretName(name) {
      const existingKey = this.value.tlsConfig.cert?.secret?.key || '';

      if (!this.value.tlsConfig.cert) {
        this.value.tlsConfig['cert'] = {
          secret: {
            name,
            key: ''
          }
        };
      }

      if (this.value.tlsConfig.cert?.secret) {
        if (name === this.none) {
          // set the whole secret to blank if no secret is selected
          this.value.tlsConfig.cert = {};
        } else {
          this.value.tlsConfig.cert.secret = {

            key: existingKey,
            name
          };
        }
      } else {
        this.value.tlsConfig.cert['secret'] = {
          key: '',
          name
        };
      }
    },
    updateClientCertSecretKey(key) {
      const existingName = this.value.tlsConfig.cert?.secret?.name || '';

      if (!this.value.tlsConfig.cert) {
        this.value.tlsConfig['cert'] = {
          secret: {
            name: '',
            key
          }
        };
      }

      if (this.value.tlsConfig.cert?.secret) {
        this.value.tlsConfig.cert.secret = {
          name: existingName,
          key
        };
      } else {
        this.value.tlsConfig.cert['secret'] = {
          key:  '',
          name: existingName
        };
      }
    },
    updateClientKeySecretName(name) {
      const existingKey = this.value.tlsConfig.keySecret?.key || '';

      if (this.value.tlsConfig.keySecret) {
        if (name === this.none) {
          // set key to blank if no secret is selected
          this.value.tlsConfig.keySecret = {};
        } else {
          this.value.tlsConfig.keySecret = {
            key: existingKey,
            name
          };
        }
      } else {
        this.value.tlsConfig['keySecret'] = {
          key: '',
          name
        };
      }
    },
    updateClientKeySecretKey(key) {
      const existingName = this.value.tlsConfig.keySecret?.name || '';

      if (this.value.tlsConfig.keySecret) {
        this.value.tlsConfig.keySecret = {
          name: existingName,
          key
        };
      } else {
        this.value.tlsConfig['keySecret'] = {
          key,
          name: ''
        };
      }
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-12">
        <h3>{{ t('monitoring.receiver.tls.label') }}</h3>
      </div>
    </div>
    <div class="row mb-20">
      <SimpleSecretSelector
        v-if="namespace"
        :initial-key="initialCaSecretKey"
        :initial-name="initialCaSecretName"
        :mode="mode"
        :namespace="namespace"
        :disabled="mode === view"
        :secret-name-label="
          t('monitoringReceiver.tls.ca')
        "
        @updateSecretName="updateCaSecretName"
        @updateSecretKey="updateCaSecretKey"
      />
      <Banner
        v-else
        color="error"
      >
        {{ t("alertmanagerConfigReceiver.namespaceWarning") }}
      </Banner>
    </div>

    <div class="row mb-20">
      <SimpleSecretSelector
        v-if="namespace"
        :initial-key="initialClientCertSecretKey"
        :initial-name="initialClientCertSecretName"
        :mode="mode"
        :namespace="namespace"
        :disabled="mode === view"
        :secret-name-label="
          t('monitoringReceiver.tls.cert')
        "
        @updateSecretName="updateClientCertSecretName"
        @updateSecretKey="updateClientCertSecretKey"
      />
      <Banner
        v-else
        color="error"
      >
        {{ t("alertmanagerConfigReceiver.namespaceWarning") }}
      </Banner>
    </div>

    <div class="row mb-20">
      <SimpleSecretSelector
        v-if="namespace"
        :initial-key="initialClientKeySecretKey"
        :initial-name="initialClientKeySecretName"
        :mode="mode"
        :namespace="namespace"
        :disabled="mode === view"
        :secret-name-label="
          t('monitoringReceiver.tls.key')
        "
        @updateSecretName="updateClientKeySecretName"
        @updateSecretKey="updateClientKeySecretKey"
      />
      <Banner
        v-else
        color="error"
      >
        {{ t("alertmanagerConfigReceiver.namespaceWarning") }}
      </Banner>
    </div>

    <div class="row mb-20">
      <div class="col span-12">
        <LabeledInput
          v-model="value.tlsConfig.serverName"
          :mode="mode"
          :label="t('monitoringReceiver.tls.serverName')"
          :tooltip="t('monitoringReceiver.tls.serverNameTooltip')"
        />
      </div>
    </div>
  </div>
</template>
