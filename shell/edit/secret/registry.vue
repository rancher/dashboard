<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';

const HARBOR_AUTH_KEY = 'rancher.cn/registry-harbor-auth';
const HARBOR_ADMIN_AUTH_KEY = 'rancher.cn/registry-harbor-admin-auth';

export default {
  components: { LabeledInput, RadioGroup },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:     String,
      required: true,
    }
  },

  async fetch() {
    if ( this.harborRegistryUrl ) {
      return;
    }

    try {
      this.harborRegistryUrl = await this.$store.dispatch('management/request', { url: '/v3/settings/harbor-server-url' }).then((resp) => {
        return resp?.value || '';
      });
    } catch (e) {
      console.error('Failed to fetch harborRegistryUrl'); // eslint-disable-line no-console
    }
  },

  data() {
    let registryProvider = 'Custom';

    let auths;

    try {
      const parsed = JSON.parse(this.value.decodedData['.dockerconfigjson']);

      auths = parsed.auths;
    } catch (e) {}

    auths = auths || {};

    const registryUrl = Object.keys(auths)[0] || '';

    if (registryUrl === 'index.docker.io/v1/') {
      registryProvider = 'DockerHub';
    } else if (registryUrl === 'quay.io') {
      registryProvider = 'Quay.io';
    } else if (registryUrl.includes('artifactory')) {
      registryProvider = 'Artifactory';
    } else if (this.value?.metadata?.labels?.[HARBOR_AUTH_KEY] === 'true') {
      registryProvider = 'Harbor';
    }

    const username = auths[registryUrl]?.username || '';
    const password = auths[registryUrl]?.password || '';

    return {
      registryProvider,
      username,
      password,
      registryUrl,
      harborRegistryUrl: '',
    };
  },

  computed: {
    registryAddresses() {
      if (this.enabledHarborService || this.value?.metadata?.labels?.[HARBOR_AUTH_KEY] === 'true') {
        return ['Custom', 'DockerHub', 'Harbor', 'Quay.io', 'Artifactory'];
      }

      return ['Custom', 'DockerHub', 'Quay.io', 'Artifactory'];
    },

    needsDockerServer() {
      return this.registryProvider === 'Artifactory' || this.registryProvider === 'Custom' || this.registryProvider === 'Harbor';
    },
    isHarbor() {
      return this.registryProvider === 'Harbor';
    },
    isNew() {
      return this.mode === 'create';
    },
    enabledHarborService() {
      const isAdmin = this.$store.getters['auth/isAdmin'];
      const v3User = this.$store.getters['auth/me'] || {};

      if (this.harborRegistryUrl) {
        if (isAdmin) {
          return true;
        }
        const a = v3User.annotations || {};

        if (a && a['management.harbor.pandaria.io/synccomplete'] === 'true') {
          return true;
        }
      }

      return false;
    },

    dockerconfigjson() {
      let dockerServer = this.registryProvider === 'DockerHub' ? 'index.docker.io/v1/' : 'quay.io';

      if (this.needsDockerServer) {
        dockerServer = this.registryUrl;
      }

      if (this.registryProvider === 'Harbor' && this.enabledHarborService) {
        dockerServer = dockerServer.includes('://') ? dockerServer.substr(dockerServer.indexOf('://') + 3) : dockerServer;
        const labels = this.value?.metadata?.labels || {};
        const isAdmin = this.$store.getters['auth/isAdmin'];

        labels[HARBOR_AUTH_KEY] = 'true';
        if (isAdmin) {
          labels[HARBOR_ADMIN_AUTH_KEY] = 'true';
        }
        this.value.setLabels(labels);
      } else {
        const labels = this.value?.metadata?.labels || {};

        if (labels) {
          const keys = Object.keys(labels);

          if (keys.includes(HARBOR_AUTH_KEY)) {
            delete labels[HARBOR_AUTH_KEY];
          }
          if (keys.includes(HARBOR_ADMIN_AUTH_KEY)) {
            delete labels[HARBOR_ADMIN_AUTH_KEY];
          }
          if (Object.keys(labels).length === 0) {
            delete this.value.metadata.labels;
          }
        }
      }

      if (dockerServer) {
        const config = {
          auths: {
            [dockerServer]: {
              username: this.username,
              password: this.password,
            }
          }
        };
        const json = JSON.stringify(config);

        return json;
      } else {
        return null;
      }
    },
  },

  watch: {
    registryProvider: 'update',
    registryUrl:      'update',
    username:         'update',
    password:         'update',
  },

  methods: {
    update() {
      this.value.setData('.dockerconfigjson', this.dockerconfigjson);
    },

    updateHarborRegistryUrl(val) {
      if (val === 'Harbor' && this.harborRegistryUrl) {
        this.$set(this, 'registryUrl', this.harborRegistryUrl);
      }
    }
  }
};
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-12">
        <RadioGroup
          v-model="registryProvider"
          name="registryProvider"
          :mode="mode"
          :options="registryAddresses"
          @input="updateHarborRegistryUrl"
        />
      </div>
    </div>
    <div v-if="needsDockerServer" class="row mb-20">
      <LabeledInput
        v-model="registryUrl"
        required
        :disabled="isHarbor"
        :label="t('secret.registry.domainName')"
        placeholder="e.g. index.docker.io"
        :mode="mode"
      />
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput v-model="username" :label="t('secret.registry.username')" :mode="mode" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="password" :label="t('secret.registry.password')" :mode="mode" type="password" />
      </div>
    </div>
  </div>
</template>
