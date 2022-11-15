<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';

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
    }

    const username = auths[registryUrl]?.username || '';
    const password = auths[registryUrl]?.password || '';

    return {
      registryProvider,
      username,
      password,
      registryUrl,
    };
  },

  computed: {
    registryAddresses() {
      return ['Custom', 'DockerHub', 'Quay.io', 'Artifactory'];
    },

    needsDockerServer() {
      return this.registryProvider === 'Artifactory' || this.registryProvider === 'Custom';
    },

    dockerconfigjson() {
      let dockerServer = this.registryProvider === 'DockerHub' ? 'index.docker.io/v1/' : 'quay.io';

      if (this.needsDockerServer) {
        dockerServer = this.registryUrl;
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
        />
      </div>
    </div>
    <div
      v-if="needsDockerServer"
      class="row mb-20"
    >
      <LabeledInput
        v-model="registryUrl"
        required
        :label="t('secret.registry.domainName')"
        placeholder="e.g. index.docker.io"
        :mode="mode"
      />
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="username"
          :label="t('secret.registry.username')"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="password"
          :label="t('secret.registry.password')"
          :mode="mode"
          type="password"
        />
      </div>
    </div>
  </div>
</template>
