<script lang="ts">
import { useStore } from 'vuex';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { useI18n } from '@shell/composables/useI18n';
import { computed, ref } from 'vue';
import { SECRET_TYPES } from '@shell/config/secret';
import { base64Decode } from '@shell/utils/crypto';
import DetailText from '@shell/components/DetailText.vue';

export type SecretType = SECRET_TYPES.TLS | SECRET_TYPES.SSH | SECRET_TYPES.BASIC | SECRET_TYPES.DOCKER_JSON | SECRET_TYPES.OPAQUE;

export interface Props {
  secret: any;
  weight?: number;
}
</script>

<script lang="ts" setup>
const { weight, secret } = defineProps<Props>();

const store = useStore();
const { t } = useI18n(store);

const secretValue = computed(() => {
  return secret._type;
});

const tabLabel = computed(() => {
  switch (secretValue.value) {
  case SECRET_TYPES.TLS:
    return t('secret.certificate.certificate');
  case SECRET_TYPES.SSH:
    return t('secret.ssh.keys');
  case SECRET_TYPES.BASIC:
    return t('secret.authentication');
  default:
    return t('secret.data');
  }
});

const username = ref<string>();
const password = ref<string>();
const registryUrl = ref<string>();
const registryProvider = ref<string>('Custom');
const key = ref<string>();
const crt = ref<string>();

if (secretValue.value === SECRET_TYPES.DOCKER_JSON) {
  const json = base64Decode(secret.data['.dockerconfigjson']);

  const { auths } = JSON.parse(json);

  registryUrl.value = Object.keys(auths)[0];

  if (registryUrl.value === 'index.docker.io/v1/') {
    registryProvider.value = 'DockerHub';
  } else if (registryUrl.value === 'quay.io') {
    registryProvider.value = 'Quay.io';
  } else if (registryUrl.value.includes('artifactory')) {
    registryProvider.value = 'Artifactory';
  }

  username.value = auths[registryUrl.value].username;
  password.value = auths[registryUrl.value].password;
}

const data = secret.data || {};

if (secretValue.value === SECRET_TYPES.TLS) {
  key.value = base64Decode(data['tls.key']);
  crt.value = base64Decode(data['tls.crt']);
}

if (secretValue.value === SECRET_TYPES.SERVICE_ACCT) {
  key.value = base64Decode(data['token']);
  crt.value = base64Decode(data['ca.crt']);
}

if ( secretValue.value === SECRET_TYPES.BASIC ) {
  username.value = base64Decode(data.username || '');
  password.value = base64Decode(data.password || '');
}

if ( secretValue.value === SECRET_TYPES.SSH ) {
  username.value = base64Decode(data['ssh-publickey'] || '');
  password.value = base64Decode(data['ssh-privatekey'] || '');
}

if (!secretValue.value) {
  secret['_type'] = SECRET_TYPES.OPAQUE;
}

const isCertificate = computed(() => {
  return secretValue.value === SECRET_TYPES.TLS;
});

const isSvcAcctToken = computed(() => {
  return secretValue.value === SECRET_TYPES.SERVICE_ACCT;
});

const isRegistry = computed(() => {
  return secretValue.value === SECRET_TYPES.DOCKER_JSON;
});

const isSsh = computed(() => {
  return secretValue.value === SECRET_TYPES.SSH;
});

const isBasicAuth = computed(() => {
  return secretValue.value === SECRET_TYPES.BASIC;
});

const rows = computed(() => {
  const rows: any[] = [];
  const { data = {} } = secret;

  Object.keys(data).forEach((key) => {
    const value = base64Decode(data[key]);

    rows.push({
      key,
      value
    });
  });

  return rows;
});

</script>

<template>
  <Tab
    name="data"
    :label="tabLabel"
    :weight="weight"
  >
    <template v-if="isRegistry || isBasicAuth">
      <div
        v-if="isRegistry"
        class="row"
      >
        <div class="col span-12">
          <DetailText
            :value="registryUrl"
            label-key="secret.registry.domainName"
          />
        </div>
      </div>
      <div class="row mt-20">
        <div class="col span-6">
          <DetailText
            :value="username"
            label-key="secret.registry.username"
          />
        </div>
        <div class="col span-6">
          <DetailText
            :value="password"
            label-key="secret.registry.password"
            :conceal="true"
          />
        </div>
      </div>
    </template>

    <div
      v-else-if="isCertificate"
      class="row"
    >
      <div class="col span-6">
        <DetailText
          :value="key"
          label-key="secret.certificate.privateKey"
          :conceal="true"
        />
      </div>
      <div class="col span-6">
        <DetailText
          :value="crt"
          label-key="secret.certificate.certificate"
        />
      </div>
    </div>

    <div
      v-else-if="isSvcAcctToken"
      class="row"
    >
      <div class="col span-6">
        <DetailText
          :value="crt"
          label-key="secret.serviceAcct.ca"
        />
      </div>
      <div class="col span-6">
        <DetailText
          :value="key"
          label-key="secret.serviceAcct.token"
          :conceal="true"
        />
      </div>
    </div>

    <div
      v-else-if="isSsh"
      class="row"
    >
      <div class="col span-6">
        <DetailText
          :value="username"
          label-key="secret.ssh.public"
        />
      </div>
      <div class="col span-6">
        <DetailText
          :value="password"
          label-key="secret.ssh.private"
          :conceal="true"
        />
      </div>
    </div>

    <div v-else>
      <div
        v-for="(row,idx) in rows"
        :key="idx"
        class="entry"
      >
        <DetailText
          :value="row.value"
          :label="row.key"
          :conceal="true"
        />
      </div>
      <div v-if="!rows.length">
        <div
          class="m-20 text-center"
        >
          {{ t('sortableTable.noRows') }}
        </div>
      </div>
    </div>
  </Tab>
</template>

<style lang="scss" scoped>
  .entry {
    margin-top: 10px;

    &:first-of-type {
      margin-top: 0;
    }
  }
</style>
