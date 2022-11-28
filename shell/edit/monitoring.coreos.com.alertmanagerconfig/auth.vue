<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SimpleSecretSelector from '@shell/components/form/SimpleSecretSelector';
import isEmpty from 'lodash/isEmpty';
import { _VIEW } from '@shell/config/query-params';

export default {
  components: { LabeledSelect, SimpleSecretSelector },
  props:      {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true,
    },
    namespace: {
      type:     String,
      required: true
    }
  },
  data() {
    this.$set(this.value, 'basicAuth', this.value.basicAuth || {});

    const authOptions = [
      {
        value: 'none',
        label: this.t('monitoringReceiver.auth.none.label'),
      },
      {
        value:   'basicAuth',
        label:   this.t('monitoringReceiver.auth.basicAuth.label'),
        default: {},
      },
      {
        value:   'bearerTokenSecret',
        label:   this.t('monitoringReceiver.auth.bearerToken.label'),
        default: {},
      },
    ];
    const authTypes = authOptions.map(option => option.value);
    const authType =
      authTypes.find(authType => !isEmpty(this.value[authType])) ||
      authTypes[0];

    this.initializeType(authOptions, authType);

    return {
      authOptions,
      authTypes,
      authType,
      view:                               _VIEW,
      none:                               '__[[NONE]]__',
      initialBearerTokenSecretName:       this.value?.bearerTokenSecret?.name ? this.value.bearerTokenSecret.name : '',
      initialBearerTokenSecretKey:        this.value?.bearerTokenSecret?.key ? this.value.bearerTokenSecret.key : '',
      initialBasicAuthUsernameSecretName: this.value?.basicAuth?.username?.name ? this.value.basicAuth.username.name : '',
      initialBasicAuthUsernameSecretKey:  this.value?.basicAuth?.username?.key ? this.value.basicAuth.username.key : '',
      initialBasicAuthPasswordSecretName: this.value?.basicAuth?.password?.name ? this.value.basicAuth.password.name : '',
      initialBasicAuthPasswordSecretKey:  this.value?.basicAuth?.password?.key ? this.value.basicAuth.password.key : ''
    };
  },
  methods: {
    initializeType(authOptions, type) {
      authOptions.forEach((authOption) => {
        if (authOption.value === type && type !== 'none') {
          this.$set(
            this.value,
            authOption.value,
            this.value[authOption.value] || authOption.default
          );
        } else if (typeof this.value[authOption.value] !== 'undefined') {
          this.$delete(this.value, authOption.value);
        }
      });
    },
    updateBearerTokenSecretName(name) {
      const existingKey = this.value.bearerTokenSecret?.key || '';

      if (this.value.bearerTokenSecret) {
        if (name === this.none) {
          delete this.value.bearerTokenSecret;
        } else {
          this.value.bearerTokenSecret = {
            key: existingKey,
            name,
          };
        }
      } else {
        this.value['bearerTokenSecret'] = {
          key: '',
          name,
        };
      }
    },
    updateBearerTokenSecretKey(key) {
      const existingName = this.value.bearerTokenSecret?.name || '';

      if (this.value.bearerTokenSecret) {
        this.value.bearerTokenSecret = {
          name: existingName,
          key,
        };
      } else {
        this.value['bearerTokenSecret'] = {
          name: '',
          key,
        };
      }
    },
    updateBasicAuthUsernameSecretName(name) {
      if (!this.value.basicAuth) {
        this.value['basicAuth'] = {
          username: {
            key: '',
            name
          },
          password: {
            key:  '',
            name: ''
          }
        };
      }

      const existingKey = this.value.basicAuth.username?.key || '';

      if (this.value.basicAuth.username) {
        if (name === this.none) {
          // Clear out the secret data if none is selected
          delete this.value.basicAuth.username;
        } else {
          this.value.basicAuth.username = {
            key: existingKey,
            name,
          };
        }
      } else {
        this.value.basicAuth['username'] = {
          key: '',
          name,
        };
      }
    },
    updateBasicAuthUsernameSecretKey(key) {
      if (!this.value.basicAuth) {
        this.value['basicAuth'] = {
          username: {
            key,
            name: ''
          },
          password: {
            key:  '',
            name: ''
          }
        };
      }

      const existingName = this.value.basicAuth.username?.name || '';

      if (this.value.basicAuth.username) {
        this.value.basicAuth.username = {
          key,
          name: existingName
        };
      } else {
        this.value.basicAuth['username'] = {
          key,
          name: '',
        };
      }
    },
    updateBasicAuthPasswordSecretName(name) {
      if (!this.value.basicAuth) {
        this.value['basicAuth'] = {
          username: {
            key:  '',
            name: ''
          },
          password: {
            key: '',
            name
          }
        };
      }

      const existingKey = this.value.basicAuth.password?.key || '';

      if (this.value.basicAuth.password) {
        if (name === this.none) {
          // Clear out the secret data if no secret is selected
          delete this.value.basicAuth.password;
        } else {
          this.value.basicAuth.password = {
            key: existingKey,
            name,
          };
        }
      } else {
        this.value.basicAuth['password'] = {
          key: '',
          name,
        };
      }
    },
    updateBasicAuthPasswordSecretKey(key) {
      if (!this.value.basicAuth) {
        this.value['basicAuth'] = {
          username: {
            key:  '',
            name: ''
          },
          password: {
            key,
            name: ''
          }
        };
      }

      const existingName = this.value.basicAuth.password?.name || '';

      if (this.value.basicAuth.password) {
        this.value.basicAuth.password = {
          key,
          name: existingName,
        };
      } else {
        this.value.basicAuth['password'] = {
          key,
          name: '',
        };
      }
    }
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <h3>{{ t("monitoringReceiver.auth.label") }}</h3>
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledSelect
          v-model="authType"
          :disabled="mode === view"
          :options="authOptions"
          label="Auth Type"
          @input="initializeType(authOptions, authType)"
        />
      </div>
    </div>
    <div
      v-if="authType === 'basicAuth'"
      class="row mb-20"
    >
      <SimpleSecretSelector
        v-if="namespace"
        :initial-key="initialBasicAuthUsernameSecretKey"
        :initial-name="initialBasicAuthUsernameSecretName"
        :mode="mode"
        :namespace="namespace"
        :disabled="mode === view"
        :secret-name-label="
          t('monitoring.alertmanagerConfig.auth.basicAuthUsername')
        "
        @updateSecretName="updateBasicAuthUsernameSecretName"
        @updateSecretKey="updateBasicAuthUsernameSecretKey"
      />
      <Banner
        v-else
        color="error"
      >
        {{ t("alertmanagerConfigReceiver.namespaceWarning") }}
      </Banner>
    </div>
    <div
      v-if="authType === 'basicAuth'"
      class="row mb-20"
    >
      <SimpleSecretSelector
        v-if="namespace"
        :initial-key="initialBasicAuthPasswordSecretKey"
        :initial-name="initialBasicAuthPasswordSecretName"
        :mode="mode"
        :namespace="namespace"
        :disabled="mode === view"
        :secret-name-label="
          t('monitoring.alertmanagerConfig.auth.basicAuthPassword')
        "
        @updateSecretName="updateBasicAuthPasswordSecretName"
        @updateSecretKey="updateBasicAuthPasswordSecretKey"
      />
      <Banner
        v-else
        color="error"
      >
        {{ t("alertmanagerConfigReceiver.namespaceWarning") }}
      </Banner>
    </div>
    <div
      v-if="authType === 'bearerTokenSecret'"
      class="row mb-20"
    >
      <SimpleSecretSelector
        v-if="namespace"
        :initial-key="initialBearerTokenSecretKey"
        :initial-name="initialBearerTokenSecretName"
        :mode="mode"
        :namespace="namespace"
        :disabled="mode === view"
        :secret-name-label="
          t('monitoring.alertmanagerConfig.auth.bearerTokenSecret')
        "
        @updateSecretName="updateBearerTokenSecretName"
        @updateSecretKey="updateBearerTokenSecretKey"
      />
      <Banner
        v-else
        color="error"
      >
        {{ t("alertmanagerConfigReceiver.namespaceWarning") }}
      </Banner>
    </div>
  </div>
</template>
