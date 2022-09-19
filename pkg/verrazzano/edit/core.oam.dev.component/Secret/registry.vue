<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import RadioGroup from '@components/Form/Radio/RadioGroup';
import SecretHelper from '@pkg/mixins/secret-helper';

const KNOWN_REGISTRY_PROVIDERS_MAP = {
  'Oracle Container Registry': 'container-registry.oracle.com',
  'Docker Hub':                'index.docker.io/v1/',
  'Quay.io':                   'quay.io',
};

export default {
  name:       'RegistrySecret',
  components: {
    LabeledInput,
    RadioGroup,
  },
  mixins: [SecretHelper],
  props:  {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:    String,
      default: 'create'
    },
  },
  data() {
    let auths;

    try {
      // Cannot use computed property decodeData from inside the data() function...
      const parsed = JSON.parse(this.getDecodedData()['.dockerconfigjson'] || '{}');

      auths = parsed.auths;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to parse registry secret type: ', e);
    }
    auths = auths || {};
    const registryUrl = Object.keys(auths)[0] || '';
    let registryProvider = 'Custom';

    for (const [key, value] of Object.entries(KNOWN_REGISTRY_PROVIDERS_MAP)) {
      if (registryUrl === value) {
        registryProvider = key;
        break;
      }
    }

    const username = auths[registryUrl]?.username || '';
    const password = auths[registryUrl]?.password || '';
    const email = auths[registryUrl]?.email || '';

    return {
      registryProvider,
      username,
      password,
      email,
      registryUrl,
    };
  },
  computed: {
    registryAddresses() {
      return ['Custom', ...Object.keys(KNOWN_REGISTRY_PROVIDERS_MAP)];
    },
    needsDockerServer() {
      return this.registryProvider === 'Custom';
    },
    dockerconfigjson() {
      const dockerServer = this.needsDockerServer ? this.registryUrl : KNOWN_REGISTRY_PROVIDERS_MAP[this.registryProvider];

      if (dockerServer) {
        const config = {
          auths: {
            [dockerServer]: {
              username: this.username,
              password: this.password,
              email:    this.email,
            }
          }
        };

        return JSON.stringify(config);
      } else {
        return null;
      }
    },
  },
  methods: {
    update() {
      this.setData('.dockerconfigjson', this.dockerconfigjson);
    },
  },
  watch: {
    registryProvider: 'update',
    registryUrl:      'update',
    username:         'update',
    password:         'update',
    email:            'update',
  },
};
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-12">
        <RadioGroup
          v-model="registryProvider"
          :mode="mode"
          name="registryProvider"
          :options="registryAddresses"
          :label="t('verrazzano.common.fields.registryProvider')"
        />
      </div>
    </div>
    <div v-if="needsDockerServer" class="row mb-20">
      <LabeledInput v-model="registryUrl" required :label="t('secret.registry.domainName')" placeholder="e.g. index.docker.io" :mode="mode" />
    </div>
    <div class="row mb-20">
      <div class="col span-4">
        <LabeledInput v-model="username" :label="t('secret.registry.username')" :mode="mode" />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="password" :label="t('secret.registry.password')" :mode="mode" type="password" />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="email" :label="t('verrazzano.common.fields.registrySecretEmail')" :mode="mode" />
      </div>
    </div>
  </div>
</template>
